import { eraseLine } from '../core/ansi';
import { Style } from '../styles/style';
import { ResourceManager, Disposable } from '../core/resource-manager';
import { cursorManager } from '../core/cursor-manager';
import { safeExecute, safeDivide } from '../core/safe-utils';
import { InputValidator } from '../core/validators';
import { ValidationError, ConfigurationError, ErrorCode } from '../core/errors';

export interface ProgressBarOptions {
  total?: number;
  width?: number;
  complete?: string;
  incomplete?: string;
  head?: string;
  clear?: boolean;
  renderThrottle?: number;
  format?: string;
  stream?: NodeJS.WriteStream;
  barColor?: string | [number, number, number];
  completeColor?: string | [number, number, number];
}

export class ProgressBar implements Disposable {
  private current = 0;
  private startTime = Date.now();
  private lastRender = 0;
  private options: Required<ProgressBarOptions>;
  private isDisposed = false;
  private componentId: string;

  constructor(options: ProgressBarOptions = {}) {
    // Validate options
    if (options.total !== undefined) {
      if (typeof options.total !== 'number' || !Number.isFinite(options.total) || options.total < 0) {
        throw new ConfigurationError(
          'total must be a non-negative number',
          ErrorCode.CONFIG_INVALID_OPTION,
          { option: 'total', value: options.total }
        );
      }
    }
    
    if (options.width !== undefined) {
      const validation = InputValidator.validatePositiveNumber(options.width, 'width');
      if (!validation.valid) {
        throw new ConfigurationError(
          validation.error!,
          ErrorCode.CONFIG_INVALID_OPTION,
          { option: 'width', value: options.width }
        );
      }
    }
    
    if (options.renderThrottle !== undefined) {
      const validation = InputValidator.validatePositiveNumber(options.renderThrottle, 'renderThrottle');
      if (!validation.valid) {
        throw new ConfigurationError(
          validation.error!,
          ErrorCode.CONFIG_INVALID_OPTION,
          { option: 'renderThrottle', value: options.renderThrottle }
        );
      }
    }
    
    if (options.barColor !== undefined) {
      const validation = InputValidator.validateColor(options.barColor);
      if (!validation.valid) {
        throw new ConfigurationError(
          validation.error!,
          ErrorCode.INVALID_COLOR_INPUT,
          { option: 'barColor', value: options.barColor }
        );
      }
    }
    
    if (options.completeColor !== undefined) {
      const validation = InputValidator.validateColor(options.completeColor);
      if (!validation.valid) {
        throw new ConfigurationError(
          validation.error!,
          ErrorCode.INVALID_COLOR_INPUT,
          { option: 'completeColor', value: options.completeColor }
        );
      }
    }
    
    this.options = {
      total: 100,
      width: 40,
      complete: '█',
      incomplete: '░',
      head: '',
      clear: false,
      renderThrottle: 16,
      format: ':bar :percent :etas',
      stream: process.stdout,
      barColor: '',
      completeColor: '',
      ...options
    };
    
    // Generate unique component ID for cursor management
    this.componentId = `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Register with ResourceManager for automatic cleanup
    ResourceManager.register(this);
  }

  tick(delta = 1, tokens?: Record<string, string>): void {
    if (this.isDisposed) return;
    
    // Validate delta
    if (typeof delta !== 'number' || !Number.isFinite(delta)) {
      throw new ValidationError(
        'Delta must be a finite number',
        ErrorCode.INVALID_NUMBER_INPUT,
        { delta }
      );
    }
    
    const oldCurrent = this.current;
    this.current = Math.min(this.current + delta, this.options.total);
    this.render(tokens, oldCurrent !== this.current);
  }

  update(current: number, tokens?: Record<string, string>): void {
    if (this.isDisposed) return;
    
    // Validate current value
    if (typeof current !== 'number' || !Number.isFinite(current)) {
      throw new ValidationError(
        'Current value must be a finite number',
        ErrorCode.INVALID_NUMBER_INPUT,
        { current }
      );
    }
    
    this.current = Math.max(0, Math.min(current, this.options.total));
    this.render(tokens);
  }

  private render(tokens?: Record<string, string>, forceRender = false): void {
    if (this.isDisposed) return;
    
    const now = Date.now();
    if (!forceRender && this.options.renderThrottle > 0 && now - this.lastRender < this.options.renderThrottle && this.current < this.options.total) {
      return;
    }
    this.lastRender = now;

    // Ensure percent is between 0 and 1
    const rawPercent = safeDivide(this.current, this.options.total);
    const percent = Math.max(0, Math.min(1, rawPercent));
    
    const filledLength = Math.max(0, Math.floor(this.options.width * percent));
    const emptyLength = Math.max(0, this.options.width - filledLength);

    let filled = this.options.complete.repeat(Math.max(0, filledLength));
    const empty = this.options.incomplete.repeat(Math.max(0, emptyLength));

    if (this.options.head && filledLength > 0 && filledLength < this.options.width) {
      filled = filled.slice(0, -1) + this.options.head;
    }

    if (this.options.barColor) {
      const style = new Style();
      filled = typeof this.options.barColor === 'string'
        ? style.color(this.options.barColor).apply(filled)
        : style.color(this.options.barColor).apply(filled);
    }

    const bar = filled + empty;
    const elapsed = (now - this.startTime) / 1000;
    const eta = percent > 0 ? (elapsed / percent - elapsed) : 0;

    let output = this.options.format
      .replace(':bar', bar)
      .replace(':percent', `${Math.floor(percent * 100)}%`)
      .replace(':current', String(this.current))
      .replace(':total', String(this.options.total))
      .replace(':elapsed', this.formatTime(elapsed))
      .replace(':etas', eta > 0 ? this.formatTime(eta) : '')
      .replace(':eta', this.formatTime(eta));

    if (tokens) {
      Object.entries(tokens).forEach(([key, value]) => {
        output = output.replace(`:${key}`, value);
      });
    }

    if (this.options.completeColor && percent === 1) {
      const style = new Style();
      output = typeof this.options.completeColor === 'string'
        ? style.color(this.options.completeColor).apply(output)
        : style.color(this.options.completeColor).apply(output);
    }

    safeExecute(() => {
      // Hide cursor on first render using cursor manager
      cursorManager.hide(this.componentId);
      
      this.options.stream.write('\r' + eraseLine() + output);
    }, undefined, () => {
      // Handle stream errors gracefully
      this.dispose();
    });
  }


  private formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  complete(): void {
    if (this.isDisposed) return;
    
    this.current = this.options.total;
    this.render();
    
    try {
      this.options.stream.write('\n');
      
      // Show cursor using cursor manager
      cursorManager.show(this.componentId);
      
      if (this.options.clear) {
        this.options.stream.write('\r' + eraseLine());
      }
    } catch (error) {
      // Ignore stream errors during completion
    }
    
    this.dispose();
  }

  getRenderString(): string {
    const percent = safeDivide(this.current, this.options.total);
    const filledLength = Math.max(0, Math.floor(this.options.width * percent));
    const emptyLength = Math.max(0, this.options.width - filledLength);

    let filled = this.options.complete.repeat(filledLength);
    const empty = this.options.incomplete.repeat(emptyLength);

    if (this.options.head && filledLength > 0 && filledLength < this.options.width) {
      filled = filled.slice(0, -1) + this.options.head;
    }

    const bar = filled + empty;
    const elapsed = (Date.now() - this.startTime) / 1000;
    const eta = percent > 0 ? (elapsed / percent - elapsed) : 0;

    return this.options.format
      .replace(':bar', bar)
      .replace(':percent', `${Math.floor(percent * 100)}%`)
      .replace(':current', String(this.current))
      .replace(':total', String(this.options.total))
      .replace(':elapsed', this.formatTime(elapsed))
      .replace(':etas', eta > 0 ? this.formatTime(eta) : '')
      .replace(':eta', this.formatTime(eta));
  }
  
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    
    // Unregister from ResourceManager
    ResourceManager.unregister(this);
    
    // Show cursor using cursor manager
    cursorManager.show(this.componentId);
  }
}

export interface MultiProgressOptions {
  total?: number;
  width?: number;
  complete?: string;
  incomplete?: string;
  stream?: NodeJS.WriteStream;
}

export class MultiProgress implements Disposable {
  private bars: ProgressBar[] = [];
  private options: Required<MultiProgressOptions>;
  private isDisposed = false;

  constructor(options: MultiProgressOptions = {}) {
    this.options = {
      total: 100,
      width: 40,
      complete: '█',
      incomplete: '░',
      stream: process.stdout,
      ...options
    };
    
    // Register with ResourceManager for automatic cleanup
    ResourceManager.register(this);
  }

  newBar(format: string, options?: ProgressBarOptions): ProgressBar {
    if (this.isDisposed) {
      throw new Error('MultiProgress has been disposed');
    }
    
    const bar = new ProgressBar({
      format,
      ...this.options,
      ...options,
      stream: this.options.stream
    });
    
    this.bars.push(bar);
    return bar;
  }

  render(): void {
    if (this.isDisposed) return;
    
    safeExecute(() => {
      // Move cursor up to overwrite previous bars
      if (this.bars.length > 0) {
        // Use relative cursor movement instead of absolute positioning
        for (let i = 0; i < this.bars.length; i++) {
          this.options.stream.write('\u001b[1A'); // Move up one line
        }
      }

      // Render each bar
      this.bars.forEach((bar, index) => {
        this.options.stream.write('\r' + eraseLine() + bar.getRenderString());
        if (index < this.bars.length - 1) {
          this.options.stream.write('\n');
        }
      });
    }, undefined, () => {
      // Handle stream errors
      this.dispose();
    });
  }

  update(): void {
    this.render();
  }
  
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    
    // Unregister from ResourceManager
    ResourceManager.unregister(this);
    
    // Dispose all bars safely
    const barsToDispose = [...this.bars];
    this.bars = [];
    
    barsToDispose.forEach(bar => {
      try {
        bar.dispose();
      } catch (error) {
        console.warn('Error disposing progress bar:', error);
      }
    });
  }
}

export function progressBar(options?: ProgressBarOptions): ProgressBar {
  return new ProgressBar(options);
}

export function multiProgress(options?: MultiProgressOptions): MultiProgress {
  return new MultiProgress(options);
}

// Add bar method for backward compatibility
export function bar(current: number, total: number, options?: ProgressBarOptions): string {
  const barOptions = { ...options, total };
  
  // Create the bar string
  const percent = total > 0 ? current / total : 0;
  const width = barOptions.width || 40;
  const filledLength = Math.max(0, Math.min(width, Math.floor(width * percent)));
  const emptyLength = Math.max(0, width - filledLength);
  
  const complete = barOptions.complete || '█';
  const incomplete = barOptions.incomplete || '░';
  
  return complete.repeat(filledLength) + incomplete.repeat(emptyLength);
}