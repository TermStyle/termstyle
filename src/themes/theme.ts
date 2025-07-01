import { Style } from '../styles/style';

export interface ThemeColors {
  primary?: string | [number, number, number];
  secondary?: string | [number, number, number];
  success?: string | [number, number, number];
  error?: string | [number, number, number];
  warning?: string | [number, number, number];
  info?: string | [number, number, number];
  debug?: string | [number, number, number];
  muted?: string | [number, number, number];
  accent?: string | [number, number, number];
  highlight?: string | [number, number, number];
  [key: string]: string | [number, number, number] | undefined;
}

export interface ThemeStyles {
  heading1?: Style;
  heading2?: Style;
  heading3?: Style;
  text?: Style;
  bold?: Style;
  italic?: Style;
  underline?: Style;
  code?: Style;
  link?: Style;
  quote?: Style;
  list?: Style;
  [key: string]: Style | undefined;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  styles: ThemeStyles;
}

export const defaultTheme: Theme = {
  name: 'default',
  colors: {
    primary: '#0066cc',
    secondary: '#6c757d',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    debug: '#6c757d',
    muted: '#999999',
    accent: '#e91e63',
    highlight: '#ffeb3b'
  },
  styles: {
    heading1: new Style([], [], { force: true }).bold.underline,
    heading2: new Style([], [], { force: true }).bold,
    heading3: new Style([], [], { force: true }).underline,
    text: new Style([], [], { force: true }),
    bold: new Style([], [], { force: true }).bold,
    italic: new Style([], [], { force: true }).italic,
    underline: new Style([], [], { force: true }).underline,
    code: new Style([], [], { force: true }).bgColor('#2d2d2d').color('#f8f8f2'),
    link: new Style([], [], { force: true }).underline.color('#0066cc'),
    quote: new Style([], [], { force: true }).italic.color('#6c757d'),
    list: new Style([], [], { force: true }).color('#333333')
  }
};

export const themes: Record<string, Theme> = {
  default: defaultTheme,
  
  dark: {
    name: 'dark',
    colors: {
      primary: '#61afef',
      secondary: '#abb2bf',
      success: '#98c379',
      error: '#e06c75',
      warning: '#e5c07b',
      info: '#56b6c2',
      debug: '#5c6370',
      muted: '#5c6370',
      accent: '#c678dd',
      highlight: '#d19a66'
    },
    styles: {
      heading1: new Style([], [], { force: true }).bold.color('#61afef'),
      heading2: new Style([], [], { force: true }).bold.color('#98c379'),
      heading3: new Style([], [], { force: true }).color('#e5c07b'),
      text: new Style([], [], { force: true }).color('#abb2bf'),
      bold: new Style([], [], { force: true }).bold,
      italic: new Style([], [], { force: true }).italic,
      underline: new Style([], [], { force: true }).underline,
      code: new Style([], [], { force: true }).bgColor('#282c34').color('#abb2bf'),
      link: new Style([], [], { force: true }).underline.color('#61afef'),
      quote: new Style([], [], { force: true }).italic.color('#5c6370'),
      list: new Style([], [], { force: true }).color('#abb2bf')
    }
  },
  
  ocean: {
    name: 'ocean',
    colors: {
      primary: '#0074d9',
      secondary: '#39cccc',
      success: '#2ecc40',
      error: '#ff4136',
      warning: '#ff851b',
      info: '#7fdbff',
      debug: '#b10dc9',
      muted: '#aaaaaa',
      accent: '#f012be',
      highlight: '#ffdc00'
    },
    styles: {
      heading1: new Style([], [], { force: true }).bold.color('#0074d9'),
      heading2: new Style([], [], { force: true }).bold.color('#39cccc'),
      heading3: new Style([], [], { force: true }).color('#7fdbff'),
      text: new Style([], [], { force: true }),
      bold: new Style([], [], { force: true }).bold,
      italic: new Style([], [], { force: true }).italic,
      underline: new Style([], [], { force: true }).underline,
      code: new Style([], [], { force: true }).bgColor('#001f3f').color('#7fdbff'),
      link: new Style([], [], { force: true }).underline.color('#0074d9'),
      quote: new Style([], [], { force: true }).italic.color('#39cccc'),
      list: new Style([], [], { force: true }).color('#0074d9')
    }
  },
  
  forest: {
    name: 'forest',
    colors: {
      primary: '#228b22',
      secondary: '#8b4513',
      success: '#32cd32',
      error: '#dc143c',
      warning: '#ffa500',
      info: '#4682b4',
      debug: '#696969',
      muted: '#808080',
      accent: '#ff1493',
      highlight: '#ffd700'
    },
    styles: {
      heading1: new Style([], [], { force: true }).bold.color('#228b22'),
      heading2: new Style([], [], { force: true }).bold.color('#32cd32'),
      heading3: new Style([], [], { force: true }).color('#8b4513'),
      text: new Style([], [], { force: true }),
      bold: new Style([], [], { force: true }).bold,
      italic: new Style([], [], { force: true }).italic,
      underline: new Style([], [], { force: true }).underline,
      code: new Style([], [], { force: true }).bgColor('#013220').color('#90ee90'),
      link: new Style([], [], { force: true }).underline.color('#228b22'),
      quote: new Style([], [], { force: true }).italic.color('#8b4513'),
      list: new Style([], [], { force: true }).color('#228b22')
    }
  }
};

// Helper function to create theme proxy objects
export function create(colors: ThemeColors): any {
  const style = new Style([], [], { force: true });
  const proxy: any = {};
  
  // Add color methods
  Object.entries(colors).forEach(([name, color]) => {
    if (color) {
      proxy[name] = (text: string) => style.color(color).apply(text);
    }
  });
  
  return proxy;
}

export class ThemeManager {
  private currentTheme: Theme;
  private customThemes: Record<string, Theme> = {};

  constructor(themeName: string = 'default') {
    this.currentTheme = themes[themeName] || defaultTheme;
  }

  setTheme(themeName: string): void {
    const theme = themes[themeName] || this.customThemes[themeName];
    if (theme) {
      this.currentTheme = theme;
    } else {
      throw new Error(`Theme '${themeName}' not found`);
    }
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  registerTheme(theme: Theme): void;
  registerTheme(name: string, theme: Omit<Theme, 'name'>): void;
  registerTheme(nameOrTheme: string | Theme, theme?: Omit<Theme, 'name'>): void {
    if (typeof nameOrTheme === 'string' && theme) {
      this.customThemes[nameOrTheme] = { name: nameOrTheme, ...theme };
    } else if (typeof nameOrTheme === 'object' && 'name' in nameOrTheme) {
      this.customThemes[nameOrTheme.name] = nameOrTheme;
    } else {
      throw new Error('Invalid arguments to registerTheme');
    }
  }

  getColor(colorName: string): string | [number, number, number] | undefined {
    return this.currentTheme.colors[colorName];
  }

  getStyle(styleName: string): Style | undefined {
    return this.currentTheme.styles[styleName];
  }

  applyTheme(): Record<string, (...args: any[]) => any> {
    const themedFormatters: Record<string, (...args: any[]) => any> = {};
    
    // Create themed color functions
    Object.entries(this.currentTheme.colors).forEach(([name, color]) => {
      if (color) {
        themedFormatters[name] = (text: string) => {
          const style = new Style([], [], { force: true });
          return style.color(color).apply(text);
        };
      }
    });
    
    // Create themed style functions
    Object.entries(this.currentTheme.styles).forEach(([name, style]) => {
      if (style) {
        themedFormatters[name] = (text: string) => style.apply(text);
      }
    });
    
    return themedFormatters;
  }

  getCurrentTheme(): string {
    return this.currentTheme.name;
  }
}

// Export default for CommonJS compatibility
export default Object.assign(create, {
  create,
  ThemeManager,
  themes,
  defaultTheme
});