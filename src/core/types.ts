/**
 * Strict type definitions for TermStyle
 * Eliminates 'any' types and provides comprehensive type coverage
 */

import { RGBTuple, HSLColor, ColorInput } from './interfaces';

/**
 * Formatter proxy with strict typing
 */
export interface FormatterProxy {
  (text: string): string;
  [key: string]: FormatterProxy | ((text: string) => string);
}

/**
 * Animation types and options
 */
export type AnimationType = 'blink' | 'pulse' | 'slide' | 'typewriter' | 'fade';

export interface AnimationOptions {
  duration?: number;
  interval?: number;
  iterations?: number;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/**
 * Progress bar types and options
 */
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
  barColor?: ColorInput;
  completeColor?: ColorInput;
  showETA?: boolean;
  showPercentage?: boolean;
  showElapsed?: boolean;
}

export interface MultiProgressOptions {
  total?: number;
  width?: number;
  complete?: string;
  incomplete?: string;
  stream?: NodeJS.WriteStream;
  concurrent?: boolean;
  clearOnComplete?: boolean;
}

/**
 * Box drawing types and options
 */
export type BoxStyle = 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle';

export interface BoxOptions {
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  borderStyle?: BoxStyle;
  borderColor?: ColorInput;
  backgroundColor?: ColorInput;
  textAlign?: 'left' | 'center' | 'right';
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
  float?: 'left' | 'right' | 'center';
  dimBorder?: boolean;
}

/**
 * Spinner types and options
 */
export type SpinnerName = 
  | 'dots' | 'dots2' | 'dots3' | 'line' | 'line2' | 'pipe' | 'star' | 'toggle'
  | 'box' | 'circle' | 'arrow' | 'bounce' | 'bar' | 'earth' | 'moon' | 'clock'
  | 'balloon' | 'noise' | 'boxBounce' | 'triangle' | 'binary' | 'runner'
  | 'pong' | 'shark' | 'dqpb' | 'weather' | 'christmas';

export interface SpinnerOptions {
  spinner?: SpinnerName | string;
  color?: ColorInput;
  interval?: number;
  stream?: NodeJS.WriteStream;
  hideCursor?: boolean;
  prefixText?: string;
  suffixText?: string;
}

/**
 * Gradient types and options
 */
export interface GradientOptions {
  interpolation?: 'linear' | 'bezier' | 'cosine';
  hsvSpin?: 'short' | 'long';
  steps?: number;
  angle?: number;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/**
 * Template types and options
 */
export interface TemplateOptions {
  escapeHtml?: boolean;
  allowUnsafe?: boolean;
  maxDepth?: number;
  customTags?: Record<string, (content: string, attributes?: Record<string, string>) => string>;
}

export type TemplateFunction = (strings: TemplateStringsArray, ...values: any[]) => string;

export interface TemplateHelpers {
  escape: (text: string) => string;
  unescape: (text: string) => string;
  strip: (text: string) => string;
  length: (text: string) => number;
  slice: (text: string, start: number, end?: number) => string;
  pad: (text: string, length: number, char?: string) => string;
  padStart: (text: string, length: number, char?: string) => string;
  padEnd: (text: string, length: number, char?: string) => string;
  repeat: (text: string, count: number) => string;
  truncate: (text: string, length: number, ellipsis?: string) => string;
  wrap: (text: string, width: number, indent?: string) => string;
  center: (text: string, width: number, char?: string) => string;
  justify: (text: string, width: number) => string;
}

/**
 * Theme types and options
 */
export interface ThemeColors {
  primary: ColorInput;
  secondary: ColorInput;
  success: ColorInput;
  warning: ColorInput;
  error: ColorInput;
  info: ColorInput;
  muted: ColorInput;
  background: ColorInput;
  foreground: ColorInput;
  border: ColorInput;
  accent: ColorInput;
  highlight: ColorInput;
}

export interface ThemeStyles {
  heading: string;
  subheading: string;
  body: string;
  code: string;
  quote: string;
  link: string;
  emphasis: string;
  strong: string;
  italic: string;
  underline: string;
  strikethrough: string;
  subscript: string;
  superscript: string;
}

export interface Theme {
  name: string;
  description?: string;
  colors: ThemeColors;
  styles: ThemeStyles;
  metadata?: {
    author?: string;
    version?: string;
    created?: Date;
    modified?: Date;
    tags?: string[];
  };
}

/**
 * Terminal capability types
 */
export interface TerminalInfo {
  supportsColor: boolean;
  colorLevel: 0 | 1 | 2 | 3;
  isTTY: boolean;
  isCI: boolean;
  width: number;
  height: number;
  columns: number;
  rows: number;
  supportsUnicode?: boolean;
  supportsEmoji?: boolean;
  terminalApp?: string;
  platform?: NodeJS.Platform;
}

/**
 * Style configuration types
 */
export interface StyleOptions {
  force?: boolean;
  level?: 0 | 1 | 2 | 3;
  enabled?: boolean;
  supportsColor?: boolean;
  stream?: NodeJS.WriteStream;
}

/**
 * Logging types
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogOptions {
  level?: LogLevel;
  timestamp?: boolean;
  colorize?: boolean;
  prefix?: string | boolean;
  stream?: NodeJS.WriteStream;
  format?: string;
  metadata?: boolean;
}

/**
 * Conditional formatting types
 */
export type Condition = boolean | (() => boolean) | (() => Promise<boolean>);
export type ConditionalStyle = [Condition, any]; // Style or string

export interface ConditionalOptions {
  defaultStyle?: any; // Style instance
  fallback?: string;
  async?: boolean;
  timeout?: number;
}

/**
 * Memory management types
 */
export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

export interface ResourceStats {
  animations: number;
  progressBars: number;
  spinners: number;
  themes: number;
  cacheSize: number;
  poolSize: number;
}

/**
 * Performance monitoring types
 */
export interface PerformanceTimer {
  start(): void;
  stop(): number;
  reset(): void;
  elapsed(): number;
  mark(name: string): void;
  measure(name: string, startMark?: string, endMark?: string): number;
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
  memoryUsage: MemoryStats;
}

/**
 * Validation types
 */
export interface ValidationRule<T = any> {
  name: string;
  validate: (value: T) => boolean | string;
  message?: string;
  optional?: boolean;
}

export interface ValidationSchema<T = any> {
  [key: string]: ValidationRule<T> | ValidationRule<T>[];
}

/**
 * Plugin system types
 */
export interface PluginConfig {
  enabled?: boolean;
  options?: Record<string, any>;
  dependencies?: string[];
  priority?: number;
}

export interface PluginManager {
  register(plugin: any): void;
  unregister(name: string): void;
  get(name: string): any | undefined;
  list(): string[];
  enable(name: string): void;
  disable(name: string): void;
  configure(name: string, options: Record<string, any>): void;
}

/**
 * Utility types for better type inference
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

/**
 * Function overload types for better API design
 */
export interface Overloaded {
  (text: string): string;
  (text: string, options: any): string;
  (options: any): (text: string) => string;
}

/**
 * Branded types for better type safety
 */
export type Brand<T, B> = T & { __brand: B };

export type SafeString = Brand<string, 'SafeString'>;
export type ColorString = Brand<string, 'ColorString'>;
export type AnsiString = Brand<string, 'AnsiString'>;
export type TemplateString = Brand<string, 'TemplateString'>;

/**
 * Runtime type guards
 */
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number' && isFinite(value);
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isFunction = (value: unknown): value is ((...args: any[]) => any) => typeof value === 'function';
export const isObject = (value: unknown): value is object => value !== null && typeof value === 'object';
export const isArray = (value: unknown): value is any[] => Array.isArray(value);

export const isRGBTuple = (value: unknown): value is RGBTuple => 
  isArray(value) && value.length === 3 && value.every(isNumber);

export const isHSLColor = (value: unknown): value is HSLColor =>
  isObject(value) && 
  'h' in (value as any) && 's' in (value as any) && 'l' in (value as any) &&
  isNumber((value as any).h) && isNumber((value as any).s) && isNumber((value as any).l);

export const isColorInput = (value: unknown): value is ColorInput =>
  isString(value) || isNumber(value) || isRGBTuple(value);