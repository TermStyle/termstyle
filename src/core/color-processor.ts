/**
 * Color Processing with Performance Optimization
 * Implements caching and efficient color conversion algorithms
 */

import { hexToRgb } from './ansi';
import { cacheManager } from './cache-manager';

export type ColorInput = string | [number, number, number] | number;
export type RGBTuple = readonly [number, number, number];

// Enhanced color name mapping
const colorNames: Record<string, string> = {
  // Basic colors
  red: '#ff0000',
  green: '#00ff00',
  blue: '#0000ff',
  yellow: '#ffff00',
  magenta: '#ff00ff',
  cyan: '#00ffff',
  white: '#ffffff',
  black: '#000000',
  gray: '#808080',
  grey: '#808080',
  
  // Extended colors
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  brown: '#a52a2a',
  violet: '#ee82ee',
  indigo: '#4b0082',
  lime: '#00ff00',
  olive: '#808000',
  navy: '#000080',
  teal: '#008080',
  silver: '#c0c0c0',
  maroon: '#800000',
  fuchsia: '#ff00ff',
  aqua: '#00ffff',
  
  // Web colors
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  blanchedalmond: '#ffebcd',
  blueviolet: '#8a2be2',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgreen: '#006400',
  darkgrey: '#a9a9a9',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  greenyellow: '#adff2f',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  indianred: '#cd5c5c',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3',
  lightgreen: '#90ee90',
  lightgrey: '#d3d3d3',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  oldlace: '#fdf5e6',
  olivedrab: '#6b8e23',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#db7093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  wheat: '#f5deb3',
  whitesmoke: '#f5f5f5',
  yellowgreen: '#9acd32'
};

export class ColorProcessor {
  /**
   * Process any color input into RGB tuple with caching
   */
  static processColor(input: ColorInput): RGBTuple {
    const key = this.getCacheKey(input);
    
    // Check cache first
    const cached = cacheManager.getColor(key);
    if (cached) {
      return cached;
    }
    
    const result = this.convertColor(input);
    cacheManager.setColor(key, result);
    return result;
  }

  /**
   * Convert HSL to RGB with caching
   */
  static hslToRgb(h: number, s: number, l: number): RGBTuple {
    const key = `hsl(${h},${s},${l})`;
    
    const cached = cacheManager.getHslColor(key);
    if (cached) {
      return cached;
    }

    const result = this.computeHslToRgb(h, s, l);
    cacheManager.setHslColor(key, result);
    return result;
  }

  /**
   * Convert RGB to 256-color index without caching (caching handled at higher level)
   */
  static rgbTo256(r: number, g: number, b: number): number {
    return this.computeRgbTo256(r, g, b);
  }

  /**
   * Get color name suggestions for auto-completion
   */
  static getColorNames(): string[] {
    return Object.keys(colorNames);
  }

  /**
   * Check if a string is a valid color name
   */
  static isValidColorName(name: string): boolean {
    return name.toLowerCase() in colorNames;
  }

  /**
   * Check if a string is a valid hex color
   */
  static isValidHex(hex: string): boolean {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
  }

  /**
   * Clear all caches (useful for testing or memory management)
   */
  static clearCaches(): void {
    cacheManager.clearColors();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return cacheManager.getStats();
  }

  private static getCacheKey(input: ColorInput): string {
    if (Array.isArray(input)) {
      return `rgb(${input[0]},${input[1]},${input[2]})`;
    }
    if (typeof input === 'number') {
      return `num(${input})`;
    }
    return `str(${input})`;
  }

  private static convertColor(input: ColorInput): RGBTuple {
    if (Array.isArray(input)) {
      // Validate and clamp RGB values
      return [
        Math.max(0, Math.min(255, Math.round(input[0]))),
        Math.max(0, Math.min(255, Math.round(input[1]))),
        Math.max(0, Math.min(255, Math.round(input[2])))
      ] as RGBTuple;
    }

    if (typeof input === 'number') {
      // Convert number to RGB (assuming 24-bit color)
      const num = Math.max(0, Math.min(0xffffff, Math.floor(input)));
      return [
        (num >> 16) & 0xff,
        (num >> 8) & 0xff,
        num & 0xff
      ] as RGBTuple;
    }

    if (typeof input === 'string') {
      const trimmed = input.trim().toLowerCase();
      
      // Check if it's a color name
      if (trimmed in colorNames) {
        return hexToRgb(colorNames[trimmed]) as RGBTuple;
      }
      
      // Check if it's a hex color
      if (this.isValidHex(input)) {
        return hexToRgb(input) as RGBTuple;
      }
      
      // Handle rgb() and rgba() functions
      const rgbMatch = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
      if (rgbMatch) {
        return [
          Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10))),
          Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10))),
          Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10)))
        ] as RGBTuple;
      }

      // Handle hsl() and hsla() functions
      const hslMatch = trimmed.match(/^hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)$/);
      if (hslMatch) {
        return this.hslToRgb(
          parseInt(hslMatch[1], 10),
          parseInt(hslMatch[2], 10),
          parseInt(hslMatch[3], 10)
        );
      }
    }

    // Fallback to white for invalid input
    return [255, 255, 255] as RGBTuple;
  }

  private static computeHslToRgb(h: number, s: number, l: number): RGBTuple {
    // Normalize inputs
    h = ((h % 360) + 360) % 360; // Ensure h is 0-359
    s = Math.max(0, Math.min(100, s)) / 100; // Convert to 0-1
    l = Math.max(0, Math.min(100, l)) / 100; // Convert to 0-1

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r: number, g: number, b: number;

    if (h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ] as RGBTuple;
  }

  private static computeRgbTo256(r: number, g: number, b: number): number {
    // Clamp values
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));

    // Check if it's a grayscale color
    if (r === g && g === b) {
      if (r < 8) return 16;
      if (r > 248) return 231;
      return Math.round(((r - 8) / 247) * 24) + 232;
    }

    // Convert to 6x6x6 color cube
    const rIndex = Math.round((r / 255) * 5);
    const gIndex = Math.round((g / 255) * 5);
    const bIndex = Math.round((b / 255) * 5);

    return 16 + (36 * rIndex) + (6 * gIndex) + bIndex;
  }
}