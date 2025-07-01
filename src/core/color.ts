import { RGB, HSL, ColorValue, ColorInput } from '../types';
import { InputValidator } from '../validation/validator';
import { StyleCache, memoize } from './cache';

// Color constants
export const ANSI_COLORS = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97
} as const;

export const ANSI_BG_COLORS = {
  bgBlack: 40,
  bgRed: 41,
  bgGreen: 42,
  bgYellow: 43,
  bgBlue: 44,
  bgMagenta: 45,
  bgCyan: 46,
  bgWhite: 47,
  bgBrightBlack: 100,
  bgBrightRed: 101,
  bgBrightGreen: 102,
  bgBrightYellow: 103,
  bgBrightBlue: 104,
  bgBrightMagenta: 105,
  bgBrightCyan: 106,
  bgBrightWhite: 107
} as const;

// Pre-calculated color tables for performance
const ANSI_TO_RGB: RGB[] = new Array(256);
const RGB_TO_ANSI: Map<string, number> = new Map();

// Initialize color tables
function initializeColorTables(): void {
  // Standard colors (0-15)
  const standardColors: RGB[] = [
    { r: 0, g: 0, b: 0 },       // Black
    { r: 170, g: 0, b: 0 },     // Red
    { r: 0, g: 170, b: 0 },     // Green
    { r: 170, g: 85, b: 0 },    // Yellow
    { r: 0, g: 0, b: 170 },     // Blue
    { r: 170, g: 0, b: 170 },   // Magenta
    { r: 0, g: 170, b: 170 },   // Cyan
    { r: 170, g: 170, b: 170 }, // White
    { r: 85, g: 85, b: 85 },    // Bright Black
    { r: 255, g: 85, b: 85 },   // Bright Red
    { r: 85, g: 255, b: 85 },   // Bright Green
    { r: 255, g: 255, b: 85 },  // Bright Yellow
    { r: 85, g: 85, b: 255 },   // Bright Blue
    { r: 255, g: 85, b: 255 },  // Bright Magenta
    { r: 85, g: 255, b: 255 },  // Bright Cyan
    { r: 255, g: 255, b: 255 }  // Bright White
  ];

  // Set standard colors
  for (let i = 0; i < 16; i++) {
    ANSI_TO_RGB[i] = standardColors[i];
    const key = `${standardColors[i].r},${standardColors[i].g},${standardColors[i].b}`;
    RGB_TO_ANSI.set(key, i);
  }

  // 216 color cube (16-231)
  for (let i = 16; i < 232; i++) {
    const n = i - 16;
    const r = Math.floor(n / 36) * 51;
    const g = Math.floor((n % 36) / 6) * 51;
    const b = (n % 6) * 51;
    ANSI_TO_RGB[i] = { r, g, b };
    RGB_TO_ANSI.set(`${r},${g},${b}`, i);
  }

  // Grayscale (232-255)
  for (let i = 232; i < 256; i++) {
    const gray = 8 + (i - 232) * 10;
    ANSI_TO_RGB[i] = { r: gray, g: gray, b: gray };
    RGB_TO_ANSI.set(`${gray},${gray},${gray}`, i);
  }
}

// Initialize tables on module load
initializeColorTables();

export class ColorProcessor {
  private static cache = StyleCache.getInstance();

  static parseColor(input: ColorValue): ColorInput {
    if (typeof input === 'string') {
      if (input.startsWith('#')) {
        return { type: 'hex', value: input };
      }
      return { type: 'named', value: input };
    }
    
    if (typeof input === 'number') {
      return { type: 'ansi256', value: input };
    }
    
    if (Array.isArray(input) && input.length === 3) {
      return { type: 'rgb', value: { r: input[0], g: input[1], b: input[2] } };
    }
    
    if (input && typeof input === 'object' && 'r' in input && 'g' in input && 'b' in input) {
      return { type: 'rgb', value: input };
    }
    
    throw new Error(`Invalid color input: ${JSON.stringify(input)}`);
  }

  static toRGB(input: ColorInput): RGB {
    // Check cache first
    const cached = this.cache.getColor(input.value);
    if (cached) return cached;

    let rgb: RGB;

    switch (input.type) {
      case 'rgb':
        if (Array.isArray(input.value)) {
          rgb = InputValidator.validateRGB(input.value[0], input.value[1], input.value[2]);
        } else {
          rgb = input.value as RGB;
        }
        break;

      case 'hex':
        rgb = this.hexToRGB(input.value as string);
        break;

      case 'ansi256':
        rgb = this.ansi256ToRGB(input.value as number);
        break;

      case 'named':
        rgb = this.namedToRGB(input.value as string);
        break;

      case 'hsl': {
        const hsl = input.value as HSL;
        rgb = this.hslToRGB(hsl);
        break;
      }

      default:
        throw new Error(`Unknown color type: ${input.type}`);
    }

    // Cache the result
    this.cache.setColor(input.value, rgb);
    return rgb;
  }

  static toANSI256(rgb: RGB): number {
    // Check exact match first
    const key = `${rgb.r},${rgb.g},${rgb.b}`;
    const exact = RGB_TO_ANSI.get(key);
    if (exact !== undefined) return exact;

    // Find closest color
    return this.findClosestANSI256(rgb);
  }

  private static hexToRGB = memoize((hex: string): RGB => {
    const normalized = InputValidator.validateHex(hex);
    return {
      r: parseInt(normalized.substr(0, 2), 16),
      g: parseInt(normalized.substr(2, 2), 16),
      b: parseInt(normalized.substr(4, 2), 16)
    };
  });

  private static ansi256ToRGB(code: number): RGB {
    const validated = InputValidator.validateAnsi256(code);
    return ANSI_TO_RGB[validated];
  }

  private static namedToRGB(name: string): RGB {
    const colorMap: Record<string, RGB> = {
      black: { r: 0, g: 0, b: 0 },
      red: { r: 255, g: 0, b: 0 },
      green: { r: 0, g: 255, b: 0 },
      yellow: { r: 255, g: 255, b: 0 },
      blue: { r: 0, g: 0, b: 255 },
      magenta: { r: 255, g: 0, b: 255 },
      cyan: { r: 0, g: 255, b: 255 },
      white: { r: 255, g: 255, b: 255 },
      gray: { r: 128, g: 128, b: 128 },
      grey: { r: 128, g: 128, b: 128 }
    };

    const validated = InputValidator.validateColorName(name);
    const baseColor = validated.replace(/^bright/, '').toLowerCase();
    const isBright = validated.startsWith('bright');

    let rgb = colorMap[baseColor];
    if (!rgb) {
      throw new Error(`Unknown color name: ${name}`);
    }

    // Apply brightness
    if (isBright && baseColor !== 'white') {
      rgb = {
        r: Math.min(255, rgb.r + 127),
        g: Math.min(255, rgb.g + 127),
        b: Math.min(255, rgb.b + 127)
      };
    }

    return rgb;
  }

  private static hslToRGB = memoize((hsl: HSL): RGB => {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  });

  private static findClosestANSI256(rgb: RGB): number {
    let minDistance = Infinity;
    let closestIndex = 0;

    // Use color distance formula
    for (let i = 0; i < 256; i++) {
      const ansiRgb = ANSI_TO_RGB[i];
      const distance = this.colorDistance(rgb, ansiRgb);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  private static colorDistance(c1: RGB, c2: RGB): number {
    // Weighted Euclidean distance (better perceptual accuracy)
    const rMean = (c1.r + c2.r) / 2;
    const deltaR = c1.r - c2.r;
    const deltaG = c1.g - c2.g;
    const deltaB = c1.b - c2.b;
    
    const weightR = 2 + rMean / 256;
    const weightG = 4;
    const weightB = 2 + (255 - rMean) / 256;
    
    return Math.sqrt(
      weightR * deltaR * deltaR +
      weightG * deltaG * deltaG +
      weightB * deltaB * deltaB
    );
  }

  static interpolate(colors: RGB[], position: number): RGB {
    if (colors.length === 0) throw new Error('No colors to interpolate');
    if (colors.length === 1) return colors[0];
    
    // Clamp position
    position = Math.max(0, Math.min(1, position));
    
    const scaledPos = position * (colors.length - 1);
    const index = Math.floor(scaledPos);
    const fraction = scaledPos - index;
    
    if (index >= colors.length - 1) return colors[colors.length - 1];
    
    const c1 = colors[index];
    const c2 = colors[index + 1];
    
    return {
      r: Math.round(c1.r + (c2.r - c1.r) * fraction),
      g: Math.round(c1.g + (c2.g - c1.g) * fraction),
      b: Math.round(c1.b + (c2.b - c1.b) * fraction)
    };
  }
}

// ANSI escape code generator
export class ANSIGenerator {
  static readonly ESC = '\u001B[';
  static readonly RESET = '\u001B[0m';

  static foreground(color: ColorValue, level: 0 | 1 | 2 | 3 = 3): string {
    if (level === 0) return '';

    const input = ColorProcessor.parseColor(color);
    
    if (input.type === 'named' && level >= 1) {
      const code = ANSI_COLORS[input.value as keyof typeof ANSI_COLORS];
      if (code) return `${this.ESC}${code}m`;
    }

    if (level === 1) return '';

    const rgb = ColorProcessor.toRGB(input);
    
    if (level === 2) {
      const ansi256 = ColorProcessor.toANSI256(rgb);
      return `${this.ESC}38;5;${ansi256}m`;
    }

    // True color (level 3)
    return `${this.ESC}38;2;${rgb.r};${rgb.g};${rgb.b}m`;
  }

  static background(color: ColorValue, level: 0 | 1 | 2 | 3 = 3): string {
    if (level === 0) return '';

    const input = ColorProcessor.parseColor(color);
    
    if (input.type === 'named' && level >= 1) {
      const namedColor = input.value as string;
      const bgName = `bg${namedColor.charAt(0).toUpperCase()}${namedColor.slice(1)}`;
      const code = ANSI_BG_COLORS[bgName as keyof typeof ANSI_BG_COLORS];
      if (code) return `${this.ESC}${code}m`;
    }

    if (level === 1) return '';

    const rgb = ColorProcessor.toRGB(input);
    
    if (level === 2) {
      const ansi256 = ColorProcessor.toANSI256(rgb);
      return `${this.ESC}48;5;${ansi256}m`;
    }

    // True color (level 3)
    return `${this.ESC}48;2;${rgb.r};${rgb.g};${rgb.b}m`;
  }
}