import { ansiCode, ansiCodes, rgb, bgRgb, ansi256, bgAnsi256, rgbToAnsi256 } from '../core/ansi';
import { terminal } from '../utils/terminal';
import { InputValidator } from '../core/validators';
import { ValidationError, ErrorCode } from '../core/errors';
import { ColorProcessor } from '../core/color-processor';

export type ColorInput = string | number | [number, number, number];

export interface StyleOptions {
  force?: boolean;
  level?: 0 | 1 | 2 | 3;
}

export class Style {
  private codes: string[] = [];
  private resetCodes: string[] = [];
  private options: StyleOptions;

  constructor(codes: string[] = [], resetCodes: string[] = [], options: StyleOptions = {}) {
    this.codes = codes;
    this.resetCodes = resetCodes;
    this.options = options;
  }

  private shouldApplyStyle(): boolean {
    if (this.options.force) return true;
    const level = this.options.level ?? terminal().colorLevel;
    return level > 0;
  }

  private addStyle(code: string, resetCode: string): Style {
    if (typeof code !== 'string' || typeof resetCode !== 'string') {
      return this; // Invalid input, return unchanged
    }
    
    // Check if this is a color code that should override previous colors
    const newCodes = [...this.codes];
    const newResetCodes = [...this.resetCodes];
    
    try {
      // Safely parse the code number
      const codeNum = parseInt(code.split(';')[0], 10);
      if (isNaN(codeNum)) {
        // Invalid code, just add it without conflict resolution
        return new Style(
          [...newCodes, code],
          [resetCode, ...newResetCodes],
          this.options
        );
      }
      
      const isForegroundColor = (codeNum >= 30 && codeNum <= 37) || (codeNum >= 90 && codeNum <= 97) || code.startsWith('38;');
      const isBackgroundColor = (codeNum >= 40 && codeNum <= 47) || (codeNum >= 100 && codeNum <= 107) || code.startsWith('48;');
      
      if (isForegroundColor) {
        // Remove previous foreground colors
        const indicesToRemove: number[] = [];
        for (let i = newCodes.length - 1; i >= 0; i--) {
          const existingCode = newCodes[i];
          const existingCodeNum = parseInt(existingCode.split(';')[0], 10);
          if (!isNaN(existingCodeNum)) {
            const isExistingFgColor = (existingCodeNum >= 30 && existingCodeNum <= 37) || 
                                      (existingCodeNum >= 90 && existingCodeNum <= 97) || 
                                      existingCode.startsWith('38;');
            if (isExistingFgColor) {
              indicesToRemove.push(i);
            }
          }
        }
        
        // Remove in reverse order to maintain indices
        for (let i = indicesToRemove.length - 1; i >= 0; i--) {
          const index = indicesToRemove[i];
          if (index >= 0 && index < newCodes.length) {
            newCodes.splice(index, 1);
            // Calculate reset index safely with proper bounds checking
            const resetIndex = Math.min(newResetCodes.length - 1, Math.max(0, newResetCodes.length - 1 - i));
            if (resetIndex >= 0 && resetIndex < newResetCodes.length) {
              newResetCodes.splice(resetIndex, 1);
            }
          }
        }
      }
      
      if (isBackgroundColor) {
        // Remove previous background colors
        const indicesToRemove: number[] = [];
        for (let i = newCodes.length - 1; i >= 0; i--) {
          const existingCode = newCodes[i];
          const existingCodeNum = parseInt(existingCode.split(';')[0], 10);
          if (!isNaN(existingCodeNum)) {
            const isExistingBgColor = (existingCodeNum >= 40 && existingCodeNum <= 47) || 
                                      (existingCodeNum >= 100 && existingCodeNum <= 107) || 
                                      existingCode.startsWith('48;');
            if (isExistingBgColor) {
              indicesToRemove.push(i);
            }
          }
        }
        
        // Remove in reverse order to maintain indices
        for (let i = indicesToRemove.length - 1; i >= 0; i--) {
          const index = indicesToRemove[i];
          if (index >= 0 && index < newCodes.length) {
            newCodes.splice(index, 1);
            // Calculate reset index safely with proper bounds checking
            const resetIndex = Math.min(newResetCodes.length - 1, Math.max(0, newResetCodes.length - 1 - i));
            if (resetIndex >= 0 && resetIndex < newResetCodes.length) {
              newResetCodes.splice(resetIndex, 1);
            }
          }
        }
      }
      
      return new Style(
        [...newCodes, code],
        [resetCode, ...newResetCodes],
        this.options
      );
    } catch {
      // If anything fails, safely add the style without conflict resolution
      return new Style(
        [...newCodes, code],
        [resetCode, ...newResetCodes],
        this.options
      );
    }
  }

  apply(text: string): string {
    // Validate text input
    const validation = InputValidator.validateText(text);
    if (!validation.valid) {
      return '';
    }
    
    const validatedText = validation.value!.text;
    
    if (!this.shouldApplyStyle() || this.codes.length === 0) {
      return validatedText;
    }

    const openCodes = this.codes.map(code => ansiCode(code)).join('');
    const closeCodes = this.resetCodes.map(code => ansiCode(code)).join('');
    
    return openCodes + validatedText + closeCodes;
  }

  get bold(): Style {
    return this.addStyle(String(ansiCodes.bold), String(ansiCodes.resetBold));
  }

  get dim(): Style {
    return this.addStyle(String(ansiCodes.dim), String(ansiCodes.resetDim));
  }

  get italic(): Style {
    return this.addStyle(String(ansiCodes.italic), String(ansiCodes.resetItalic));
  }

  get underline(): Style {
    return this.addStyle(String(ansiCodes.underline), String(ansiCodes.resetUnderline));
  }

  get inverse(): Style {
    return this.addStyle(String(ansiCodes.inverse), String(ansiCodes.resetInverse));
  }

  get hidden(): Style {
    return this.addStyle(String(ansiCodes.hidden), String(ansiCodes.resetHidden));
  }

  get strikethrough(): Style {
    return this.addStyle(String(ansiCodes.strikethrough), String(ansiCodes.resetStrikethrough));
  }

  get black(): Style {
    return this.addStyle(String(ansiCodes.black), String(ansiCodes.defaultColor));
  }

  get red(): Style {
    return this.addStyle(String(ansiCodes.red), String(ansiCodes.defaultColor));
  }

  get green(): Style {
    return this.addStyle(String(ansiCodes.green), String(ansiCodes.defaultColor));
  }

  get yellow(): Style {
    return this.addStyle(String(ansiCodes.yellow), String(ansiCodes.defaultColor));
  }

  get blue(): Style {
    return this.addStyle(String(ansiCodes.blue), String(ansiCodes.defaultColor));
  }

  get magenta(): Style {
    return this.addStyle(String(ansiCodes.magenta), String(ansiCodes.defaultColor));
  }

  get cyan(): Style {
    return this.addStyle(String(ansiCodes.cyan), String(ansiCodes.defaultColor));
  }

  get white(): Style {
    return this.addStyle(String(ansiCodes.white), String(ansiCodes.defaultColor));
  }

  get gray(): Style {
    return this.addStyle(String(ansiCodes.brightBlack), String(ansiCodes.defaultColor));
  }

  get grey(): Style {
    return this.gray;
  }

  get bgBlack(): Style {
    return this.addStyle(String(ansiCodes.bgBlack), String(ansiCodes.bgDefaultColor));
  }

  get bgRed(): Style {
    return this.addStyle(String(ansiCodes.bgRed), String(ansiCodes.bgDefaultColor));
  }

  get bgGreen(): Style {
    return this.addStyle(String(ansiCodes.bgGreen), String(ansiCodes.bgDefaultColor));
  }

  get bgYellow(): Style {
    return this.addStyle(String(ansiCodes.bgYellow), String(ansiCodes.bgDefaultColor));
  }

  get bgBlue(): Style {
    return this.addStyle(String(ansiCodes.bgBlue), String(ansiCodes.bgDefaultColor));
  }

  get bgMagenta(): Style {
    return this.addStyle(String(ansiCodes.bgMagenta), String(ansiCodes.bgDefaultColor));
  }

  get bgCyan(): Style {
    return this.addStyle(String(ansiCodes.bgCyan), String(ansiCodes.bgDefaultColor));
  }

  get bgWhite(): Style {
    return this.addStyle(String(ansiCodes.bgWhite), String(ansiCodes.bgDefaultColor));
  }

  get bgGray(): Style {
    return this.addStyle(String(ansiCodes.bgBrightBlack), String(ansiCodes.bgDefaultColor));
  }

  get bgGrey(): Style {
    return this.bgGray;
  }

  color(color: ColorInput): Style {
    const level = this.options.level ?? terminal().colorLevel;
    
    // Validate color input
    const validation = InputValidator.validateColor(color);
    if (!validation.valid) {
      if (process.env.NODE_ENV === 'development') {
        throw new ValidationError(
          validation.error!,
          ErrorCode.INVALID_COLOR_INPUT,
          { input: color }
        );
      }
      // In production, return unchanged style
      return this;
    }
    
    // Check if it's a basic named color first
    if (typeof color === 'string') {
      const basicColors: Record<string, number> = {
        black: ansiCodes.black,
        red: ansiCodes.red,
        green: ansiCodes.green,
        yellow: ansiCodes.yellow,
        blue: ansiCodes.blue,
        magenta: ansiCodes.magenta,
        cyan: ansiCodes.cyan,
        white: ansiCodes.white,
        gray: ansiCodes.brightBlack,
        grey: ansiCodes.brightBlack
      };
      
      const colorLower = color.toLowerCase();
      if (colorLower in basicColors && level >= 1) {
        return this.addStyle(String(basicColors[colorLower]), String(ansiCodes.defaultColor));
      }
      
      // Check if it's a hex color without # prefix
      if (/^[0-9a-fA-F]{6}$/.test(color)) {
        // Add # prefix and process as hex
        const [r, g, b] = ColorProcessor.processColor('#' + color);
        if (this.options.force || level >= 3) {
          return this.addStyle(rgb(r, g, b), String(ansiCodes.defaultColor));
        } else if (level >= 2) {
          const code = rgbToAnsi256(r, g, b);
          return this.addStyle(ansi256(code), String(ansiCodes.defaultColor));
        }
      }
      
      // Check if it's a valid color name or hex with #
      if (!ColorProcessor.isValidColorName(color) && !ColorProcessor.isValidHex(color)) {
        // Invalid color name - return unchanged
        return this;
      }
    }
    
    // Handle ANSI 256 color codes
    if (typeof color === 'number') {
      if (level >= 2) {
        return this.addStyle(ansi256(color), String(ansiCodes.defaultColor));
      } else {
        // No support for 256 colors at basic level
        return this;
      }
    }
    
    // Use ColorProcessor for RGB colors
    const [r, g, b] = ColorProcessor.processColor(color);
    
    if (this.options.force || level >= 3) {
      return this.addStyle(rgb(r, g, b), String(ansiCodes.defaultColor));
    } else if (level >= 2) {
      const code = rgbToAnsi256(r, g, b);
      return this.addStyle(ansi256(code), String(ansiCodes.defaultColor));
    } else if (level >= 1) {
      // Basic color level (1) doesn't support RGB arrays
      return this;
    }

    return this;
  }

  bgColor(color: ColorInput): Style {
    const level = this.options.level ?? terminal().colorLevel;
    
    // Validate color input
    const validation = InputValidator.validateColor(color);
    if (!validation.valid) {
      if (process.env.NODE_ENV === 'development') {
        throw new ValidationError(
          validation.error!,
          ErrorCode.INVALID_COLOR_INPUT,
          { input: color }
        );
      }
      // In production, return unchanged style
      return this;
    }
    
    // Check if it's a basic named color first
    if (typeof color === 'string') {
      const basicBgColors: Record<string, number> = {
        black: ansiCodes.bgBlack,
        red: ansiCodes.bgRed,
        green: ansiCodes.bgGreen,
        yellow: ansiCodes.bgYellow,
        blue: ansiCodes.bgBlue,
        magenta: ansiCodes.bgMagenta,
        cyan: ansiCodes.bgCyan,
        white: ansiCodes.bgWhite,
        gray: ansiCodes.bgBrightBlack,
        grey: ansiCodes.bgBrightBlack
      };
      
      const colorLower = color.toLowerCase();
      if (colorLower in basicBgColors && level >= 1) {
        return this.addStyle(String(basicBgColors[colorLower]), String(ansiCodes.bgDefaultColor));
      }
    }
    
    // Handle ANSI 256 color codes
    if (typeof color === 'number' && level >= 2) {
      return this.addStyle(bgAnsi256(color), String(ansiCodes.bgDefaultColor));
    }
    
    // Use ColorProcessor for RGB colors
    const [r, g, b] = ColorProcessor.processColor(color);
    
    if (this.options.force || level >= 3) {
      return this.addStyle(bgRgb(r, g, b), String(ansiCodes.bgDefaultColor));
    } else if (level >= 2) {
      const code = rgbToAnsi256(r, g, b);
      return this.addStyle(bgAnsi256(code), String(ansiCodes.bgDefaultColor));
    } else if (level >= 1) {
      // Fallback to basic background colors for RGB values
      const brightness = (r + g + b) / 3;
      let closestColor = 'white';
      if (brightness < 64) closestColor = 'black';
      else if (r > g && r > b) closestColor = 'red';
      else if (g > r && g > b) closestColor = 'green';
      else if (b > r && b > g) closestColor = 'blue';
      else if (r > 128 && g > 128) closestColor = 'yellow';
      else if (r > 128 && b > 128) closestColor = 'magenta';
      else if (g > 128 && b > 128) closestColor = 'cyan';
      
      const basicBgColors: Record<string, number> = {
        black: ansiCodes.bgBlack,
        red: ansiCodes.bgRed,
        green: ansiCodes.bgGreen,
        yellow: ansiCodes.bgYellow,
        blue: ansiCodes.bgBlue,
        magenta: ansiCodes.bgMagenta,
        cyan: ansiCodes.bgCyan,
        white: ansiCodes.bgWhite
      };
      
      return this.addStyle(String(basicBgColors[closestColor]), String(ansiCodes.bgDefaultColor));
    }

    return this;
  }

  rgb(r: number, g: number, b: number): Style {
    // Validate individual RGB values
    const validation = InputValidator.validateColor([r, g, b]);
    if (!validation.valid) {
      if (process.env.NODE_ENV === 'development') {
        throw new ValidationError(
          validation.error!,
          ErrorCode.INVALID_COLOR_INPUT,
          { r, g, b }
        );
      }
      return this;
    }
    return this.color([r, g, b]);
  }

  bgRgb(r: number, g: number, b: number): Style {
    // Validate individual RGB values
    const validation = InputValidator.validateColor([r, g, b]);
    if (!validation.valid) {
      if (process.env.NODE_ENV === 'development') {
        throw new ValidationError(
          validation.error!,
          ErrorCode.INVALID_COLOR_INPUT,
          { r, g, b }
        );
      }
      return this;
    }
    return this.bgColor([r, g, b]);
  }

  hex(hex: string): Style {
    return this.color(hex);
  }

  bgHex(hex: string): Style {
    return this.bgColor(hex);
  }
}