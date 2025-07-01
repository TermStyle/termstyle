// Core type definitions for TermStyle

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export type ColorValue = 
  | string           // hex, named color
  | number           // ANSI 256
  | RGB              // RGB object
  | HSL              // HSL object
  | [number, number, number]; // RGB array

export interface ColorInput {
  type: 'rgb' | 'hex' | 'ansi256' | 'named' | 'hsl';
  value: ColorValue | HSL;
}

export type StyleModifier = 
  | 'bold'
  | 'dim'
  | 'italic'
  | 'underline'
  | 'inverse'
  | 'hidden'
  | 'strikethrough'
  | 'overline';

export interface StyleOptions {
  level?: 0 | 1 | 2 | 3;
  force?: boolean;
}

export interface FormatterOptions extends StyleOptions {
  stream?: NodeJS.WriteStream;
}

// Properly typed formatter methods
export interface FormatterMethods {
  // Text modifiers
  bold: FormatterProxy;
  dim: FormatterProxy;
  italic: FormatterProxy;
  underline: FormatterProxy;
  inverse: FormatterProxy;
  hidden: FormatterProxy;
  strikethrough: FormatterProxy;
  overline: FormatterProxy;
  
  // Reset
  reset: FormatterProxy;
  
  // Colors
  black: FormatterProxy;
  red: FormatterProxy;
  green: FormatterProxy;
  yellow: FormatterProxy;
  blue: FormatterProxy;
  magenta: FormatterProxy;
  cyan: FormatterProxy;
  white: FormatterProxy;
  gray: FormatterProxy;
  grey: FormatterProxy;
  
  // Bright colors
  brightBlack: FormatterProxy;
  brightRed: FormatterProxy;
  brightGreen: FormatterProxy;
  brightYellow: FormatterProxy;
  brightBlue: FormatterProxy;
  brightMagenta: FormatterProxy;
  brightCyan: FormatterProxy;
  brightWhite: FormatterProxy;
  
  // Background colors
  bgBlack: FormatterProxy;
  bgRed: FormatterProxy;
  bgGreen: FormatterProxy;
  bgYellow: FormatterProxy;
  bgBlue: FormatterProxy;
  bgMagenta: FormatterProxy;
  bgCyan: FormatterProxy;
  bgWhite: FormatterProxy;
  bgGray: FormatterProxy;
  bgGrey: FormatterProxy;
  
  // Bright background colors
  bgBrightBlack: FormatterProxy;
  bgBrightRed: FormatterProxy;
  bgBrightGreen: FormatterProxy;
  bgBrightYellow: FormatterProxy;
  bgBrightBlue: FormatterProxy;
  bgBrightMagenta: FormatterProxy;
  bgBrightCyan: FormatterProxy;
  bgBrightWhite: FormatterProxy;
  
  // Color methods
  rgb(r: number, g: number, b: number): FormatterProxy;
  hex(color: string): FormatterProxy;
  color(color: ColorValue): FormatterProxy;
  bgRgb(r: number, g: number, b: number): FormatterProxy;
  bgHex(color: string): FormatterProxy;
  bgColor(color: ColorValue): FormatterProxy;
}

export interface FormatterProxy extends FormatterMethods {
  (text: any): string;
  (literals: TemplateStringsArray, ...substitutions: any[]): string;
}

// Animation types
export type AnimationType = 
  | 'blink'
  | 'pulse'
  | 'slide'
  | 'typewriter'
  | 'fade'
  | 'rainbow'
  | 'neon';

export interface AnimationOptions {
  duration?: number;
  fps?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  loop?: boolean;
  onFrame?: (frame: string) => void;
  onComplete?: () => void;
}

export interface AnimationFrame {
  content: string;
  timestamp: number;
}

// Gradient types
export interface GradientOptions {
  interpolation?: 'rgb' | 'hsl';
  direction?: 'horizontal' | 'vertical' | 'diagonal';
}

// Box types
export type BoxStyle = 
  | 'single'
  | 'double'
  | 'round'
  | 'bold'
  | 'double-single'
  | 'classic'
  | 'arrow';

export interface BoxOptions {
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  borderStyle?: BoxStyle;
  borderColor?: ColorValue;
  backgroundColor?: ColorValue;
  align?: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
  title?: string;
  titleAlign?: 'left' | 'center' | 'right';
}

// Progress bar types
export interface ProgressBarOptions {
  width?: number;
  total?: number;
  current?: number;
  format?: string;
  barChar?: string;
  emptyChar?: string;
  barColor?: ColorValue;
  textColor?: ColorValue;
  showPercentage?: boolean;
  showETA?: boolean;
  renderThrottle?: number;
}

// Theme types
export interface ThemeColors {
  primary: ColorValue;
  secondary: ColorValue;
  success: ColorValue;
  warning: ColorValue;
  error: ColorValue;
  info: ColorValue;
  muted: ColorValue;
  background: ColorValue;
  foreground: ColorValue;
}

export interface ThemeStyles {
  heading: string[];
  subheading: string[];
  body: string[];
  code: string[];
  link: string[];
  emphasis: string[];
  strong: string[];
  muted: string[];
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  styles: ThemeStyles;
}

// Terminal types
export interface TerminalInfo {
  colorLevel: 0 | 1 | 2 | 3;
  supportsColor: boolean;
  supports256: boolean;
  supportsTrueColor: boolean;
  isCI: boolean;
  isDumb: boolean;
  platform: NodeJS.Platform;
  env: string;
  program: string;
  columns: number;
  rows: number;
}

// Conditional formatting types
export interface ConditionalOptions {
  defaultStyle?: string[];
  async?: boolean;
}

export type ConditionalPredicate = (value: any) => boolean | Promise<boolean>;

export interface ConditionalRule {
  condition: ConditionalPredicate;
  style: string[];
}

// Template types
export interface TemplateHelpers {
  if: (condition: boolean, trueValue: any, falseValue?: any) => any;
  unless: (condition: boolean, falseValue: any, trueValue?: any) => any;
  eq: (a: any, b: any) => boolean;
  neq: (a: any, b: any) => boolean;
  gt: (a: number, b: number) => boolean;
  gte: (a: number, b: number) => boolean;
  lt: (a: number, b: number) => boolean;
  lte: (a: number, b: number) => boolean;
  and: (...conditions: boolean[]) => boolean;
  or: (...conditions: boolean[]) => boolean;
  not: (condition: boolean) => boolean;
}

export type TemplateFunction = (
  literals: TemplateStringsArray, 
  ...substitutions: any[]
) => string;

// Error types
export interface TermStyleError extends Error {
  code: string;
  input?: any;
}

// Plugin types
export interface Plugin {
  name: string;
  version: string;
  install(api: TermStyleAPI): void | Promise<void>;
  uninstall?(): void | Promise<void>;
}

export interface TermStyleAPI {
  addStyle(name: string, codes: string[]): void;
  addEffect(name: string, effect: EffectFunction): void;
  addHelper(name: string, helper: HelperFunction): void;
  getTheme(): Theme;
  setTheme(theme: Theme): void;
}

export type EffectFunction = (text: string, options?: any) => string;
export type HelperFunction = (...args: any[]) => any;

// Re-export utility type for strict null checks
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;