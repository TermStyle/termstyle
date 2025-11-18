import { Style } from '../styles/style';
import { terminal } from '../utils/terminal';
import { ColorProcessor, RGBTuple } from '../core/color-processor';
import { StringBuilder } from '../core/string-builder';
import { cacheManager } from '../core/cache-manager';
import { InputValidator } from '../core/validators';
import { ValidationError, ErrorCode, ErrorRecovery } from '../core/errors';



// Convert RGB to basic color (30-37)
function rgbToBasic(r: number, g: number, b: number): number {
  const brightness = (r + g + b) / 3;
  
  if (brightness < 64) return 30; // black
  if (r > g && r > b) return 31; // red
  if (g > r && g > b) return 32; // green
  if (r > 128 && g > 128 && b < 64) return 33; // yellow
  if (b > r && b > g) return 34; // blue
  if (r > 128 && b > 128 && g < 64) return 35; // magenta
  if (g > 128 && b > 128 && r < 64) return 36; // cyan
  return 37; // white
}

function convertColorInput(color: string | number | [number, number, number]): RGBTuple {
  return ColorProcessor.processColor(color);
}

export interface GradientOptions {
  interpolation?: 'linear' | 'bezier';
  hsvSpin?: 'short' | 'long';
}

function interpolateLinear(start: number, end: number, factor: number): number {
  return Math.round(start + (end - start) * factor);
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }

  return [h * 360, s * 100, v * 100];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h /= 360;
  s /= 100;
  v /= 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r: number, g: number, b: number;

  switch (i % 6) {
    case 0: [r, g, b] = [v, t, p]; break;
    case 1: [r, g, b] = [q, v, p]; break;
    case 2: [r, g, b] = [p, v, t]; break;
    case 3: [r, g, b] = [p, q, v]; break;
    case 4: [r, g, b] = [t, p, v]; break;
    case 5: [r, g, b] = [v, p, q]; break;
    default: [r, g, b] = [0, 0, 0];
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function interpolateHsv(
  start: RGBTuple,
  end: RGBTuple,
  factor: number,
  spin: 'short' | 'long' = 'short'
): RGBTuple {
  const [h1Start, s1, v1] = rgbToHsv(start[0], start[1], start[2]);
  const [h2Start, s2, v2] = rgbToHsv(end[0], end[1], end[2]);
  let h1 = h1Start;
  let h2 = h2Start;

  if (spin === 'long') {
    if (h2 > h1 && h2 - h1 > 180) {
      h1 += 360;
    } else if (h1 > h2 && h1 - h2 > 180) {
      h2 += 360;
    }
  } else {
    if (h2 > h1 && h2 - h1 > 180) {
      h2 -= 360;
    } else if (h1 > h2 && h1 - h2 > 180) {
      h1 -= 360;
    }
  }

  const hRaw = interpolateLinear(h1, h2, factor);
  // Ensure h is in range [0, 360)
  const h = ((hRaw % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, interpolateLinear(s1, s2, factor)));
  const v = Math.max(0, Math.min(100, interpolateLinear(v1, v2, factor)));

  return hsvToRgb(h, s, v) as RGBTuple;
}

// Optimized function for cache key generation
function getGradientCacheKey(text: string, colors: (string | number | [number, number, number])[], options: GradientOptions): string {
  // Use StringBuilder for efficient string concatenation
  const keyBuilder = new StringBuilder();
  
  // Add colors
  for (let i = 0; i < colors.length; i++) {
    if (i > 0) keyBuilder.append('|');
    const c = colors[i];
    if (Array.isArray(c)) {
      keyBuilder.append(c[0]).append(',').append(c[1]).append(',').append(c[2]);
    } else {
      keyBuilder.append(String(c));
    }
  }
  
  keyBuilder.append('-').append(text.length).append('-');
  
  // Better hash calculation with FNV-1a algorithm for better distribution
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime, using Math.imul for 32-bit arithmetic
  }
  // Ensure positive number
  hash = Math.abs(hash);
  keyBuilder.append(hash).append('-');
  
  // Add options
  keyBuilder.append(options.interpolation || 'linear')
    .append('-')
    .append(options.hsvSpin || 'short');
  
  return keyBuilder.toString();
}

function optimizedGradientBase(
  text: string,
  colors: (string | number | [number, number, number])[],
  options: GradientOptions = {}
): string {
  // Validate text input
  const textValidation = InputValidator.validateText(text);
  if (!textValidation.valid) {
    return '';
  }
  const validatedText = textValidation.value!.text;
  
  // Check terminal color support
  const termInfo = terminal();
  if (!termInfo.supportsColor) {
    return validatedText; // Return plain text if no color support
  }

  // Validate color array
  const colorValidation = InputValidator.validateColorArray(colors);
  if (!colorValidation.valid) {
    if (process.env.NODE_ENV === 'development') {
      throw new ValidationError(
        colorValidation.error!,
        ErrorCode.INVALID_COLOR_INPUT,
        { colors }
      );
    }
    return validatedText;
  }
  
  const validColors = colorValidation.value!.map(vc => vc.original);
  
  if (validColors.length === 0) return validatedText;
  if (validColors.length === 1) {
    const color = validColors[0];
    const rgb = convertColorInput(color);
    return new Style([], [], {}).color([rgb[0], rgb[1], rgb[2]]).apply(validatedText);
  }

  const chars = [...validatedText];
  if (chars.length === 0) return validatedText;
  
  // Check cache for this gradient configuration
  const cacheKey = getGradientCacheKey(validatedText, validColors, options);
  const cached = cacheManager.getGradient(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Pre-compute all colors for performance
  const colorStops = validColors.map(convertColorInput);
  const segments = Math.max(1, colorStops.length - 1);

  // FIX BUG-009: Use integer-based calculation to avoid floating-point precision issues
  const totalChars = chars.length;

  // Use StringBuilder for better performance than array joining
  const builder = new StringBuilder();

  // Pre-calculate common ANSI sequences for reuse
  const colorReset = '\u001b[39m';
  const colorLevel = termInfo.colorLevel;

  // Optimize interpolation function selection
  const useHsvInterpolation = options.interpolation === 'bezier' || options.hsvSpin;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    // Fast path for whitespace
    if (char === ' ' || char === '\n' || char === '\t') {
      builder.append(char);
      continue;
    }

    // Use integer arithmetic for better precision
    const segment = Math.min(Math.floor((i * segments) / totalChars), segments - 1);
    const segmentStart = Math.floor((segment * totalChars) / segments);
    const segmentEnd = Math.floor(((segment + 1) * totalChars) / segments);
    const segmentLength = segmentEnd - segmentStart;
    const segmentProgress = segmentLength > 0 ? (i - segmentStart) / segmentLength : 0;
    
    const startColor = colorStops[segment];
    // Ensure we don't go out of bounds for the last segment
    const endColor = colorStops[Math.min(segment + 1, colorStops.length - 1)];
    
    let r: number, g: number, b: number;
    
    if (useHsvInterpolation) {
      const color = interpolateHsv(startColor, endColor, segmentProgress, options.hsvSpin);
      [r, g, b] = color;
    } else {
      // Inline linear interpolation for performance
      r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * segmentProgress);
      g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * segmentProgress);
      b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * segmentProgress);
    }
    
    // Build ANSI code based on terminal color support
    if (colorLevel >= 3) {
      // 24-bit true color
      builder.append('\u001b[38;2;').append(r).append(';').append(g).append(';').append(b).append('m').append(char).append(colorReset);
    } else if (colorLevel >= 2) {
      // 256 color mode - use cached conversion
      const colorIndex = ColorProcessor.rgbTo256(r, g, b);
      builder.append('\u001b[38;5;').append(colorIndex).append('m').append(char).append(colorReset);
    } else {
      // Basic colors only
      const basicColor = rgbToBasic(r, g, b);
      builder.append('\u001b[').append(basicColor).append('m').append(char).append(colorReset);
    }
  }
  
  const result = builder.toString();
  
  // Cache the result
  cacheManager.setGradient(cacheKey, result);
  
  return result;
}

function gradientBase(
  text: string,
  colors: (string | number | [number, number, number])[],
  options: GradientOptions = {}
): string {
  return optimizedGradientBase(text, colors, options);
}

// Export the basic gradient function
export function gradient(
  text: string,
  colors: (string | number | [number, number, number])[],
  options: GradientOptions = {}
): string {
  return ErrorRecovery.recover(
    () => gradientBase(text, colors, options),
    text,
    process.env.DEBUG === 'true'
  );
}

// Add linear method for backward compatibility
export interface GradientAPI {
  (text: string, colors: (string | number | [number, number, number])[], options?: GradientOptions): string;
  (colors: (string | number | [number, number, number])[]): (text: string, options?: GradientOptions) => string;
  linear: (text: string, options: { from: string | number | [number, number, number]; to: string | number | [number, number, number] }) => string;
}

// Create gradient object with linear method for the main index
const gradientWithLinear = Object.assign(
  function gradient(...args: any[]) {
    // Support both gradient(text, colors) and gradient(colors)(text)
    if (args.length === 1 && Array.isArray(args[0])) {
      // Curried form: gradient(colors) returns a function
      const colors = args[0] as (string | number | [number, number, number])[];
      return (text: string, options?: GradientOptions) => gradientBase(text, colors, options);
    } else if (args.length >= 2) {
      // Direct form: gradient(text, colors, options?)
      const [text, colors, options] = args;
      return gradientBase(text, colors, options);
    } else if (args.length === 1 && typeof args[0] === 'string') {
      // Edge case: gradient(text) with no colors
      return args[0];
    }
    // Default case
    return '';
  },
  {
    linear: (text: string, options: { from: string | [number, number, number]; to: string | [number, number, number] }) => {
      return gradientBase(text, [options.from, options.to]);
    }
  }
) as GradientAPI;

// Export the enhanced gradient function for main index
export { gradientWithLinear as gradientEnhanced };

// Export linear function for direct imports
export const linear = (text: string, options: { from: string | number | [number, number, number]; to: string | number | [number, number, number] }) => {
  if (!options || !options.from || !options.to) {
    if (process.env.NODE_ENV === 'development') {
      throw new ValidationError(
        'Linear gradient requires both from and to colors',
        ErrorCode.INVALID_COLOR_INPUT,
        { options }
      );
    }
    return text;
  }
  return gradientBase(text, [options.from, options.to]);
};

// Export default for CommonJS compatibility
export default {
  linear,
  gradient,
  rainbow
};

// Rainbow function with optional currying support
export function rainbow(...args: any[]): string | ((text: string) => string) {
  const colors = [
    '#e81416',  // Red
    '#ffa500',  // Orange  
    '#faeb36',  // Yellow
    '#79c314',  // Green
    '#487de7',  // Blue
    '#4b369d',  // Indigo
    '#70369d'   // Violet
  ];
  
  if (args.length === 0) {
    // Curried form: rainbow() returns a function
    return (text: string, options: GradientOptions = {}) => {
      return ErrorRecovery.recover(
        () => gradientBase(text, colors, options),
        text,
        process.env.DEBUG === 'true'
      );
    };
  } else if (args.length >= 1 && typeof args[0] === 'string') {
    // Direct form: rainbow(text, options?)
    const [text, options = {}] = args;
    return ErrorRecovery.recover(
      () => gradientBase(text, colors, options),
      text,
      process.env.DEBUG === 'true'
    );
  }
  
  // Default case
  return '';
}