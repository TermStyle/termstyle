/**
 * Enhanced Animation Engine
 * Provides a flexible, extensible system for text animations
 */

import { AnimationType, AnimationOptions } from './types';
import { TermStyleError } from './interfaces';
import { safeExecute } from './safe-utils';

/**
 * Animation frame handler interface
 */
export interface AnimationHandler {
  render(text: string, frame: number, progress: number, options: AnimationOptions): string;
  getTotalFrames?(duration: number, interval: number): number;
  initialize?(text: string, options: AnimationOptions): void;
  cleanup?(): void;
}

/**
 * Easing functions for smooth animations
 */
export class Easing {
  static linear(t: number): number {
    return t;
  }

  static easeInQuad(t: number): number {
    return t * t;
  }

  static easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeInCubic(t: number): number {
    return t * t * t;
  }

  static easeOutCubic(t: number): number {
    return (--t) * t * t + 1;
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  static easeInSine(t: number): number {
    return 1 - Math.cos(t * Math.PI / 2);
  }

  static easeOutSine(t: number): number {
    return Math.sin(t * Math.PI / 2);
  }

  static easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  static easeInElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  }

  static easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  static easeInBounce(t: number): number {
    return 1 - this.easeOutBounce(1 - t);
  }

  static easeOutBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  static get(name: string): (t: number) => number {
    const easingFunctions: Record<string, (t: number) => number> = {
      linear: this.linear,
      'ease-in': this.easeInQuad,
      'ease-out': this.easeOutQuad,
      'ease-in-out': this.easeInOutQuad,
      'ease-in-cubic': this.easeInCubic,
      'ease-out-cubic': this.easeOutCubic,
      'ease-in-out-cubic': this.easeInOutCubic,
      'ease-in-sine': this.easeInSine,
      'ease-out-sine': this.easeOutSine,
      'ease-in-out-sine': this.easeInOutSine,
      'ease-in-elastic': this.easeInElastic,
      'ease-out-elastic': this.easeOutElastic,
      'ease-in-bounce': this.easeInBounce,
      'ease-out-bounce': this.easeOutBounce
    };

    return easingFunctions[name] || this.linear;
  }
}

/**
 * Enhanced Animation Engine
 */
export class AnimationEngine {
  private static handlers = new Map<AnimationType, AnimationHandler>();
  private static customHandlers = new Map<string, AnimationHandler>();

  /**
   * Register a built-in animation handler
   */
  static register(type: AnimationType, handler: AnimationHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Register a custom animation handler
   */
  static registerCustom(name: string, handler: AnimationHandler): void {
    this.customHandlers.set(name, handler);
  }

  /**
   * Get an animation handler
   */
  static getHandler(type: AnimationType | string): AnimationHandler | undefined {
    if (this.handlers.has(type as AnimationType)) {
      return this.handlers.get(type as AnimationType);
    }
    return this.customHandlers.get(type);
  }

  /**
   * Check if an animation type is available
   */
  static hasHandler(type: AnimationType | string): boolean {
    return this.handlers.has(type as AnimationType) || this.customHandlers.has(type);
  }

  /**
   * Get all available animation types
   */
  static getAvailableTypes(): string[] {
    return [
      ...Array.from(this.handlers.keys()),
      ...Array.from(this.customHandlers.keys())
    ];
  }

  /**
   * Render a frame using the specified animation
   */
  static renderFrame(
    type: AnimationType | string,
    text: string,
    frame: number,
    progress: number,
    options: AnimationOptions
  ): string {
    const handler = this.getHandler(type);
    if (!handler) {
      throw new TermStyleError(`Unknown animation type: ${type}`, 'INVALID_ANIMATION');
    }

    return safeExecute(
      () => handler.render(text, frame, progress, options),
      text,
      (error) => {
        console.warn(`Animation rendering error for ${type}:`, error);
      }
    );
  }

  /**
   * Initialize all built-in animations
   */
  static initializeBuiltins(): void {
    // Blink animation
    this.register('blink', {
      render: (text: string, frame: number, progress: number, options: AnimationOptions): string => {
        const easedProgress = Easing.get(options.easing || 'linear')(progress);
        return easedProgress < 0.5 ? text : ' '.repeat(text.length);
      }
    });

    // Pulse animation with easing
    this.register('pulse', {
      render: (text: string, frame: number, progress: number, options: AnimationOptions): string => {
        const easedProgress = Easing.get(options.easing || 'ease-in-out-sine')(progress);
        const intensity = Math.sin(easedProgress * Math.PI) * 128 + 127;
        const color = Math.round(intensity);
        return `\u001B[38;2;${color};${color};${color}m${text}\u001B[39m`;
      }
    });

    // Slide animation
    this.register('slide', {
      render: (text: string, frame: number, progress: number, options: AnimationOptions): string => {
        const easedProgress = Easing.get(options.easing || 'ease-out')(progress);
        const width = text.length;
        const position = Math.floor(easedProgress * width);
        const spaces = ' '.repeat(Math.max(0, width - position));
        return spaces + text.slice(0, position);
      }
    });

    // Typewriter animation
    this.register('typewriter', {
      render: (text: string, frame: number, progress: number, options: AnimationOptions): string => {
        const easedProgress = Easing.get(options.easing || 'linear')(progress);
        const position = Math.floor(easedProgress * text.length);
        return text.slice(0, position) + (position < text.length ? '_' : '');
      }
    });

    // Fade animation
    this.register('fade', {
      render: (text: string, frame: number, progress: number, options: AnimationOptions): string => {
        const easedProgress = Easing.get(options.easing || 'ease-in-out')(progress);
        const opacity = Math.sin(easedProgress * Math.PI);
        const grayValue = Math.round(255 * opacity);
        return `\u001B[38;2;${grayValue};${grayValue};${grayValue}m${text}\u001B[39m`;
      }
    });
  }

  /**
   * Create complex animations by combining multiple effects
   */
  static createComposite(
    animations: Array<{
      type: AnimationType | string;
      weight: number;
      phase?: number;
    }>
  ): AnimationHandler {
    return {
      render: (text: string, frame: number, progress: number, options: AnimationOptions): string => {
        let result = text;
        
        for (const anim of animations) {
          const adjustedProgress = (progress + (anim.phase || 0)) % 1;
          const handler = this.getHandler(anim.type);
          
          if (handler) {
            const animatedText = handler.render(result, frame, adjustedProgress, options);
            // Apply weight to blend the animation
            if (anim.weight < 1) {
              // Simple blending - could be enhanced
              result = anim.weight > 0.5 ? animatedText : result;
            } else {
              result = animatedText;
            }
          }
        }
        
        return result;
      }
    };
  }

  /**
   * Create a wave animation effect
   */
  static createWave(amplitude: number = 1, frequency: number = 1): AnimationHandler {
    return {
      render: (text: string, _frame: number, progress: number, _options: AnimationOptions): string => {
        const chars = [...text];
        const result: string[] = [];
        
        for (let i = 0; i < chars.length; i++) {
          const wave = Math.sin((progress * frequency + i / chars.length) * Math.PI * 2);
          const intensity = Math.round((wave * amplitude + 1) * 127.5);
          result.push(`\u001B[38;2;${intensity};${intensity};${intensity}m${chars[i]}\u001B[39m`);
        }
        
        return result.join('');
      }
    };
  }

  /**
   * Create a rainbow animation effect
   */
  static createRainbow(speed: number = 1): AnimationHandler {
    return {
      render: (text: string, _frame: number, progress: number, _options: AnimationOptions): string => {
        const chars = [...text];
        const result: string[] = [];
        
        for (let i = 0; i < chars.length; i++) {
          const hue = ((progress * speed + i / chars.length) * 360) % 360;
          const rgb = this.hslToRgb(hue, 100, 50);
          result.push(`\u001B[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m${chars[i]}\u001B[39m`);
        }
        
        return result.join('');
      }
    };
  }

  /**
   * Create a matrix-style animation
   */
  static createMatrix(density: number = 0.1): AnimationHandler {
    return {
      render: (text: string, _frame: number, _progress: number, _options: AnimationOptions): string => {
        const chars = [...text];
        const result: string[] = [];
        const matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
        
        for (let i = 0; i < chars.length; i++) {
          if (Math.random() < density) {
            const randomChar = matrixChars[Math.floor(Math.random() * matrixChars.length)];
            const intensity = Math.round(Math.random() * 255);
            result.push(`\u001B[38;2;0;${intensity};0m${randomChar}\u001B[39m`);
          } else {
            result.push(chars[i]);
          }
        }
        
        return result.join('');
      }
    };
  }

  private static hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360;
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;

    let r: number, g: number, b: number;

    if (h < 1/6) {
      [r, g, b] = [c, x, 0];
    } else if (h < 2/6) {
      [r, g, b] = [x, c, 0];
    } else if (h < 3/6) {
      [r, g, b] = [0, c, x];
    } else if (h < 4/6) {
      [r, g, b] = [0, x, c];
    } else if (h < 5/6) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  }
}

// Initialize built-in animations
AnimationEngine.initializeBuiltins();