import { Style } from './styles/style';

export type Condition = boolean | (() => boolean);
export type ConditionalStyle = [Condition, Style | string];

export interface ConditionalOptions {
  defaultStyle?: Style;
  fallback?: string;
}

export class ConditionalFormatter {
  private conditions: ConditionalStyle[] = [];
  private options: ConditionalOptions;
  public format: any;

  constructor(condition: boolean, options?: ConditionalOptions);
  constructor(options?: ConditionalOptions);
  constructor(conditionOrOptions?: boolean | ConditionalOptions, optionsParam?: ConditionalOptions) {
    let condition: boolean | undefined;
    let options: ConditionalOptions;

    if (typeof conditionOrOptions === 'boolean') {
      condition = conditionOrOptions;
      options = optionsParam || {};
    } else {
      options = conditionOrOptions || {};
    }

    this.options = {
      defaultStyle: new Style(),
      fallback: '',
      ...options
    };
    
    // Handle explicit undefined defaultStyle
    if (options && typeof options === 'object' && 'defaultStyle' in options && options.defaultStyle === undefined) {
      this.options.defaultStyle = undefined;
    }

    // If condition is provided, create a conditional formatter
    if (condition !== undefined) {
      this.format = conditional(condition, options);
    } else {
      // Create a format method that applies the configured conditions
      this.format = (text: string) => this.formatText(text);
    }
  }

  when(condition: Condition, style: Style | string): this {
    this.conditions.push([condition, style]);
    return this;
  }
  
  elsif(condition: Condition, style: Style | string): this {
    return this.when(condition, style);
  }
  
  else(style: Style | string): this {
    this.conditions.push([true, style]);
    return this;
  }

  formatText(text: string): string {
    for (const [condition, style] of this.conditions) {
      let isTrue: boolean;
      try {
        isTrue = typeof condition === 'function' ? condition() : condition;
      } catch (error) {
        // Fix: Add debug logging for swallowed errors
        if (typeof process !== 'undefined' && process.env && process.env.DEBUG) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('Condition evaluation error:', error);
          }
        }
        // If condition function throws, treat as false
        isTrue = false;
      }
      
      if (isTrue) {
        if (typeof style === 'string') {
          return style;
        }
        return style.apply(text);
      }
    }
    
    if (this.options.defaultStyle) {
      return this.options.defaultStyle.apply(text);
    }
    
    return this.options.fallback || text;
  }
}

export function conditional(): ConditionalFormatter;
export function conditional(condition: any, options?: ConditionalOptions): any;
export function conditional(condition?: any, options?: ConditionalOptions): any & { when: (...args: any[]) => any } {
  // If no arguments provided, return a new ConditionalFormatter for chaining
  if (arguments.length === 0) {
    return new ConditionalFormatter(options);
  }
  
  if (condition) {
    const style = new Style([], [], { force: true, ...options });
    
    // Create a proxy that makes style getters callable
    const proxy = new Proxy(style, {
      get(target, prop) {
        const value = target[prop as keyof Style];
        
        // If it's a Style getter, make it callable
        if (value instanceof Style) {
          return (text: string) => value.apply(text);
        }
        
        // If it's a method, bind it
        if (typeof value === 'function') {
          return value.bind(target);
        }
        
        return value;
      }
    });
    
    return proxy;
  } else {
    // For falsy values including null, return no-op proxy
    return createNoOpProxy();
  }
}

// Helper function to create a no-op proxy
function createNoOpProxy(): any {
  const createNoOpMethod = () => (text: string) => text;
  
  const proxy = new Proxy(createNoOpMethod(), {
    get: (_target, prop) => {
      // Common style method names
      const styleMethods = [
        'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray', 'black',
        'bgRed', 'bgGreen', 'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan', 'bgWhite', 'bgGray', 'bgBlack',
        'bold', 'dim', 'italic', 'underline', 'inverse', 'hidden', 'strikethrough',
        'rgb', 'hex', 'bgRgb', 'bgHex', 'color', 'bgColor'
      ];
      
      if (styleMethods.includes(String(prop))) {
        return createNoOpMethod();
      }
      
      // For apply method
      if (prop === 'apply') {
        return createNoOpMethod();
      }
      
      // Return another proxy that maintains the chainable interface
      return proxy;
    },
    apply: (_target, _thisArg, args) => args[0] || ''
  });
  return proxy;
}

export interface LogLevel {
  name: string;
  value: number;
  style: Style;
  prefix?: string;
}

export const logLevels: Record<string, LogLevel> = {
  trace: { name: 'TRACE', value: 10, style: new Style().gray, prefix: '🔍' },
  debug: { name: 'DEBUG', value: 20, style: new Style().cyan, prefix: '🐛' },
  info: { name: 'INFO', value: 30, style: new Style().blue, prefix: 'ℹ️' },
  warn: { name: 'WARN', value: 40, style: new Style().yellow, prefix: '⚠️' },
  error: { name: 'ERROR', value: 50, style: new Style().red, prefix: '❌' },
  fatal: { name: 'FATAL', value: 60, style: new Style().red.bold.inverse, prefix: '💀' }
};

export class LogFormatter {
  private minLevel: number;
  private usePrefix: boolean;
  private timestamp: boolean;

  constructor(options: { minLevel?: string; usePrefix?: boolean; timestamp?: boolean } = {}) {
    this.minLevel = logLevels[options.minLevel || 'info'].value;
    this.usePrefix = options.usePrefix ?? true;
    this.timestamp = options.timestamp ?? false;
  }

  format(level: string, message: string): string | null {
    const logLevel = logLevels[level];
    if (!logLevel || logLevel.value < this.minLevel) {
      return null;
    }

    let output = '';
    
    if (this.timestamp) {
      const time = new Date().toISOString();
      output += new Style().gray.apply(`[${time}] `);
    }
    
    if (this.usePrefix && logLevel.prefix) {
      output += logLevel.prefix + ' ';
    }
    
    output += logLevel.style.apply(`[${logLevel.name}]`) + ' ';
    output += message;
    
    return output;
  }

  trace(message: string): string | null {
    return this.format('trace', message);
  }

  debug(message: string): string | null {
    return this.format('debug', message);
  }

  info(message: string): string | null {
    return this.format('info', message);
  }

  warn(message: string): string | null {
    return this.format('warn', message);
  }

  error(message: string): string | null {
    return this.format('error', message);
  }

  fatal(message: string): string | null {
    return this.format('fatal', message);
  }
}

export function createLogFormatter(options?: ConstructorParameters<typeof LogFormatter>[0]): LogFormatter {
  return new LogFormatter(options);
}

export interface StatusFormatter {
  success(text: string): string;
  error(text: string): string;
  warning(text: string): string;
  info(text: string): string;
  pending(text: string): string;
  skipped(text: string): string;
}

export function createStatusFormatter(): StatusFormatter {
  return {
    success: (text: string) => new Style().green.apply('✓ ') + text,
    error: (text: string) => new Style().red.apply('✗ ') + text,
    warning: (text: string) => new Style().yellow.apply('⚠ ') + text,
    info: (text: string) => new Style().blue.apply('ℹ ') + text,
    pending: (text: string) => new Style().gray.apply('◌ ') + text,
    skipped: (text: string) => new Style().gray.dim.apply('⊘ ') + text
  };
}

// Helper function for color conditional
export function color(input: string, fallback?: string | Style): string {
  // If input contains ANSI codes, return it, otherwise return fallback
  if (input && typeof input === 'string' && input.includes('\u001B[')) {
    return input;
  }
  
  // Handle fallback - if it's a Style object, apply it to the input
  if (fallback && typeof fallback === 'object' && 'apply' in fallback) {
    return (fallback as Style).apply(input);
  }
  
  return (fallback as string) || input;
}

// Add when method to conditional function for chaining API
conditional.when = function(condition: Condition | (() => Promise<boolean>), text: string, style?: Style | string): string | Promise<string> {
  try {
    if (typeof condition === 'function') {
      const result = condition();
      // Handle async functions that return promises
      if (result && typeof result === 'object' && 'then' in result && typeof result.then === 'function') {
        return (result as Promise<boolean>).then((isTrue: boolean) => {
          if (isTrue && style) {
            if (typeof style === 'string') {
              return style;
            }
            return style.apply(text);
          }
          return text;
        }).catch(() => {
          // If async condition rejects, return text unchanged
          return text;
        });
      }
      // Handle sync functions
      const isTrue = result as boolean;
      if (isTrue && style) {
        if (typeof style === 'string') {
          return style;
        }
        return style.apply(text);
      }
      return text;
    }
    
    // Handle boolean conditions
    const isTrue = condition as boolean;
    if (isTrue && style) {
      if (typeof style === 'string') {
        return style;
      }
      return style.apply(text);
    }
    return text;
  } catch (error) {
    // Fix: Add debug logging for swallowed errors
    if (typeof process !== 'undefined' && process.env && process.env.DEBUG) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Conditional formatting error:', error);
      }
    }
    // If condition throws, return text unchanged
    return text;
  }
};