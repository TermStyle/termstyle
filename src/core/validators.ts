/**
 * Input Validation Framework
 * Provides comprehensive validation for all user inputs
 */

import { ColorInput, RGBTuple } from './color-processor';

export type ValidatedColor = {
  type: 'rgb' | 'hex' | 'name' | 'number';
  value: RGBTuple;
  original: ColorInput;
};

export type AnimationType = 'dots' | 'line' | 'star' | 'flip' | 'grow' | 'balloon' | 
                            'noise' | 'bounce' | 'boxing' | 'arc' | 'circle' | 
                            'square' | 'triangle' | 'arrow' | 'bouncingBar' | 
                            'toggle' | 'smiley' | 'monkey' | 'hearts' | 'clock' | 
                            'earth' | 'moon' | 'weather' | 'christmas' | 'grenade' | 
                            'point' | 'layer' | 'betaWave' | 'aesthetic';

export type ValidatedPercent = {
  value: number;
  clamped: boolean;
  original: number;
};

export type ValidatedTextInput = {
  text: string;
  hasControlChars: boolean;
  hasAnsiCodes: boolean;
  isEmpty: boolean;
};

export type ValidationResult<T> = {
  valid: boolean;
  value?: T;
  error?: string;
  warnings?: string[];
};

export class InputValidator {
  private static readonly HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  private static readonly RGB_PATTERN = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/;
  private static readonly HSL_PATTERN = /^hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)$/;
  // eslint-disable-next-line no-control-regex
  private static readonly ANSI_PATTERN = /\u001b\[[0-9;]*m/g;
  // eslint-disable-next-line no-control-regex
  private static readonly CONTROL_CHAR_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

  /**
   * Validate color input
   */
  static validateColor(input: ColorInput): ValidationResult<ValidatedColor> {
    if (input == null) {
      return {
        valid: false,
        error: 'Color input cannot be null or undefined'
      };
    }

    // RGB tuple validation
    if (Array.isArray(input)) {
      const inputArray = input as unknown[];
      if (inputArray.length !== 3) {
        return {
          valid: false,
          error: `RGB array must have exactly 3 values, got ${inputArray.length}`
        };
      }

      const warnings: string[] = [];
      const validated: [number, number, number] = [0, 0, 0];

      for (let i = 0; i < 3; i++) {
        const value = inputArray[i];
        if (typeof value !== 'number') {
          return {
            valid: false,
            error: `RGB value at index ${i} must be a number, got ${typeof value}`
          };
        }

        if (!Number.isFinite(value)) {
          return {
            valid: false,
            error: `RGB value at index ${i} must be finite, got ${value}`
          };
        }

        // Clamp and warn
        if (value < 0 || value > 255) {
          warnings.push(`RGB value ${value} at index ${i} was clamped to 0-255 range`);
        }
        validated[i] = Math.max(0, Math.min(255, Math.round(value)));
      }

      return {
        valid: true,
        value: {
          type: 'rgb',
          value: validated,
          original: input
        },
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    // Number validation
    if (typeof input === 'number') {
      if (!Number.isFinite(input)) {
        return {
          valid: false,
          error: `Color number must be finite, got ${input}`
        };
      }

      const warnings: string[] = [];
      let value = input;

      if (value < 0 || value > 0xffffff) {
        warnings.push(`Color number ${value} was clamped to 0x000000-0xFFFFFF range`);
        value = Math.max(0, Math.min(0xffffff, Math.floor(value)));
      }

      const r = (value >> 16) & 0xff;
      const g = (value >> 8) & 0xff;
      const b = value & 0xff;

      return {
        valid: true,
        value: {
          type: 'number',
          value: [r, g, b] as RGBTuple,
          original: input
        },
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    // String validation
    if (typeof input === 'string') {
      const trimmed = input.trim();
      
      if (trimmed.length === 0) {
        return {
          valid: false,
          error: 'Color string cannot be empty'
        };
      }

      // Check hex
      if (this.HEX_PATTERN.test(trimmed)) {
        return {
          valid: true,
          value: {
            type: 'hex',
            value: [0, 0, 0] as RGBTuple, // Will be converted by color processor
            original: input
          }
        };
      }

      // Check rgb()
      const rgbMatch = trimmed.match(this.RGB_PATTERN);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10);
        const g = parseInt(rgbMatch[2], 10);
        const b = parseInt(rgbMatch[3], 10);
        
        return this.validateColor([r, g, b]);
      }

      // Check hsl()
      if (this.HSL_PATTERN.test(trimmed)) {
        return {
          valid: true,
          value: {
            type: 'name', // Treat HSL as name for now
            value: [0, 0, 0] as RGBTuple, // Will be converted by color processor
            original: input
          }
        };
      }

      // Assume color name
      return {
        valid: true,
        value: {
          type: 'name',
          value: [0, 0, 0] as RGBTuple, // Will be converted by color processor
          original: input
        }
      };
    }

    return {
      valid: false,
      error: `Invalid color input type: ${typeof input}`
    };
  }

  /**
   * Validate percentage value
   */
  static validatePercent(value: number, allowNegative: boolean = false): ValidationResult<ValidatedPercent> {
    if (typeof value !== 'number') {
      return {
        valid: false,
        error: `Percent must be a number, got ${typeof value}`
      };
    }

    if (!Number.isFinite(value)) {
      return {
        valid: false,
        error: `Percent must be finite, got ${value}`
      };
    }

    const min = allowNegative ? -1 : 0;
    const clamped = Math.max(min, Math.min(1, value));
    const wasClamped = clamped !== value;

    return {
      valid: true,
      value: {
        value: clamped,
        clamped: wasClamped,
        original: value
      },
      warnings: wasClamped ? [`Percent value ${value} was clamped to ${min}-1 range`] : undefined
    };
  }

  /**
   * Validate animation type
   */
  static validateAnimationType(type: string): ValidationResult<AnimationType> {
    const validTypes: AnimationType[] = [
      'dots', 'line', 'star', 'flip', 'grow', 'balloon', 'noise', 'bounce',
      'boxing', 'arc', 'circle', 'square', 'triangle', 'arrow', 'bouncingBar',
      'toggle', 'smiley', 'monkey', 'hearts', 'clock', 'earth', 'moon',
      'weather', 'christmas', 'grenade', 'point', 'layer', 'betaWave', 'aesthetic'
    ];

    if (typeof type !== 'string') {
      return {
        valid: false,
        error: `Animation type must be a string, got ${typeof type}`
      };
    }

    const normalized = type.trim().toLowerCase();
    const found = validTypes.find(t => t.toLowerCase() === normalized);

    if (!found) {
      return {
        valid: false,
        error: `Invalid animation type '${type}'. Valid types: ${validTypes.join(', ')}`
      };
    }

    return {
      valid: true,
      value: found
    };
  }

  /**
   * Validate text input
   */
  static validateText(text: unknown): ValidationResult<ValidatedTextInput> {
    if (text == null) {
      return {
        valid: true,
        value: {
          text: '',
          hasControlChars: false,
          hasAnsiCodes: false,
          isEmpty: true
        }
      };
    }

    if (typeof text !== 'string') {
      // Try to convert to string
      try {
        const converted = String(text);
        return this.validateText(converted);
      } catch {
        return {
          valid: false,
          error: `Cannot convert ${typeof text} to string`
        };
      }
    }

    const hasControlChars = this.CONTROL_CHAR_PATTERN.test(text);
    const hasAnsiCodes = this.ANSI_PATTERN.test(text);
    const isEmpty = text.length === 0;

    const warnings: string[] = [];
    if (hasControlChars) {
      warnings.push('Text contains control characters that may affect output');
    }
    if (hasAnsiCodes) {
      warnings.push('Text contains ANSI escape codes that will be preserved');
    }

    return {
      valid: true,
      value: {
        text,
        hasControlChars,
        hasAnsiCodes,
        isEmpty
      },
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate array of colors
   */
  static validateColorArray(colors: unknown[]): ValidationResult<ValidatedColor[]> {
    if (!Array.isArray(colors)) {
      return {
        valid: false,
        error: 'Colors must be an array'
      };
    }

    // Filter out null/undefined values
    const validColors = colors.filter(c => c != null);
    
    if (validColors.length === 0) {
      return {
        valid: false,
        error: 'Color array cannot be empty or contain only null/undefined values'
      };
    }

    const results: ValidatedColor[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Track skipped null/undefined values
    const skippedCount = colors.length - validColors.length;
    if (skippedCount > 0) {
      warnings.push(`Skipped ${skippedCount} null/undefined color(s)`);
    }

    for (let i = 0; i < validColors.length; i++) {
      const result = this.validateColor(validColors[i] as ColorInput);
      
      if (!result.valid) {
        errors.push(`Color at index ${i}: ${result.error}`);
      } else {
        results.push(result.value!);
        if (result.warnings) {
          warnings.push(...result.warnings.map(w => `Color at index ${i}: ${w}`));
        }
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        error: errors.join('; ')
      };
    }

    return {
      valid: true,
      value: results,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate number is positive
   */
  static validatePositiveNumber(value: number, name: string): ValidationResult<number> {
    if (typeof value !== 'number') {
      return {
        valid: false,
        error: `${name} must be a number, got ${typeof value}`
      };
    }

    if (!Number.isFinite(value)) {
      return {
        valid: false,
        error: `${name} must be finite, got ${value}`
      };
    }

    if (value <= 0) {
      return {
        valid: false,
        error: `${name} must be positive, got ${value}`
      };
    }

    return { valid: true, value };
  }

  /**
   * Validate integer
   */
  static validateInteger(value: number, name: string, min?: number, max?: number): ValidationResult<number> {
    const numberResult = this.validatePositiveNumber(value, name);
    if (!numberResult.valid) {
      return numberResult;
    }

    if (!Number.isInteger(value)) {
      return {
        valid: false,
        error: `${name} must be an integer, got ${value}`
      };
    }

    if (min !== undefined && value < min) {
      return {
        valid: false,
        error: `${name} must be at least ${min}, got ${value}`
      };
    }

    if (max !== undefined && value > max) {
      return {
        valid: false,
        error: `${name} must be at most ${max}, got ${value}`
      };
    }

    return { valid: true, value };
  }

  /**
   * Strip ANSI codes from text
   */
  static stripAnsiCodes(text: string): string {
    return text.replace(this.ANSI_PATTERN, '');
  }

  /**
   * Check if text has ANSI codes
   */
  static hasAnsiCodes(text: string): boolean {
    return this.ANSI_PATTERN.test(text);
  }

  /**
   * Sanitize text by removing control characters
   */
  static sanitizeText(text: string, preserveAnsi: boolean = true): string {
    let sanitized = text.replace(this.CONTROL_CHAR_PATTERN, '');
    
    if (!preserveAnsi) {
      sanitized = this.stripAnsiCodes(sanitized);
    }
    
    return sanitized;
  }
}