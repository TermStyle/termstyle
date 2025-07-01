# @oxog/termstyle

<div align="center">
  <h1>TermStyle</h1>
  <p>🎨 A powerful, feature-rich CLI text formatting library with zero dependencies</p>
  
  [![npm version](https://img.shields.io/npm/v/@oxog/termstyle.svg)](https://www.npmjs.com/package/@oxog/termstyle)
  [![npm downloads](https://img.shields.io/npm/dm/@oxog/termstyle.svg)](https://www.npmjs.com/package/@oxog/termstyle)
  [![bundle size](https://img.shields.io/bundlephobia/minzip/@oxog/termstyle)](https://bundlephobia.com/package/@oxog/termstyle)
  [![license](https://img.shields.io/npm/l/@oxog/termstyle.svg)](https://github.com/termstyle/termstyle/blob/main/LICENSE)
</div>

## ✨ Features

- 🎨 **Full Color Support** - 16, 256, and true color (16.7m colors)
- 🔗 **Chainable API** - Intuitive and fluent interface
- 🌈 **Gradient Effects** - Beautiful color transitions
- 📦 **Zero Dependencies** - Lightweight and fast
- 🚀 **High Performance** - Optimized with caching
- 📊 **Progress Bars** - Customizable progress indicators
- 🎭 **Animations** - Built-in spinner and animation effects
- 🎯 **TypeScript** - Full type definitions included
- 🖼️ **Box Drawing** - Create boxes around content
- 🎨 **Themes** - Predefined and custom theme support

## 📦 Installation

```bash
npm install @oxog/termstyle
```

## 🚀 Quick Start

```javascript
const termstyle = require('@oxog/termstyle').default;
// or with ES modules
import termstyle from '@oxog/termstyle';

// Basic colors
console.log(termstyle.red('Error message'));
console.log(termstyle.green('Success message'));
console.log(termstyle.blue('Info message'));

// Styles
console.log(termstyle.bold('Bold text'));
console.log(termstyle.italic('Italic text'));
console.log(termstyle.underline('Underlined text'));

// Chaining
console.log(termstyle.red.bold('Bold red text'));
console.log(termstyle.blue.underline.italic('Blue underlined italic'));

// Background colors
console.log(termstyle.bgRed.white('White text on red background'));
console.log(termstyle.bgGreen.black('Black text on green background'));
```

## 🎨 Colors

### Basic Colors

```javascript
// Foreground colors
termstyle.black('Black text')
termstyle.red('Red text')
termstyle.green('Green text')
termstyle.yellow('Yellow text')
termstyle.blue('Blue text')
termstyle.magenta('Magenta text')
termstyle.cyan('Cyan text')
termstyle.white('White text')
termstyle.gray('Gray text')

// Background colors
termstyle.bgBlack('Text on black background')
termstyle.bgRed('Text on red background')
termstyle.bgGreen('Text on green background')
termstyle.bgYellow('Text on yellow background')
termstyle.bgBlue('Text on blue background')
termstyle.bgMagenta('Text on magenta background')
termstyle.bgCyan('Text on cyan background')
termstyle.bgWhite('Text on white background')
termstyle.bgGray('Text on gray background')
```

### Advanced Colors

```javascript
// Hex colors
termstyle.hex('#ff6b35')('Orange text')
termstyle.bgHex('#4ecdc4')('Text on teal background')

// RGB colors
termstyle.rgb(255, 107, 53)('RGB orange text')
termstyle.bgRgb(78, 205, 196)('Text on RGB teal background')

// ANSI 256 colors (0-255)
termstyle.color(196)('ANSI 256 red')
termstyle.bgColor(46)('Text on ANSI 256 green background')
```

## ✨ Text Styles

```javascript
termstyle.bold('Bold text')
termstyle.dim('Dim text')
termstyle.italic('Italic text')
termstyle.underline('Underlined text')
termstyle.inverse('Inverse text')
termstyle.hidden('Hidden text')
termstyle.strikethrough('Strikethrough text')

// Combine multiple styles
termstyle.bold.italic.underline('Bold, italic, and underlined')
termstyle.red.bgYellow.bold('Bold red text on yellow background')
```

## 🌈 Special Effects

### Gradient Text

```javascript
// Rainbow gradient
termstyle.rainbow('Rainbow colored text')

// Custom gradient
termstyle.gradient('Gradient text', ['red', 'yellow', 'green'])

// Hex gradient
termstyle.gradient('Smooth gradient', ['#ff0000', '#00ff00', '#0000ff'])
```

### Box Drawing

```javascript
// Simple box
termstyle.box('Hello World')
// ┌───────────┐
// │Hello World│
// └───────────┘

// Customized box
termstyle.box('Important Message', {
  padding: 1,
  margin: 1,
  borderStyle: 'double',
  borderColor: 'blue',
  align: 'center'
})
```

### Progress Bars

```javascript
// Create a progress bar
const progressBar = termstyle.progressBar({
  total: 100,
  width: 40,
  complete: '█',
  incomplete: '░'
});

// Update progress
progressBar.update(25);  // 25%
console.log(progressBar.render());
// ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 25%

// Simple progress bar
console.log(termstyle.bar(50, 100, { width: 20 }));
// ██████████░░░░░░░░░░
```

### Spinners

```javascript
// Create a spinner
const spinner = termstyle.spinner('Loading...');
spinner.start();

// Update text
spinner.text = 'Processing...';

// Stop with success
spinner.succeed('Complete!');

// Different spinner styles
const customSpinner = termstyle.spinner({
  text: 'Loading',
  spinner: 'dots2' // dots, line, circle, etc.
});
```

## 🎯 Conditional Formatting

```javascript
// Conditional styling
const isError = true;
console.log(
  termstyle.conditional(isError).red('Error occurred')
);

// Conditional chains
termstyle.conditional(process.env.DEBUG).gray('Debug info')

// Status formatters
const status = termstyle.createStatusFormatter();
console.log(status.success('Operation completed'));
console.log(status.error('Operation failed'));
console.log(status.warning('Please review'));
console.log(status.info('For your information'));
```

## 📝 Template Literals

```javascript
// Template literal support
const name = 'World';
console.log(termstyle.red`Hello ${name}!`);

// Complex templates
const user = 'John';
const score = 95;
console.log(
  termstyle.template`User ${termstyle.green(user)} achieved ${
    termstyle.yellow.bold(`${score}%`)
  } success rate!`
);
```

## 🎨 Themes

```javascript
// Use built-in themes
const themes = termstyle.themes;
const theme = themes.get('ocean');

// Create custom theme
const customTheme = new termstyle.ThemeManager();
customTheme.create('myTheme', {
  primary: '#007acc',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800'
});

// Apply theme colors
const colors = customTheme.applyTheme();
console.log(colors.primary('Primary text'));
console.log(colors.success('Success message'));
```

## 🛠️ Utilities

```javascript
// Strip ANSI codes
const styled = termstyle.red.bold('Styled text');
const plain = termstyle.strip(styled);
console.log(plain); // 'Styled text'

// Check color support
console.log(termstyle.supportsColor); // true/false
console.log(termstyle.level); // 0, 1, 2, or 3

// Get terminal info
const info = termstyle.getTerminalInfo();
console.log(info);
// {
//   supportsColor: true,
//   colorLevel: 3,
//   columns: 120,
//   rows: 30
// }
```

## 🔧 Advanced Usage

### Create Custom Formatter

```javascript
// Create a custom formatter instance
const myStyle = termstyle.create({ force: true });

// Log formatter
const logger = termstyle.createLogFormatter({
  timestamp: true,
  usePrefix: true
});

console.log(logger.info('Information message'));
console.log(logger.warn('Warning message'));
console.log(logger.error('Error message'));
console.log(logger.debug('Debug message'));
```

### Method Chaining

```javascript
// Complex chaining
termstyle
  .red
  .bgYellow
  .bold
  .underline
  .italic('Complex styled text');

// Conditional chaining
const productionError = termstyle.conditional(isProduction).red('Production error!');
console.log(productionError);
```

## 📊 Performance

TermStyle is optimized for performance:

- Lazy evaluation of styles
- Intelligent caching system
- Minimal overhead
- Zero dependencies

```javascript
// Efficient for loops
const styled = termstyle.red.bold;
for (let i = 0; i < 1000; i++) {
  console.log(styled(`Item ${i}`));
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [TermStyle](https://github.com/termstyle)

---

<div align="center">
  <p>Made with ❤️ by OXOG Team</p>
  <p>
    <a href="https://github.com/termstyle/termstyle">GitHub</a> •
    <a href="https://www.npmjs.com/package/@oxog/termstyle">npm</a> •
    <a href="https://github.com/termstyle/termstyle/issues">Issues</a>
  </p>
</div>