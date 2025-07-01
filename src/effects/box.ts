import { Style } from '../styles/style';
import { stripAnsi } from '../core/ansi';

export type BoxStyle = 'single' | 'double' | 'round' | 'bold' | 'ascii';

export interface BoxOptions {
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  borderStyle?: BoxStyle;
  borderColor?: string | [number, number, number];
  backgroundColor?: string | [number, number, number];
  align?: 'left' | 'center' | 'right';
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  width?: number;
  wrap?: boolean;
}

const boxStyles = {
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│'
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║'
  },
  round: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│'
  },
  bold: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃'
  },
  ascii: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|'
  }
} as const;

function getPadding(padding: BoxOptions['padding']): { top: number; right: number; bottom: number; left: number } {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return {
    top: padding?.top ?? 0,
    right: padding?.right ?? 0,
    bottom: padding?.bottom ?? 0,
    left: padding?.left ?? 0
  };
}

function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  const words = text.split(' ');
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (stripAnsi(testLine).length <= width) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

function alignText(text: string, width: number, align: 'left' | 'center' | 'right'): string {
  const textLength = stripAnsi(text).length;
  const totalPadding = width - textLength;
  
  if (totalPadding <= 0) return text;
  
  switch (align) {
    case 'center': {
      const leftPad = Math.floor(totalPadding / 2);
      const rightPad = totalPadding - leftPad;
      return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
    }
    case 'right': {
      return ' '.repeat(totalPadding) + text;
    }
    default:
      return text + ' '.repeat(totalPadding);
  }
}

export function box(content: string, options: BoxOptions = {}): string {
  const {
    padding = 0,
    margin = 0,
    borderStyle = 'single',
    borderColor,
    backgroundColor,
    align = 'left',
    title,
    titleAlignment = 'center',
    width,
    wrap = true
  } = options;

  const style = boxStyles[borderStyle];
  const pad = getPadding(padding);
  const mar = getPadding(margin);
  
  let lines = content.split('\n');
  
  if (width && wrap) {
    lines = lines.flatMap(line => wrapText(line, width - pad.left - pad.right - 2));
  }
  
  const maxLineLength = Math.max(
    ...lines.map(line => stripAnsi(line).length),
    0
  );
  
  // Calculate minimum width needed for the title (including spacing)
  let titleWidth = 0;
  if (title) {
    const titleLen = stripAnsi(title).length;
    if (titleLen > maxLineLength) {
      // When title is longer than content, ensure at least 3 chars padding on each side
      titleWidth = titleLen + 8; // 8 for "─── title ───"
    } else {
      titleWidth = titleLen + 4; // 4 for "─ title ─"
    }
  }
  
  // Content width should accommodate both content and title
  const minContentWidth = Math.max(maxLineLength + pad.left + pad.right, titleWidth);
  
  const contentWidth = width ? Math.max(width - 2, titleWidth) : minContentWidth;
  
  const paddedLines = lines.map(line => {
    const aligned = alignText(line, contentWidth - pad.left - pad.right, align);
    return ' '.repeat(pad.left) + aligned + ' '.repeat(pad.right);
  });
  
  for (let i = 0; i < pad.top; i++) {
    paddedLines.unshift(' '.repeat(contentWidth));
  }
  
  for (let i = 0; i < pad.bottom; i++) {
    paddedLines.push(' '.repeat(contentWidth));
  }
  
  let borderStyle_ = new Style();
  if (borderColor) {
    borderStyle_ = typeof borderColor === 'string' 
      ? borderStyle_.color(borderColor)
      : borderStyle_.color(borderColor);
  }
  
  let topBorder = style.topLeft + style.horizontal.repeat(contentWidth) + style.topRight;
  
  if (title) {
    const titleLength = stripAnsi(title).length;
    const availableSpace = contentWidth - titleLength - 2; // -2 for the spaces around title
    
    let leftPadding: string, rightPadding: string;
    
    switch (titleAlignment) {
      case 'center': {
        const leftSpaces = Math.ceil(availableSpace / 2);
        const rightSpaces = availableSpace - leftSpaces;
        leftPadding = style.horizontal.repeat(leftSpaces) + ' ';
        rightPadding = ' ' + style.horizontal.repeat(rightSpaces);
        break;
      }
      case 'left': {
        leftPadding = ' ';
        rightPadding = ' ' + style.horizontal.repeat(availableSpace);
        break;
      }
      case 'right': {
        leftPadding = style.horizontal.repeat(availableSpace) + ' ';
        rightPadding = ' ';
        break;
      }
      default: {
        const defaultLeftSpaces = Math.floor(availableSpace / 2);
        const defaultRightSpaces = availableSpace - defaultLeftSpaces;
        leftPadding = style.horizontal.repeat(defaultLeftSpaces) + ' ';
        rightPadding = ' ' + style.horizontal.repeat(defaultRightSpaces);
      }
    }
    
    topBorder = style.topLeft + leftPadding + title + rightPadding + style.topRight;
  }
  
  const bottomBorder = style.bottomLeft + style.horizontal.repeat(contentWidth) + style.bottomRight;
  
  const boxLines: string[] = [];
  
  boxLines.push(borderStyle_.apply(topBorder));
  
  paddedLines.forEach(line => {
    let fullLine = borderStyle_.apply(style.vertical) + line + borderStyle_.apply(style.vertical);
    
    if (backgroundColor) {
      const bgStyle = typeof backgroundColor === 'string'
        ? new Style().bgColor(backgroundColor)
        : new Style().bgColor(backgroundColor);
      fullLine = bgStyle.apply(fullLine);
    }
    
    boxLines.push(fullLine);
  });
  
  boxLines.push(borderStyle_.apply(bottomBorder));
  
  if (mar.top > 0) {
    for (let i = 0; i < mar.top; i++) {
      boxLines.unshift('');
    }
  }
  
  if (mar.bottom > 0) {
    for (let i = 0; i < mar.bottom; i++) {
      boxLines.push('');
    }
  }
  
  return boxLines.map(line => {
    if (mar.left > 0 && line !== '') {
      return ' '.repeat(mar.left) + line;
    }
    return line;
  }).join('\n');
}

// Add create alias for backward compatibility
export const create = box;

// Export default for CommonJS compatibility
export default Object.assign(box, {
  box,
  create
});