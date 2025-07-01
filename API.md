# API Reference

Complete API documentation for @oxog/termstyle.

## Table of Contents

- [Installation](#installation)
- [Core API](#core-api)
  - [Basic Colors](#basic-colors)
  - [Background Colors](#background-colors)
  - [Text Styles](#text-styles)
  - [Advanced Colors](#advanced-colors)
- [Effects](#effects)
  - [Gradient](#gradient)
  - [Rainbow](#rainbow)
  - [Box](#box)
  - [Progress Bar](#progress-bar)
  - [Spinner](#spinner)
  - [Animation](#animation)
- [Utilities](#utilities)
- [Conditional Formatting](#conditional-formatting)
- [Templates](#templates)
- [Themes](#themes)
- [Method Chaining](#method-chaining)

## Installation

```bash
npm install @oxog/termstyle
```

## Core API

### Import

```javascript
// CommonJS
const termstyle = require('@oxog/termstyle').default;

// ES Modules
import termstyle from '@oxog/termstyle';
```

### Basic Colors

#### `termstyle.red(text)`
Apply red color to text.

```javascript
termstyle.red('Error message')
```

#### `termstyle.green(text)`
Apply green color to text.

```javascript
termstyle.green('Success message')
```

#### `termstyle.blue(text)`
Apply blue color to text.

```javascript
termstyle.blue('Info message')
```

#### `termstyle.yellow(text)`
Apply yellow color to text.

```javascript
termstyle.yellow('Warning message')
```

#### `termstyle.magenta(text)`
Apply magenta color to text.

```javascript
termstyle.magenta('Magenta text')
```

#### `termstyle.cyan(text)`
Apply cyan color to text.

```javascript
termstyle.cyan('Cyan text')
```

#### `termstyle.white(text)`
Apply white color to text.

```javascript
termstyle.white('White text')
```

#### `termstyle.black(text)`
Apply black color to text.

```javascript
termstyle.black('Black text')
```

#### `termstyle.gray(text)` / `termstyle.grey(text)`
Apply gray color to text.

```javascript
termstyle.gray('Gray text')
termstyle.grey('Grey text') // Alias
```

### Background Colors

#### `termstyle.bgRed(text)`
Apply red background color.

```javascript
termstyle.bgRed('Text on red background')
```

#### `termstyle.bgGreen(text)`
Apply green background color.

```javascript
termstyle.bgGreen('Text on green background')
```

#### `termstyle.bgBlue(text)`
Apply blue background color.

```javascript
termstyle.bgBlue('Text on blue background')
```

#### `termstyle.bgYellow(text)`
Apply yellow background color.

```javascript
termstyle.bgYellow('Text on yellow background')
```

#### `termstyle.bgMagenta(text)`
Apply magenta background color.

```javascript
termstyle.bgMagenta('Text on magenta background')
```

#### `termstyle.bgCyan(text)`
Apply cyan background color.

```javascript
termstyle.bgCyan('Text on cyan background')
```

#### `termstyle.bgWhite(text)`
Apply white background color.

```javascript
termstyle.bgWhite('Text on white background')
```

#### `termstyle.bgBlack(text)`
Apply black background color.

```javascript
termstyle.bgBlack('Text on black background')
```

#### `termstyle.bgGray(text)` / `termstyle.bgGrey(text)`
Apply gray background color.

```javascript
termstyle.bgGray('Text on gray background')
termstyle.bgGrey('Text on grey background') // Alias
```

### Text Styles

#### `termstyle.bold(text)`
Apply bold style to text.

```javascript
termstyle.bold('Bold text')
```

#### `termstyle.dim(text)`
Apply dim style to text.

```javascript
termstyle.dim('Dimmed text')
```

#### `termstyle.italic(text)`
Apply italic style to text.

```javascript
termstyle.italic('Italic text')
```

#### `termstyle.underline(text)`
Apply underline style to text.

```javascript
termstyle.underline('Underlined text')
```

#### `termstyle.inverse(text)`
Invert foreground and background colors.

```javascript
termstyle.inverse('Inverted text')
```

#### `termstyle.hidden(text)`
Make text hidden (but still takes up space).

```javascript
termstyle.hidden('Hidden text')
```

#### `termstyle.strikethrough(text)`
Apply strikethrough style to text.

```javascript
termstyle.strikethrough('Strikethrough text')
```

### Advanced Colors

#### `termstyle.hex(hexColor)(text)`
Apply color using hex code.

**Parameters:**
- `hexColor` {string} - Hex color code (e.g., '#ff0000' or 'ff0000')

```javascript
termstyle.hex('#ff6b35')('Orange text')
termstyle.hex('4ecdc4')('Teal text')
```

#### `termstyle.bgHex(hexColor)(text)`
Apply background color using hex code.

**Parameters:**
- `hexColor` {string} - Hex color code

```javascript
termstyle.bgHex('#4ecdc4')('Text on teal background')
```

#### `termstyle.rgb(r, g, b)(text)`
Apply color using RGB values.

**Parameters:**
- `r` {number} - Red value (0-255)
- `g` {number} - Green value (0-255)
- `b` {number} - Blue value (0-255)

```javascript
termstyle.rgb(255, 107, 53)('RGB orange text')
```

#### `termstyle.bgRgb(r, g, b)(text)`
Apply background color using RGB values.

**Parameters:**
- `r` {number} - Red value (0-255)
- `g` {number} - Green value (0-255)
- `b` {number} - Blue value (0-255)

```javascript
termstyle.bgRgb(78, 205, 196)('Text on RGB teal background')
```

#### `termstyle.color(value)(text)`
Apply color using various formats.

**Parameters:**
- `value` {string|number|Array} - Color value
  - String: Color name or hex code
  - Number: ANSI 256 color code (0-255)
  - Array: RGB values [r, g, b]

```javascript
termstyle.color(196)('ANSI 256 red')
termstyle.color([255, 0, 0])('RGB red')
termstyle.color('red')('Named color')
```

#### `termstyle.bgColor(value)(text)`
Apply background color using various formats.

**Parameters:**
- `value` {string|number|Array} - Color value

```javascript
termstyle.bgColor(46)('Text on ANSI 256 green')
termstyle.bgColor([0, 255, 0])('Text on RGB green')
```

## Effects

### Gradient

#### `termstyle.gradient(text, colors, options?)`
Apply gradient effect to text.

**Parameters:**
- `text` {string} - Text to apply gradient to
- `colors` {Array} - Array of color names, hex codes, or RGB arrays
- `options` {Object} - Optional gradient options
  - `interpolation` {string} - 'linear' or 'bezier'
  - `hsvSpin` {string} - 'short' or 'long'

```javascript
// Color names
termstyle.gradient('Gradient text', ['red', 'yellow', 'green'])

// Hex colors
termstyle.gradient('Hex gradient', ['#ff0000', '#00ff00', '#0000ff'])

// RGB arrays
termstyle.gradient('RGB gradient', [[255,0,0], [0,255,0], [0,0,255]])
```

### Rainbow

#### `termstyle.rainbow(text)`
Apply rainbow gradient to text.

**Parameters:**
- `text` {string} - Text to apply rainbow effect to

```javascript
termstyle.rainbow('Rainbow colored text')
```

### Box

#### `termstyle.box(text, options)`
Draw a box around text.

**Parameters:**
- `text` {string} - Text to put in box
- `options` {Object} - Box options
  - `padding` {number|Object} - Padding inside box
  - `margin` {number|Object} - Margin outside box
  - `borderStyle` {string} - Border style: 'single', 'double', 'round', 'bold', 'ascii'
  - `borderColor` {string} - Color of border
  - `backgroundColor` {string} - Background color inside box
  - `align` {string} - Text alignment: 'left', 'center', 'right'
  - `title` {string} - Title for the box
  - `titleAlignment` {string} - Title alignment: 'left', 'center', 'right'
  - `width` {number} - Fixed width for box

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
  align: 'center',
  title: 'Notice'
})
```

### Progress Bar

#### `termstyle.progressBar(options)`
Create a progress bar instance.

**Parameters:**
- `options` {Object} - Progress bar options
  - `total` {number} - Total value for 100% (default: 100)
  - `width` {number} - Width of progress bar (default: 40)
  - `complete` {string} - Character for completed portion (default: '█')
  - `incomplete` {string} - Character for incomplete portion (default: '░')
  - `clear` {boolean} - Clear bar on completion
  - `format` {string} - Format string (default: ':bar :percent :etas')

**Returns:** ProgressBar instance

**Methods:**
- `update(value)` - Update progress to specific value
- `tick(delta)` - Increment progress by delta
- `render()` - Get current bar string
- `complete()` - Mark as complete

```javascript
const progressBar = termstyle.progressBar({
  total: 100,
  width: 40,
  complete: '█',
  incomplete: '░'
});

progressBar.update(50);
console.log(progressBar.render());
// ████████████████████░░░░░░░░░░░░░░░░░░░░ 50%
```

#### `termstyle.bar(current, total, options)`
Create a simple progress bar string.

**Parameters:**
- `current` {number} - Current value
- `total` {number} - Total value
- `options` {Object} - Bar options

```javascript
console.log(termstyle.bar(50, 100, { width: 20 }));
// ██████████░░░░░░░░░░
```

### Spinner

#### `termstyle.spinner(textOrOptions)`
Create a spinner instance.

**Parameters:**
- `textOrOptions` {string|Object} - Spinner text or options
  - `text` {string} - Text to show with spinner
  - `spinner` {string} - Spinner type (default: 'dots')

**Returns:** Spinner instance

**Methods:**
- `start()` - Start the spinner
- `stop(text)` - Stop with optional text
- `succeed(text)` - Stop with success symbol
- `fail(text)` - Stop with failure symbol
- `warn(text)` - Stop with warning symbol
- `info(text)` - Stop with info symbol
- `update(text)` - Update spinner text
- `clear()` - Clear the spinner

**Available Spinners:**
- `dots`, `dots2`, `dots3`, `line`, `line2`, `pipe`, `star`
- `toggle`, `box`, `circle`, `arrow`, `bounce`, `bar`
- `earth`, `moon`, `clock`, `balloon`, `noise`, `boxBounce`
- `triangle`, `binary`, `runner`, `pong`, `shark`, `dqpb`
- `weather`, `christmas`

```javascript
// Simple spinner
const spinner = termstyle.spinner('Loading...');
spinner.start();

setTimeout(() => {
  spinner.succeed('Complete!');
}, 3000);

// Custom spinner
const customSpinner = termstyle.spinner({
  text: 'Processing',
  spinner: 'dots2'
});
```

### Animation

#### `termstyle.animate(text, type, options)`
Create animated text.

**Parameters:**
- `text` {string} - Text to animate
- `type` {string} - Animation type
- `options` {Object} - Animation options
  - `duration` {number} - Animation duration in ms
  - `interval` {number} - Frame interval in ms
  - `iterations` {number} - Number of iterations

**Returns:** Animation instance with methods:
- `start()` - Start animation
- `stop()` - Stop animation
- `pause()` - Pause animation
- `resume()` - Resume animation

```javascript
const anim = termstyle.animate('Hello!', 'pulse', {
  duration: 2000,
  interval: 100
});
anim.start();
```

## Utilities

#### `termstyle.strip(text)` / `termstyle.stripAnsi(text)`
Remove all ANSI escape codes from text.

**Parameters:**
- `text` {string} - Text with ANSI codes

**Returns:** {string} Plain text

```javascript
const styled = termstyle.red.bold('Styled text');
const plain = termstyle.strip(styled);
console.log(plain); // 'Styled text'
```

#### `termstyle.supportsColor`
Check if terminal supports color.

**Returns:** {boolean}

```javascript
if (termstyle.supportsColor) {
  console.log(termstyle.green('Color supported!'));
}
```

#### `termstyle.level`
Get color support level.

**Returns:** {number} 
- 0 = No color support
- 1 = Basic 16 colors
- 2 = 256 colors
- 3 = True color (16.7m colors)

```javascript
console.log(`Color level: ${termstyle.level}`);
```

#### `termstyle.getTerminalInfo()`
Get terminal information.

**Returns:** {Object}
- `supportsColor` {boolean}
- `colorLevel` {number}
- `isTTY` {boolean}
- `isCI` {boolean}
- `width` {number}
- `height` {number}
- `columns` {number}
- `rows` {number}

```javascript
const info = termstyle.getTerminalInfo();
console.log(info);
```

#### `termstyle.create(options)`
Create a new formatter instance.

**Parameters:**
- `options` {Object}
  - `force` {boolean} - Force color output
  - `level` {number} - Force color level

```javascript
const myStyle = termstyle.create({ force: true });
console.log(myStyle.red('Forced red'));
```

## Conditional Formatting

#### `termstyle.conditional(condition)`
Apply styles conditionally.

**Parameters:**
- `condition` {boolean} - Whether to apply styles

**Returns:** Conditional formatter

```javascript
const isError = true;
console.log(
  termstyle.conditional(isError).red('Error!')
);

// Chain with other methods
const debugInfo = termstyle.conditional(process.env.DEBUG).gray('Debug info');
console.log(debugInfo);
```

#### `termstyle.createLogFormatter(options)`
Create a log formatter with levels.

**Parameters:**
- `options` {Object}
  - `minLevel` {string} - Minimum level (default: 'info')
  - `timestamp` {boolean} - Include timestamps
  - `usePrefix` {boolean} - Include prefixes

**Returns:** LogFormatter instance

```javascript
const logger = termstyle.createLogFormatter({
  timestamp: true,
  usePrefix: true
});

console.log(logger.info('Server started'));
console.log(logger.warn('Low memory'));
console.log(logger.error('Connection failed'));
console.log(logger.debug('Debug info'));
```

#### `termstyle.createStatusFormatter()`
Create status formatters with icons.

**Returns:** Status formatter object

```javascript
const status = termstyle.createStatusFormatter();

console.log(status.success('Tests passed'));
console.log(status.error('Build failed'));
console.log(status.warning('Deprecated'));
console.log(status.info('Version 1.0.0'));
```

## Templates

#### `termstyle.template`
Template literal tag function.

```javascript
const name = 'World';
console.log(termstyle.template`Hello ${name}!`);
```

#### Template with styled values
```javascript
const user = 'John';
const score = 95;
console.log(
  termstyle.template`User ${termstyle.green(user)} scored ${
    termstyle.yellow.bold(`${score}%`)
  }!`
);
```

## Themes

#### `termstyle.ThemeManager`
Create a theme manager.

```javascript
const manager = new termstyle.ThemeManager();

// Set theme
manager.setTheme('dark');

// Register custom theme
manager.registerTheme('custom', {
  colors: {
    primary: '#007acc',
    success: '#4caf50',
    error: '#f44336'
  }
});

// Apply theme
const themed = manager.applyTheme();
console.log(themed.primary('Primary text'));
```

#### Built-in themes
- `default` - Default theme
- `dark` - Dark theme
- `ocean` - Ocean colors
- `forest` - Forest colors

```javascript
const themes = termstyle.themes;
// Access predefined themes
```

## Method Chaining

All color and style methods can be chained:

```javascript
// Chain styles
termstyle.red.bold('Bold red')
termstyle.blue.underline.italic('Blue underlined italic')

// Chain colors and backgrounds
termstyle.white.bgRed.bold('Alert!')

// Chain with advanced colors
termstyle.hex('#ff6b35').bgHex('#4ecdc4').bold('Styled')

// Complex chains
termstyle
  .red
  .bgYellow
  .bold
  .underline
  .italic('Complex styling')
```

## Error Handling

All methods handle invalid inputs gracefully:

```javascript
// Invalid inputs return original text or empty string
termstyle.hex('invalid')('text') // Returns: 'text'
termstyle.rgb(-10, 300, 128)('text') // Clamps values
termstyle.red(null) // Returns styled 'null'
termstyle.red(undefined) // Returns styled 'undefined'
```

## Performance Tips

1. **Reuse formatters for better performance:**
```javascript
const error = termstyle.red.bold;
for (let i = 0; i < 1000; i++) {
  console.log(error(`Error ${i}`));
}
```

2. **Use conditional formatting:**
```javascript
const debug = termstyle.conditional(process.env.DEBUG).gray;
debug('Debug message'); // Only styled if DEBUG is true
```

3. **Strip ANSI for length calculations:**
```javascript
const styled = termstyle.red.bold('Hello');
const length = termstyle.strip(styled).length; // 5
```