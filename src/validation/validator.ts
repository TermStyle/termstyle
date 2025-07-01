export class ValidationError extends Error {
  constructor(message: string, public code: string, public input?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export class InputValidator {
  private static readonly DANGEROUS_ANSI_PATTERNS = [
    /* eslint-disable no-control-regex */
    /\u001B\[2J/g,        // Clear screen
    /\u001B\[H/g,         // Home cursor
    /\u001B\[3J/g,        // Clear scrollback
    /\u001B\[\?1049[hl]/g, // Alternate screen
    /\u001B\]0;[^\u0007]*\u0007/g,  // Terminal title (non-greedy)
    /\u001B\[8m/g,        // Hidden text
    /\u001B\[\?25[lh]/g   // Cursor visibility
    /* eslint-enable no-control-regex */
  ];

  static validateRGB(r: unknown, g: unknown, b: unknown): RGB {
    const values = [r, g, b];
    const names = ['red', 'green', 'blue'];
    
    for (let i = 0; i < 3; i++) {
      const value = values[i];
      const name = names[i];
      
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new ValidationError(
          `${name} must be an integer`,
          'INVALID_COLOR_COMPONENT',
          value
        );
      }
      
      if (value < 0 || value > 255) {
        throw new ValidationError(
          `${name} must be between 0 and 255`,
          'COLOR_OUT_OF_RANGE',
          value
        );
      }
    }
    
    return { r: r as number, g: g as number, b: b as number };
  }

  static validateHex(hex: unknown): string {
    if (typeof hex !== 'string') {
      throw new ValidationError(
        'Hex color must be a string',
        'INVALID_HEX_TYPE',
        hex
      );
    }
    
    const normalized = hex.trim().replace('#', '');
    
    if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
      throw new ValidationError(
        'Invalid hex color format. Expected format: #RRGGBB',
        'INVALID_HEX_FORMAT',
        hex
      );
    }
    
    return normalized;
  }

  static validateAnsi256(code: unknown): number {
    if (typeof code !== 'number' || !Number.isInteger(code)) {
      throw new ValidationError(
        'ANSI 256 color code must be an integer',
        'INVALID_ANSI256_TYPE',
        code
      );
    }
    
    if (code < 0 || code > 255) {
      throw new ValidationError(
        'ANSI 256 color code must be between 0 and 255',
        'ANSI256_OUT_OF_RANGE',
        code
      );
    }
    
    return code;
  }

  static sanitizeText(text: unknown): string {
    if (text === null || text === undefined) {
      return '';
    }
    
    const stringified = String(text);
    
    // Remove dangerous ANSI sequences
    let sanitized = stringified;
    for (const pattern of this.DANGEROUS_ANSI_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    
    return sanitized;
  }

  static validateTemplateInput(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Prevent prototype pollution
    if (typeof value === 'object') {
      const str = String(value);
      if (str === '[object Object]') {
        return JSON.stringify(value);
      }
      return str;
    }
    
    return this.sanitizeText(value);
  }

  static validateRegexPattern(pattern: string, maxLength: number = 1000): RegExp {
    if (pattern.length > maxLength) {
      throw new ValidationError(
        'Pattern too long, possible ReDoS attack',
        'PATTERN_TOO_LONG',
        pattern
      );
    }
    
    // Check for dangerous regex patterns
    const dangerousPatterns = [
      /(\w+\+)+/,     // Exponential backtracking
      /(\w+\*)+/,     // Exponential backtracking
      /(\(.+\))+\+/,  // Nested quantifiers
    ];
    
    for (const dangerous of dangerousPatterns) {
      if (dangerous.test(pattern)) {
        throw new ValidationError(
          'Potentially dangerous regex pattern detected',
          'DANGEROUS_REGEX',
          pattern
        );
      }
    }
    
    try {
      return new RegExp(pattern);
    } catch (error) {
      throw new ValidationError(
        'Invalid regex pattern',
        'INVALID_REGEX',
        pattern
      );
    }
  }

  static validateColorName(name: unknown): string {
    if (typeof name !== 'string') {
      throw new ValidationError(
        'Color name must be a string',
        'INVALID_COLOR_NAME_TYPE',
        name
      );
    }
    
    const validColors = [
      'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
      'gray', 'grey', 'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
      'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
    ];
    
    if (!validColors.includes(name)) {
      throw new ValidationError(
        `Invalid color name. Valid colors: ${validColors.join(', ')}`,
        'INVALID_COLOR_NAME',
        name
      );
    }
    
    return name;
  }
}