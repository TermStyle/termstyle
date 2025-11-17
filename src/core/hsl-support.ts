/**
 * HSL Color Support Extension
 * Provides comprehensive HSL color functionality
 */

import { HSLColor, RGBTuple } from './interfaces';
import { ColorProcessor } from './color-processor';

/**
 * Extended HSL interface with additional functionality
 */
export interface ExtendedHSLColor extends HSLColor {
  a?: number; // Alpha channel (0-1)
}

/**
 * HSL Color utilities and operations
 */
export class HSLProcessor {
  /**
   * Convert HSL to RGB
   */
  static hslToRgb(hsl: HSLColor): RGBTuple {
    return ColorProcessor.hslToRgb(hsl.h, hsl.s, hsl.l);
  }

  /**
   * Convert RGB to HSL
   */
  static rgbToHsl(r: number, g: number, b: number): HSLColor {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

      if (max === r) {
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        h = ((b - r) / delta + 2) / 6;
      } else {
        h = ((r - g) / delta + 4) / 6;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
   * Create HSL color from values
   */
  static create(h: number, s: number, l: number): HSLColor {
    return {
      h: this.normalizeHue(h),
      s: this.clampPercent(s),
      l: this.clampPercent(l)
    };
  }

  /**
   * Parse HSL string (e.g., "hsl(120, 50%, 25%)")
   */
  static parse(hslString: string): HSLColor | null {
    const match = hslString.trim().match(/^hsla?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%(?:,\s*([\d.]+))?\)$/);

    if (!match) {
      return null;
    }

    // FIX BUG-001: Validate parseFloat results to prevent NaN propagation
    const h = parseFloat(match[1]);
    const s = parseFloat(match[2]);
    const l = parseFloat(match[3]);

    // Check if any value is NaN
    if (isNaN(h) || isNaN(s) || isNaN(l)) {
      return null;
    }

    return this.create(h, s, l);
  }

  /**
   * Convert HSL to string representation
   */
  static toString(hsl: HSLColor): string {
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  }

  /**
   * Lighten an HSL color
   */
  static lighten(hsl: HSLColor, amount: number): HSLColor {
    return {
      ...hsl,
      l: this.clampPercent(hsl.l + amount)
    };
  }

  /**
   * Darken an HSL color
   */
  static darken(hsl: HSLColor, amount: number): HSLColor {
    return {
      ...hsl,
      l: this.clampPercent(hsl.l - amount)
    };
  }

  /**
   * Saturate an HSL color
   */
  static saturate(hsl: HSLColor, amount: number): HSLColor {
    return {
      ...hsl,
      s: this.clampPercent(hsl.s + amount)
    };
  }

  /**
   * Desaturate an HSL color
   */
  static desaturate(hsl: HSLColor, amount: number): HSLColor {
    return {
      ...hsl,
      s: this.clampPercent(hsl.s - amount)
    };
  }

  /**
   * Adjust hue of an HSL color
   */
  static adjustHue(hsl: HSLColor, amount: number): HSLColor {
    return {
      ...hsl,
      h: this.normalizeHue(hsl.h + amount)
    };
  }

  /**
   * Get the complement of an HSL color
   */
  static complement(hsl: HSLColor): HSLColor {
    return this.adjustHue(hsl, 180);
  }

  /**
   * Generate triadic colors (3 colors evenly spaced on color wheel)
   */
  static triadic(hsl: HSLColor): [HSLColor, HSLColor, HSLColor] {
    return [
      hsl,
      this.adjustHue(hsl, 120),
      this.adjustHue(hsl, 240)
    ];
  }

  /**
   * Generate analogous colors (colors adjacent on color wheel)
   */
  static analogous(hsl: HSLColor, angle: number = 30): [HSLColor, HSLColor, HSLColor] {
    return [
      this.adjustHue(hsl, -angle),
      hsl,
      this.adjustHue(hsl, angle)
    ];
  }

  /**
   * Generate split-complementary colors
   */
  static splitComplementary(hsl: HSLColor, angle: number = 30): [HSLColor, HSLColor, HSLColor] {
    const complement = this.complement(hsl);
    return [
      hsl,
      this.adjustHue(complement, -angle),
      this.adjustHue(complement, angle)
    ];
  }

  /**
   * Generate monochromatic colors (same hue, different lightness)
   */
  static monochromatic(hsl: HSLColor, count: number = 5): HSLColor[] {
    const colors: HSLColor[] = [];

    // Fix: Handle edge case when count is 1 to prevent division by zero
    if (count === 1) {
      return [{ ...hsl }];
    }

    const step = 100 / (count - 1);

    for (let i = 0; i < count; i++) {
      colors.push({
        h: hsl.h,
        s: hsl.s,
        l: this.clampPercent(i * step)
      });
    }

    return colors;
  }

  /**
   * Blend two HSL colors
   */
  static blend(hsl1: HSLColor, hsl2: HSLColor, ratio: number = 0.5): HSLColor {
    ratio = Math.max(0, Math.min(1, ratio));
    
    // Convert to RGB for proper blending
    const rgb1 = this.hslToRgb(hsl1);
    const rgb2 = this.hslToRgb(hsl2);
    
    const blendedRgb: RGBTuple = [
      Math.round(rgb1[0] * (1 - ratio) + rgb2[0] * ratio),
      Math.round(rgb1[1] * (1 - ratio) + rgb2[1] * ratio),
      Math.round(rgb1[2] * (1 - ratio) + rgb2[2] * ratio)
    ] as RGBTuple;
    
    return this.rgbToHsl(blendedRgb[0], blendedRgb[1], blendedRgb[2]);
  }

  /**
   * Check if two HSL colors are similar
   */
  static similar(hsl1: HSLColor, hsl2: HSLColor, tolerance: number = 10): boolean {
    const hDiff = Math.min(
      Math.abs(hsl1.h - hsl2.h),
      360 - Math.abs(hsl1.h - hsl2.h)
    );
    
    return hDiff <= tolerance &&
           Math.abs(hsl1.s - hsl2.s) <= tolerance &&
           Math.abs(hsl1.l - hsl2.l) <= tolerance;
  }

  /**
   * Get the contrast ratio between two HSL colors
   */
  static contrastRatio(hsl1: HSLColor, hsl2: HSLColor): number {
    const rgb1 = this.hslToRgb(hsl1);
    const rgb2 = this.hslToRgb(hsl2);
    
    const l1 = this.relativeLuminance(rgb1);
    const l2 = this.relativeLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if a color combination meets WCAG accessibility standards
   */
  static isAccessible(hsl1: HSLColor, hsl2: HSLColor, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.contrastRatio(hsl1, hsl2);
    const threshold = level === 'AAA' ? 7 : 4.5;
    return ratio >= threshold;
  }

  /**
   * Generate an accessible color palette based on a base color
   */
  static accessiblePalette(baseHsl: HSLColor, count: number = 5): HSLColor[] {
    const colors: HSLColor[] = [baseHsl];
    
    for (let i = 1; i < count; i++) {
      let candidate = this.adjustHue(baseHsl, (360 / count) * i);
      
      // Ensure accessibility
      if (!this.isAccessible(baseHsl, candidate)) {
        candidate = this.lighten(candidate, 30);
        if (!this.isAccessible(baseHsl, candidate)) {
          candidate = this.darken(candidate, 30);
        }
      }
      
      colors.push(candidate);
    }
    
    return colors;
  }

  private static normalizeHue(hue: number): number {
    return ((hue % 360) + 360) % 360;
  }

  private static clampPercent(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  private static relativeLuminance(rgb: RGBTuple): number {
    const [r, g, b] = rgb.map(c => {
      const normalized = c / 255;
      return normalized <= 0.03928 
        ? normalized / 12.92 
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}