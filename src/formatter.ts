import { Style, StyleOptions } from './styles/style';
import { stripAnsi } from './core/ansi';

type FormatterFunction = {
  (text: string): string;
  (...args: any[]): string;
};

export type FormatterProxy = FormatterFunction & Record<string, any>;

export class Formatter {
  private style: Style;

  constructor(options: StyleOptions = {}) {
    this.style = new Style([], [], options);
  }

  private createProxy(style: Style): FormatterProxy {
    // FIX BUG-005: Use unknown[] for better type safety in internal implementation
    const formatter = (...args: unknown[]): string => {
      if (args.length === 0) return '';

      if (args.length === 1 && typeof args[0] === 'string') {
        return style.apply(args[0]);
      }

      if (Array.isArray(args[0]) && 'raw' in args[0]) {
        return this.template(style, args[0] as TemplateStringsArray, ...args.slice(1));
      }

      return style.apply(args.map(String).join(' '));
    };

    return new Proxy(formatter as FormatterProxy, {
      get: (target, prop: string) => {
        // Special methods from Formatter class
        if (prop === 'strip') {
          return this.strip.bind(this);
        }
        
        if (prop in style) {
          const styleObj = style as Style & Record<string, unknown>;
          const newStyle = styleObj[prop];
          if (newStyle instanceof Style) {
            return this.createProxy(newStyle);
          }
          if (typeof newStyle === 'function') {
            return (...args: unknown[]) => {
              const result = (newStyle as (...args: unknown[]) => unknown).apply(style, args);
              if (result instanceof Style) {
                return this.createProxy(result);
              }
              return result;
            };
          }
        }
        return target[prop as keyof FormatterProxy];
      }
    });
  }

  // FIX BUG-005: Use unknown[] for better type safety
  private template(style: Style, strings: TemplateStringsArray, ...values: unknown[]): string {
    let result = '';

    strings.forEach((str, i) => {
      result += str;
      if (i < values.length) {
        result += String(values[i]);
      }
    });

    return style.apply(result);
  }

  get proxy(): FormatterProxy {
    return this.createProxy(this.style);
  }

  strip(text: string): string {
    return stripAnsi(text);
  }

  static create(options: StyleOptions = {}): FormatterProxy {
    const formatter = new Formatter(options);
    return formatter.proxy;
  }
}


export interface FormatterInstance extends FormatterProxy {
  (text: string): string;
  (...args: any[]): string;
  (strings: TemplateStringsArray, ...values: any[]): string;
  
  strip: (text: string) => string;
  
  color: (color: string | number | [number, number, number]) => FormatterProxy;
  bgColor: (color: string | number | [number, number, number]) => FormatterProxy;
  rgb: (r: number, g: number, b: number) => FormatterProxy;
  bgRgb: (r: number, g: number, b: number) => FormatterProxy;
  hex: (hex: string) => FormatterProxy;
  bgHex: (hex: string) => FormatterProxy;
}

export interface FormatterAPI extends FormatterInstance {
  black: FormatterInstance;
  red: FormatterInstance;
  green: FormatterInstance;
  yellow: FormatterInstance;
  blue: FormatterInstance;
  magenta: FormatterInstance;
  cyan: FormatterInstance;
  white: FormatterInstance;
  gray: FormatterInstance;
  grey: FormatterInstance;
  
  bgBlack: FormatterInstance;
  bgRed: FormatterInstance;
  bgGreen: FormatterInstance;
  bgYellow: FormatterInstance;
  bgBlue: FormatterInstance;
  bgMagenta: FormatterInstance;
  bgCyan: FormatterInstance;
  bgWhite: FormatterInstance;
  bgGray: FormatterInstance;
  bgGrey: FormatterInstance;
  
  bold: FormatterInstance;
  dim: FormatterInstance;
  italic: FormatterInstance;
  underline: FormatterInstance;
  inverse: FormatterInstance;
  hidden: FormatterInstance;
  strikethrough: FormatterInstance;
}