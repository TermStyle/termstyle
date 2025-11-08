import { Style } from './styles/style';
import { Formatter, FormatterProxy } from './formatter';

export type TemplateFunction = (strings: TemplateStringsArray, ...values: any[]) => string;

export interface TemplateHelpers {
  [key: string]: Style | TemplateFunction;
}

function parseStyleTags(text: string, helpers: TemplateHelpers): string {
  // Parse from inside out to handle nesting
  let result = text;
  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 100; // Prevent infinite loops from malicious input

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;
    const tagRegex = /\{([^}]+)\}([^{]*?)\{\/\1\}/g;

    result = result.replace(tagRegex, (fullMatch, tagName, content) => {
      const helper = helpers[tagName];

      if (helper instanceof Style) {
        changed = true;
        return helper.apply(content);
      } else if (typeof helper === 'function') {
        changed = true;
        return helper([content] as any);
      }

      return fullMatch;
    });
  }

  return result;
}

function parseInlineStyles(text: string, formatter: FormatterProxy): string {
  // Match patterns like ${red`text`} or ${red.bold`text`}
  const inlineRegex = /\$\{([^}]+)`([^`]*)`\}/g;
  
  return text.replace(inlineRegex, (fullMatch, stylePath, content) => {
    try {
      const styles = stylePath.split('.');
      
      let currentStyle: any = formatter;
      for (const style of styles) {
        if (currentStyle && typeof currentStyle === 'object' && style in currentStyle) {
          currentStyle = currentStyle[style];
        } else if (currentStyle && typeof currentStyle === 'function') {
          // Try to access property via proxy getter
          currentStyle = currentStyle[style];
        } else {
          return fullMatch; // Return unchanged if style not found
        }
      }
      
      // If we have a valid style function, apply it
      if (typeof currentStyle === 'function') {
        return currentStyle(content);
      }
      
      // If it's a Style object with apply method, use that
      if (currentStyle && typeof currentStyle === 'object' && 'apply' in currentStyle && typeof currentStyle.apply === 'function') {
        return currentStyle.apply(content);
      }
      
      return fullMatch;
    } catch (error) {
      // Fix: Add debug logging for swallowed errors
      if (typeof process !== 'undefined' && process.env && process.env.DEBUG) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('Style parsing error:', error);
        }
      }
      return fullMatch; // Return unchanged on error
    }
  });
}

export function createTemplate(formatter: FormatterProxy, helpers: TemplateHelpers = {}): TemplateFunction {
  // Always include default helpers, but allow overrides
  const allHelpers = {
    ...createDefaultHelpers(),
    ...helpers
  };
  return (strings: TemplateStringsArray, ...values: any[]): string => {
    let result = '';
    const mutableStrings = [...strings]; // Create mutable copy
    
    // First, combine template strings and values
    mutableStrings.forEach((str, i) => {
      result += str;
      if (i < values.length) {
        const value = values[i];
        
        // Handle Style objects with apply method differently
        if (value && typeof value === 'object' && 'apply' in value && typeof value.apply === 'function') {
          // Fix: Check bounds before accessing array element
          if (i + 1 < mutableStrings.length) {
            // Check if the next string starts with a backtick (template literal)
            const nextStr = mutableStrings[i + 1];
            const backtickMatch = nextStr.match(/^`([^`]*)`(.*)/);
            if (backtickMatch) {
              // Apply the style to the content and update the next string
              result += value.apply(backtickMatch[1]);
              mutableStrings[i + 1] = backtickMatch[2];
              return;
            }
          }
        }
        
        result += String(value);
      }
    });
    
    // Then parse inline styles and tags
    result = parseInlineStyles(result, formatter);
    result = parseStyleTags(result, allHelpers);
    
    return result;
  };
}

export function createTemplateTag(options: { formatter?: FormatterProxy; helpers?: TemplateHelpers } = {}): TemplateFunction {
  const formatter = options.formatter || Formatter.create({ force: true }); // Force colors for template tags
  const helpers = {
    ...createDefaultHelpers(),
    ...options.helpers
  };
  
  return createTemplate(formatter, helpers);
}

// Add parse function for backward compatibility
export function parse(template: string, variables: Record<string, any> = {}): string {
  const helpers = createDefaultHelpers();

  // Replace variables first
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    // Escape special regex characters in key to prevent ReDoS attacks
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`{{${escapedKey}}}`, 'g');
    result = result.replace(regex, String(value));
  });

  // Then parse style tags
  return parseStyleTags(result, helpers);
}

function createDefaultHelpers(): TemplateHelpers {
  const style = new Style([], [], { force: true });
  
  return {
    bold: style.bold,
    dim: style.dim,
    italic: style.italic,
    underline: style.underline,
    inverse: style.inverse,
    hidden: style.hidden,
    strikethrough: style.strikethrough,
    
    black: style.black,
    red: style.red,
    green: style.green,
    yellow: style.yellow,
    blue: style.blue,
    magenta: style.magenta,
    cyan: style.cyan,
    white: style.white,
    gray: style.gray,
    
    bgBlack: style.bgBlack,
    bgRed: style.bgRed,
    bgGreen: style.bgGreen,
    bgYellow: style.bgYellow,
    bgBlue: style.bgBlue,
    bgMagenta: style.bgMagenta,
    bgCyan: style.bgCyan,
    bgWhite: style.bgWhite,
    bgGray: style.bgGray,
    
    success: style.green.bold,
    error: style.red.bold,
    warning: style.yellow.bold,
    info: style.blue.bold,
    debug: style.gray.dim
  };
}

// Export default for CommonJS compatibility
export default {
  parse,
  createTemplate,
  createTemplateTag,
  createDefaultHelpers
};