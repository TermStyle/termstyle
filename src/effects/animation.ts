import { eraseLine } from '../core/ansi';
import { Style } from '../styles/style';
import { ResourceManager, Disposable } from '../core/resource-manager';
import { cursorManager } from '../core/cursor-manager';
import { safeExecute } from '../core/safe-utils';
import { InputValidator } from '../core/validators';
import { AnimationError, ErrorCode } from '../core/errors';

export type AnimationType = 'blink' | 'pulse' | 'slide' | 'typewriter' | 'fade';

export interface AnimationOptions {
  duration?: number;
  interval?: number;
  iterations?: number;
  onComplete?: () => void;
}

export class Animation implements Disposable {
  private intervalId?: NodeJS.Timeout;
  private running = false;
  private isDisposed = false;
  private componentId: string;
  private frameCount = 0;
  private startTime = 0;
  private pausedFrame = 0;
  private pausedIteration = 0;

  constructor(
    private text: string,
    private type: AnimationType,
    private options: AnimationOptions = {}
  ) {
    // Validate text input
    const textValidation = InputValidator.validateText(text);
    if (!textValidation.valid) {
      throw new AnimationError(
        textValidation.error!,
        ErrorCode.INVALID_TEXT_INPUT,
        { text }
      );
    }
    this.text = textValidation.value!.text;
    
    // Validate animation options
    if (options.duration !== undefined) {
      const durationValidation = InputValidator.validatePositiveNumber(options.duration, 'duration');
      if (!durationValidation.valid) {
        throw new AnimationError(
          durationValidation.error!,
          ErrorCode.INVALID_NUMBER_INPUT,
          { duration: options.duration }
        );
      }
    }
    
    if (options.interval !== undefined) {
      const intervalValidation = InputValidator.validatePositiveNumber(options.interval, 'interval');
      if (!intervalValidation.valid) {
        throw new AnimationError(
          intervalValidation.error!,
          ErrorCode.INVALID_NUMBER_INPUT,
          { interval: options.interval }
        );
      }
    }
    
    if (options.iterations !== undefined && options.iterations !== Infinity) {
      const iterationsValidation = InputValidator.validatePositiveNumber(options.iterations, 'iterations');
      if (!iterationsValidation.valid) {
        throw new AnimationError(
          iterationsValidation.error!,
          ErrorCode.INVALID_NUMBER_INPUT,
          { iterations: options.iterations }
        );
      }
    }
    
    this.options = {
      duration: 1000,
      interval: 100,
      iterations: Infinity,
      ...options
    };
    
    // Generate unique component ID for cursor management
    this.componentId = `animation-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    
    // Register with ResourceManager for automatic cleanup
    ResourceManager.register(this);
  }

  start(): void {
    if (this.running || this.isDisposed) return;
    
    // Atomic disposal: Clear any existing interval BEFORE creating new one
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
    this.running = true;
    
    // Hide cursor using cursor manager
    cursorManager.hide(this.componentId);
    
    // Fix: Start frame at 0 instead of 1 to properly show progress 0.0 to 1.0
    let frame = this.pausedFrame || 0;
    let iteration = this.pausedIteration || 0;
    // Ensure totalFrames is at least 1 to prevent division by zero
    const totalFrames = Math.max(1, Math.floor((this.options.duration || 1000) / (this.options.interval || 100)));

    this.intervalId = setInterval(() => {
      // Double-check disposal state to prevent zombie timers
      if (this.isDisposed || !this.running) {
        this.stop();
        return;
      }

      // Fix: Calculate progress to properly range from 0.0 to 1.0
      const progress = Math.min(1.0, frame / Math.max(1, totalFrames - 1));
      
      const success = safeExecute(() => {
        if (typeof process !== 'undefined' && process.stdout) {
          // Use carriage return to go to beginning of current line instead of absolute positioning
          process.stdout.write('\r' + eraseLine());
          
          switch (this.type) {
            case 'blink':
              this.renderBlink(progress);
              break;
            case 'pulse':
              this.renderPulse(progress);
              break;
            case 'slide':
              this.renderSlide(progress);
              break;
            case 'typewriter':
              this.renderTypewriter(progress);
              break;
            case 'fade':
              this.renderFade(progress);
              break;
          }
          return true;
        }
        return false;
      }, false);
      
      if (!success) {
        this.stop();
        return;
      }
      
      frame++;

      // Fix: Reset frame when it reaches totalFrames (not totalFrames + 1)
      if (frame >= totalFrames) {
        iteration++;
        frame = 0;
        
        if (this.options.iterations !== Infinity && this.options.iterations !== undefined && iteration >= this.options.iterations) {
          this.stop();
          // FIX BUG-ERR-001: Wrap onComplete callback in try-catch to prevent crashes
          if (this.options.onComplete) {
            try {
              this.options.onComplete();
            } catch (error) {
              // Log error but continue cleanup to prevent resource leaks
              if (typeof process !== 'undefined' && process.env && process.env.DEBUG) {
                if (typeof console !== 'undefined' && console.error) {
                  console.error('Error in onComplete callback:', error);
                }
              }
            }
          }
        }
      }
      
      // Update paused state in case of pause
      this.pausedFrame = frame;
      this.pausedIteration = iteration;
    }, this.options.interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.running = false;
    
    // Reset paused state on stop
    this.pausedFrame = 0;
    this.pausedIteration = 0;
    
    // Show cursor using cursor manager
    if (!this.isDisposed) {
      cursorManager.show(this.componentId);
    }
  }
  
  pause(frame?: number, iteration?: number): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.running = false;
    
    // Save current state if provided
    if (frame !== undefined) {
      this.pausedFrame = frame;
    }
    if (iteration !== undefined) {
      this.pausedIteration = iteration;
    }
  }
  
  resume(): void {
    if (!this.running && !this.isDisposed) {
      this.start();
    }
  }
  
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    
    // Unregister from ResourceManager
    ResourceManager.unregister(this);
    
    // Stop animation
    this.stop();
    
    // Ensure cursor is shown by this component
    cursorManager.show(this.componentId);
  }

  private renderBlink(progress: number): void {
    if (progress <= 0.5) {
      process.stdout.write(this.text);
    } else {
      process.stdout.write(' '.repeat(this.text.length));
    }
  }

  private renderPulse(progress: number): void {
    const intensity = Math.sin(progress * Math.PI) * 128 + 127;
    const color: [number, number, number] = [intensity, intensity, intensity];
    const styled = new Style().color(color).apply(this.text);
    process.stdout.write(styled);
  }

  private renderSlide(progress: number): void {
    const offset = Math.floor(progress * this.text.length);
    const visible = this.text.slice(0, offset) + ' '.repeat(this.text.length - offset);
    process.stdout.write(visible);
  }

  private renderTypewriter(progress: number): void {
    const chars = Math.floor(progress * this.text.length);
    const visible = this.text.slice(0, chars);
    process.stdout.write(visible + '█');
  }

  private renderFade(progress: number): void {
    const opacity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    const intensity = Math.floor(opacity * 255);
    const color: [number, number, number] = [intensity, intensity, intensity];
    const styled = new Style().color(color).apply(this.text);
    process.stdout.write(styled);
  }
}

export function animate(
  text: string,
  type: AnimationType,
  options?: AnimationOptions
): Animation {
  const animation = new Animation(text, type, options);
  animation.start();
  return animation;
}

export const spinners = {
  dots: { frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'], interval: 80 },
  dots2: { frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'], interval: 80 },
  dots3: { frames: ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓'], interval: 80 },
  line: { frames: ['-', '\\', '|', '/'], interval: 130 },
  line2: { frames: ['⠂', '-', '–', '—', '–', '-'], interval: 100 },
  pipe: { frames: ['┤', '┘', '┴', '└', '├', '┌', '┬', '┐'], interval: 100 },
  star: { frames: ['✶', '✸', '✹', '✺', '✹', '✷'], interval: 70 },
  toggle: { frames: ['⊶', '⊷'], interval: 250 },
  box: { frames: ['◰', '◳', '◲', '◱'], interval: 120 },
  circle: { frames: ['◐', '◓', '◑', '◒'], interval: 120 },
  arrow: { frames: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'], interval: 100 },
  bounce: { frames: ['⠁', '⠂', '⠄', '⠂'], interval: 120 },
  bar: { frames: ['▁', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃'], interval: 80 },
  earth: { frames: ['🌍', '🌎', '🌏'], interval: 180 },
  moon: { frames: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'], interval: 80 },
  clock: { frames: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'], interval: 100 },
  balloon: { frames: [' ', '.', 'o', 'O', '@', '*', ' '], interval: 140 },
  noise: { frames: ['▓', '▒', '░'], interval: 100 },
  boxBounce: { frames: ['▖', '▘', '▝', '▗'], interval: 120 },
  triangle: { frames: ['◢', '◣', '◤', '◥'], interval: 50 },
  binary: { frames: ['010010', '101101', '010010', '101010'], interval: 120 },
  runner: { frames: ['🚶', '🏃'], interval: 140 },
  pong: { frames: ['▐⠂       ▌', '▐⠈       ▌', '▐ ⠂      ▌', '▐ ⠠      ▌', '▐  ⡀     ▌', '▐  ⠠     ▌', '▐   ⠂    ▌', '▐   ⠈    ▌', '▐    ⠂   ▌', '▐    ⠠   ▌', '▐     ⡀  ▌', '▐     ⠠  ▌', '▐      ⠂ ▌', '▐      ⠈ ▌', '▐       ⠂▌', '▐       ⠠▌', '▐       ⡀▌', '▐      ⠠ ▌', '▐      ⠂ ▌', '▐     ⠈  ▌', '▐     ⠂  ▌', '▐    ⠠   ▌', '▐    ⡀   ▌', '▐   ⠠    ▌', '▐   ⠂    ▌', '▐  ⠈     ▌', '▐  ⠂     ▌', '▐ ⠠      ▌', '▐ ⡀      ▌', '▐⠠       ▌'], interval: 80 },
  shark: { frames: ['▐|\\____________▌', '▐_|\\___________▌', '▐__|\\__________▌', '▐___|\\_________▌', '▐____|\\________▌', '▐_____|\\_______▌', '▐______|\\______▌', '▐_______|\\_____▌', '▐________|\\____▌', '▐_________|\\___▌', '▐__________|\\__▌', '▐___________|\\_▌', '▐____________|\\▌', '▐____________/|▌', '▐___________/|_▌', '▐__________/|__▌', '▐_________/|___▌', '▐________/|____▌', '▐_______/|_____▌', '▐______/|______▌', '▐_____/|_______▌', '▐____/|________▌', '▐___/|_________▌', '▐__/|__________▌', '▐_/|___________▌', '▐/|____________▌'], interval: 120 },
  dqpb: { frames: ['d', 'q', 'p', 'b'], interval: 100 },
  weather: { frames: ['☀️ ', '⛅ ', '🌤 ', '⛈ ', '🌧 ', '🌦 ', '☀️ '], interval: 100 },
  christmas: { frames: ['🌲', '🎄'], interval: 400 }
} as const;

export type SpinnerName = keyof typeof spinners;

export class Spinner implements Disposable {
  private frames: string[];
  private currentFrame = 0;
  private intervalId?: NodeJS.Timeout;
  private running = false;
  private interval: number;
  private isDisposed = false;
  private componentId: string;

  constructor(
    private text: string,
    spinnerOrOptions?: SpinnerName | { spinner?: SpinnerName | string; color?: string; interval?: number },
    interval?: number
  ) {
    // Validate text input
    const textValidation = InputValidator.validateText(text);
    if (!textValidation.valid) {
      throw new AnimationError(
        textValidation.error!,
        ErrorCode.INVALID_TEXT_INPUT,
        { text }
      );
    }
    this.text = textValidation.value!.text;
    
    let spinnerName: SpinnerName = 'dots';
    let finalInterval = 80;

    if (typeof spinnerOrOptions === 'string') {
      spinnerName = spinnerOrOptions;
      finalInterval = interval ?? spinners[spinnerName]?.interval ?? 80;
    } else if (spinnerOrOptions && typeof spinnerOrOptions === 'object') {
      spinnerName = (spinnerOrOptions.spinner as SpinnerName) ?? 'dots';
      finalInterval = spinnerOrOptions.interval ?? spinners[spinnerName]?.interval ?? 80;
    }
    
    // Validate interval
    if (finalInterval) {
      const intervalValidation = InputValidator.validatePositiveNumber(finalInterval, 'interval');
      if (!intervalValidation.valid) {
        throw new AnimationError(
          intervalValidation.error!,
          ErrorCode.INVALID_NUMBER_INPUT,
          { interval: finalInterval }
        );
      }
    }

    // Handle invalid spinner names gracefully
    const spinner = spinners[spinnerName];
    if (spinner) {
      this.frames = [...spinner.frames];
      this.interval = finalInterval;
    } else {
      // Fallback to dots if spinner not found
      this.frames = [...spinners.dots.frames];
      this.interval = finalInterval;
    }
    
    // Generate unique component ID for cursor management
    this.componentId = `spinner-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    
    // Register with ResourceManager for automatic cleanup
    ResourceManager.register(this);
  }

  start(): void {
    if (this.running || this.isDisposed) return;
    
    // Clear any existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.running = true;
    
    // Hide cursor using cursor manager
    cursorManager.hide(this.componentId);
    
    this.intervalId = setInterval(() => {
      if (this.isDisposed) {
        this.stop();
        return;
      }
      
      const success = safeExecute(() => {
        if (typeof process !== 'undefined' && process.stdout) {
          // Fix: Protect against empty frames array
          if (this.frames.length === 0) {
            return false;
          }
          const frame = this.frames[this.currentFrame];
          process.stdout.write(`\r${frame} ${this.text}`);
          this.currentFrame = (this.currentFrame + 1) % this.frames.length;
          return true;
        }
        return false;
      }, false);
      
      if (!success) {
        this.stop();
      }
    }, this.interval);
  }

  stop(finalText?: string): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.running = false;
    
    if (!this.isDisposed) {
      safeExecute(() => {
        if (typeof process !== 'undefined' && process.stdout) {
          process.stdout.write('\r' + eraseLine());
          if (finalText) {
            process.stdout.write(finalText);
          }
          process.stdout.write('\n');
        }
        // Show cursor using cursor manager
        cursorManager.show(this.componentId);
      }, undefined);
    }
  }

  update(text: string): void {
    // FIX BUG-ERR-002: Add input validation consistent with constructor
    const textValidation = InputValidator.validateText(text);
    if (!textValidation.valid) {
      throw new AnimationError(
        textValidation.error!,
        ErrorCode.INVALID_TEXT_INPUT,
        { text }
      );
    }
    this.text = textValidation.value!.text;
  }

  updateColor(_color: string): void {
    // Store color for future use - this is a placeholder for color functionality
  }

  succeed(text?: string): void {
    this.stop(`✓ ${text || this.text}`);
  }

  fail(text?: string): void {
    this.stop(`✗ ${text || this.text}`);
  }

  warn(text?: string): void {
    this.stop(`⚠ ${text || this.text}`);
  }

  info(text?: string): void {
    this.stop(`ℹ ${text || this.text}`);
  }

  clear(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.running = false;
    
    if (!this.isDisposed) {
      safeExecute(() => {
        if (typeof process !== 'undefined' && process.stdout) {
          process.stdout.write('\r' + eraseLine());
        }
        // Show cursor using cursor manager
        cursorManager.show(this.componentId);
      }, undefined);
    }
  }
  
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    
    // Ensure interval is cleared first
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
    // Unregister from ResourceManager
    ResourceManager.unregister(this);
    
    // Clear animation
    this.clear();
    
    // Ensure cursor is shown by this component
    cursorManager.show(this.componentId);
  }
}

export function spinner(
  text: string, 
  options?: SpinnerName | { spinner?: SpinnerName; color?: string; interval?: number }
): Spinner {
  const s = new Spinner(text, options);
  s.start();
  return s;
}

// Add pulse animation function for backward compatibility
export function pulse(text: string, options: { color?: string; duration?: number } = {}): string[] {
  const frames: string[] = [];
  // Ensure totalFrames is at least 1 to prevent empty array
  const totalFrames = Math.max(1, Math.floor((options.duration || 1000) / 100)); // 100ms per frame
  
  for (let i = 0; i < totalFrames; i++) {
    let styledText = text;
    if (options.color) {
      const style = new Style([], [], { force: true });
      styledText = style.color(options.color).apply(text);
    }
    
    frames.push(styledText);
  }
  
  return frames;
}