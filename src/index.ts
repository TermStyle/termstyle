import { Formatter, FormatterAPI } from './formatter';
import { Style, StyleOptions } from './styles/style';
import { terminal, getTerminalInfo, TerminalInfo } from './utils/terminal';
import { gradientEnhanced as gradient, rainbow, GradientOptions } from './effects/gradient';
import { 
  animate, 
  Animation, 
  AnimationType, 
  AnimationOptions,
  spinner,
  Spinner,
  SpinnerName,
  spinners
} from './effects/animation';
import { box, BoxOptions, BoxStyle } from './effects/box';
import { 
  progressBar, 
  ProgressBar, 
  ProgressBarOptions,
  multiProgress,
  MultiProgress,
  MultiProgressOptions,
  bar
} from './effects/progress';
import { createTemplateTag, TemplateFunction, TemplateHelpers, parse as templateParse } from './template';
import { 
  Theme, 
  ThemeManager, 
  themes, 
  defaultTheme,
  ThemeColors,
  ThemeStyles,
  create as themeCreate
} from './themes/theme';
import {
  conditional,
  ConditionalFormatter,
  ConditionalOptions,
  createLogFormatter,
  LogFormatter,
  createStatusFormatter,
  StatusFormatter,
  logLevels,
  color as conditionalColor
} from './conditional';
import { stripAnsi } from './core/ansi';
import { cacheManager } from './core/cache-manager';

const formatter = Formatter.create() as FormatterAPI;

const termstyle: FormatterAPI & {
  Style: typeof Style;
  Formatter: typeof Formatter;
  
  gradient: typeof gradient;
  rainbow: typeof rainbow;
  
  animate: typeof animate;
  Animation: typeof Animation;
  spinner: typeof spinner;
  Spinner: typeof Spinner;
  spinners: typeof spinners;
  
  box: typeof box;
  
  progressBar: typeof progressBar;
  ProgressBar: typeof ProgressBar;
  multiProgress: typeof multiProgress;
  MultiProgress: typeof MultiProgress;
  
  template: TemplateFunction;
  createTemplate: typeof createTemplateTag;
  templateParse: typeof templateParse;
  
  ThemeManager: typeof ThemeManager;
  themes: typeof themes;
  
  conditional: typeof conditional;
  ConditionalFormatter: typeof ConditionalFormatter;
  createLogFormatter: typeof createLogFormatter;
  LogFormatter: typeof LogFormatter;
  createStatusFormatter: typeof createStatusFormatter;
  logLevels: typeof logLevels;
  conditionalColor: typeof conditionalColor;
  
  terminal: typeof terminal;
  getTerminalInfo: typeof getTerminalInfo;
  
  strip: typeof stripAnsi;
  stripAnsi: typeof stripAnsi;
  
  create: typeof Formatter.create;
  
  supportsColor: boolean;
  level: 0 | 1 | 2 | 3;
} = Object.assign(formatter, {
  Style,
  Formatter,
  
  gradient,
  rainbow,
  
  animate,
  Animation,
  spinner,
  Spinner,
  spinners,
  
  box,
  
  progressBar,
  ProgressBar,
  multiProgress,
  MultiProgress,
  bar,
  
  template: createTemplateTag(),
  createTemplate: createTemplateTag,
  templateParse,
  
  ThemeManager,
  themes,
  
  conditional,
  ConditionalFormatter,
  createLogFormatter,
  LogFormatter,
  createStatusFormatter,
  logLevels,
  conditionalColor,
  
  terminal,
  getTerminalInfo,
  
  strip: stripAnsi,
  stripAnsi,
  
  create: Formatter.create,
  
  get supportsColor() {
    return terminal().supportsColor;
  },
  
  get level() {
    return terminal().colorLevel;
  }
});

// Create a style instance for easy access
const style = new Style();

export default termstyle;

// Export classes and functions
export {
  Style,
  Formatter,
  style,
  gradient,
  rainbow,
  bar,
  themeCreate,
  animate,
  Animation,
  spinner,
  Spinner,
  spinners,
  box,
  progressBar,
  ProgressBar,
  multiProgress,
  MultiProgress,
  createTemplateTag,
  templateParse,
  ThemeManager,
  themes,
  defaultTheme,
  conditional,
  ConditionalFormatter,
  createLogFormatter,
  LogFormatter,
  createStatusFormatter,
  logLevels,
  conditionalColor,
  terminal,
  getTerminalInfo,
  stripAnsi,
  cacheManager
};

// Export types separately
export type {
  StyleOptions,
  FormatterAPI,
  GradientOptions,
  AnimationType,
  AnimationOptions,
  SpinnerName,
  BoxOptions,
  BoxStyle,
  ProgressBarOptions,
  MultiProgressOptions,
  TemplateFunction,
  TemplateHelpers,
  Theme,
  ThemeColors,
  ThemeStyles,
  ConditionalOptions,
  StatusFormatter,
  TerminalInfo
};