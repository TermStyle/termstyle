export const ESC = '\u001B[';
export const RESET = ESC + '0m';

export const ansiCode = (code: number | string): string => ESC + code + 'm';
export const ansi = (code: number | string): string => String(code);

export const ansiCodes = {
  reset: 0,
  bold: 1,
  dim: 2,
  italic: 3,
  underline: 4,
  blink: 5,
  rapidBlink: 6,
  inverse: 7,
  hidden: 8,
  strikethrough: 9,
  
  resetBold: 22,
  resetDim: 22,
  resetItalic: 23,
  resetUnderline: 24,
  resetBlink: 25,
  resetInverse: 27,
  resetHidden: 28,
  resetStrikethrough: 29,
  
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  defaultColor: 39,
  
  bgBlack: 40,
  bgRed: 41,
  bgGreen: 42,
  bgYellow: 43,
  bgBlue: 44,
  bgMagenta: 45,
  bgCyan: 46,
  bgWhite: 47,
  bgDefaultColor: 49,
  
  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,
  
  bgBrightBlack: 100,
  bgBrightRed: 101,
  bgBrightGreen: 102,
  bgBrightYellow: 103,
  bgBrightBlue: 104,
  bgBrightMagenta: 105,
  bgBrightCyan: 106,
  bgBrightWhite: 107
} as const;

export type AnsiCode = keyof typeof ansiCodes;

export const rgb = (r: number, g: number, b: number): string => {
  return `38;2;${r};${g};${b}`;
};

export const bgRgb = (r: number, g: number, b: number): string => {
  return `48;2;${r};${g};${b}`;
};

export const ansi256 = (code: number): string => {
  return `38;5;${code}`;
};

export const bgAnsi256 = (code: number): string => {
  return `48;5;${code}`;
};

export const hexToRgb = (hex: string): [number, number, number] => {
  if (!hex || typeof hex !== 'string') {
    return [0, 0, 0]; // Default to black for invalid input
  }
  let cleanHex = hex.replace('#', '');
  
  // Handle 3-character hex codes
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return [r, g, b];
};

export const rgbToAnsi256 = (r: number, g: number, b: number): number => {
  // Check if it's a grayscale value (exact match)
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 238) return 231;
    // ANSI 256 grayscale: colors 232-255 represent rgb(8,8,8) to rgb(238,238,238)
    // incrementing by 10 for each level
    const index = Math.round((r - 8) / 10);
    return 232 + Math.min(index, 23);
  }
  
  const ansiR = Math.round(r / 51);
  const ansiG = Math.round(g / 51);
  const ansiB = Math.round(b / 51);
  
  return 16 + (36 * ansiR) + (6 * ansiG) + ansiB;
};

export const stripAnsi = (str: string): string => {
  if (typeof str !== 'string') {
    return String(str);
  }
  
  // Safe regex patterns to prevent ReDoS attacks
  // Match ANSI codes including malformed ones with excessive semicolons
  // eslint-disable-next-line no-control-regex
  const ansiColorPattern = /\u001B\[(?:[0-9;]{0,30})?m/g;
  // eslint-disable-next-line no-control-regex
  const ansiControlPattern = /\u001B\[(?:[0-9;]{0,30})?[A-Za-z]/g;
  
  try {
    return str
      .replace(ansiColorPattern, '')
      .replace(ansiControlPattern, '');
  } catch {
    // Fallback: character-by-character processing if regex fails
    let result = '';
    let i = 0;
    while (i < str.length) {
      // Fix: Check bounds before accessing i+1 to prevent undefined comparison
      if (i < str.length - 1 && str[i] === '\u001B' && str[i + 1] === '[') {
        // Skip ANSI sequence
        i += 2;
        while (i < str.length && (
          (str[i] >= '0' && str[i] <= '9') || 
          str[i] === ';' || 
          str[i] === 'm' ||
          (str[i] >= 'A' && str[i] <= 'Z') ||
          (str[i] >= 'a' && str[i] <= 'z')
        )) {
          if (str[i] === 'm' || (str[i] >= 'A' && str[i] <= 'Z') || (str[i] >= 'a' && str[i] <= 'z')) {
            i++;
            break;
          }
          i++;
        }
      } else {
        result += str[i];
        i++;
      }
    }
    return result;
  }
};

export const cursorUp = (n: number = 1): string => ESC + n + 'A';
export const cursorDown = (n: number = 1): string => ESC + n + 'B';
export const cursorForward = (n: number = 1): string => ESC + n + 'C';
export const cursorBackward = (n: number = 1): string => ESC + n + 'D';
export const cursorPosition = (row: number, col: number): string => ESC + row + ';' + col + 'H';
export const eraseLine = (): string => ESC + '2K';
export const eraseScreen = (): string => ESC + '2J';
export const saveCursor = (): string => ESC + 's';
export const restoreCursor = (): string => ESC + 'u';
export const hideCursor = (): string => ESC + '?25l';
export const showCursor = (): string => ESC + '?25h';