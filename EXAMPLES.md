# Examples

Comprehensive examples and usage patterns for @oxog/termstyle.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Color Examples](#color-examples)
- [Style Combinations](#style-combinations)
- [Advanced Features](#advanced-features)
- [Real-World Applications](#real-world-applications)
- [Performance Tips](#performance-tips)

## Basic Usage

### Simple Colors

```javascript
const termstyle = require('@oxog/termstyle').default;
// or with ES modules
import termstyle from '@oxog/termstyle';

// Basic foreground colors
console.log(termstyle.red('Error message'));
console.log(termstyle.green('Success message'));
console.log(termstyle.yellow('Warning message'));
console.log(termstyle.blue('Information'));

// Background colors
console.log(termstyle.bgRed.white('Alert'));
console.log(termstyle.bgGreen.black('Success'));
```

### Style Formatting

```javascript
// Text styles
console.log(termstyle.bold('Bold text'));
console.log(termstyle.italic('Italic text'));
console.log(termstyle.underline('Underlined text'));
console.log(termstyle.strikethrough('Crossed out'));

// Combined styles
console.log(termstyle.bold.underline.red('Important!'));
```

## Color Examples

### RGB Colors

```javascript
// RGB values (0-255)
console.log(termstyle.rgb(255, 0, 0)('Pure red'));
console.log(termstyle.rgb(0, 255, 0)('Pure green'));
console.log(termstyle.rgb(0, 0, 255)('Pure blue'));

// Orange color
console.log(termstyle.rgb(255, 165, 0)('Orange text'));

// Background RGB
console.log(termstyle.bgRgb(128, 0, 128).white('Purple background'));
```

### Hex Colors

```javascript
// Standard hex format
console.log(termstyle.hex('#ff0000')('Red'));
console.log(termstyle.hex('#00ff00')('Green'));
console.log(termstyle.hex('#0000ff')('Blue'));

// Short hex format
console.log(termstyle.hex('#f00')('Red'));
console.log(termstyle.hex('#0f0')('Green'));
console.log(termstyle.hex('#00f')('Blue'));

// Without hash
console.log(termstyle.hex('ff8000')('Orange'));

// Hex backgrounds
console.log(termstyle.bgHex('#1e90ff').white('Dodger blue bg'));
```

### ANSI 256 Colors

```javascript
// ANSI 256 color codes (0-255)
console.log(termstyle.color(196)('ANSI red'));
console.log(termstyle.color(46)('ANSI green'));
console.log(termstyle.color(21)('ANSI blue'));
console.log(termstyle.color(208)('ANSI orange'));

// Background ANSI 256 colors
console.log(termstyle.bgColor(196)('Text on ANSI red'));
console.log(termstyle.bgColor(46)('Text on ANSI green'));

// Using color with RGB arrays
console.log(termstyle.color([255, 0, 0])('RGB red'));
console.log(termstyle.color([0, 255, 0])('RGB green'));
```

## Style Combinations

### Chaining Styles

```javascript
// Multiple style chaining
console.log(termstyle.red.bold.underline('Triple style'));
console.log(termstyle.bgBlue.white.italic('Background + style'));
console.log(termstyle.green.bold.bgYellow.black('Complex combo'));

// Order doesn't matter for most styles
console.log(termstyle.bold.red.underline('Same as above'));
console.log(termstyle.underline.bold.red('Same as above'));
```

### Nested Styling

```javascript
// Styles can be nested
const error = termstyle.red.bold;
const highlight = termstyle.yellow.bgBlack;

console.log(error(`Error: ${highlight('file.txt')} not found`));
```

## Advanced Features

### Gradients

```javascript
// Rainbow gradient
console.log(termstyle.rainbow('Rainbow colored text'));

// Custom gradient with color names
console.log(termstyle.gradient('Gradient text', { 
  colors: ['red', 'yellow', 'green'] 
}));

// Hex color gradient
console.log(termstyle.gradient('Smooth gradient', { 
  colors: ['#ff0000', '#00ff00', '#0000ff'] 
}));

// RGB array gradient
console.log(termstyle.gradient('RGB gradient', { 
  colors: [[255,0,0], [0,255,0], [0,0,255]] 
}));
```

### Animations

#### Spinners

```javascript
// Basic spinner
const spinner = termstyle.spinner('Loading...');
spinner.start();
setTimeout(() => spinner.stop(), 3000);

// Spinner with different types
const customSpinner = termstyle.spinner({
  text: 'Processing',
  spinner: 'dots2'
});
customSpinner.start();

// Spinner completion methods
setTimeout(() => {
  // Different ways to stop
  customSpinner.succeed('Complete!');  // ✓ with green text
  // or customSpinner.fail('Failed!');  // ✗ with red text
  // or customSpinner.warn('Warning!'); // ⚠ with yellow text
  // or customSpinner.info('Info');     // ℹ with blue text
}, 2000);
```

#### Animations

```javascript
// Create animated text
const anim = termstyle.animate('Animated text', 'pulse', {
  duration: 3000,
  interval: 500
});
anim.start();

// Stop animation later
setTimeout(() => {
  anim.stop();
}, 5000);
```

### Progress Bars

```javascript
// Create a progress bar instance
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

// Or use tick to increment
progressBar.tick(25);  // Now at 50%
console.log(progressBar.render());

// Simple progress bar string
console.log(termstyle.bar(0.5, 1, { width: 20 }));
// ██████████░░░░░░░░░░

// Complete the progress
progressBar.complete();
```

### Box Drawing

```javascript
// Simple box
console.log(termstyle.box('Hello World!'));

// Styled box
console.log(termstyle.box('Important Notice', {
  padding: 1,
  borderStyle: 'double',
  borderColor: 'red'
}));

// Complex box with title
const boxContent = `Welcome to TermStyle!

This is a demo of the box drawing feature.
You can customize borders, colors, and layout.`;

console.log(termstyle.box(boxContent, {
  padding: 1,
  margin: 1,
  borderStyle: 'round',
  borderColor: 'blue',
  title: '🎨 TermStyle Demo',
  titleAlignment: 'center',
  width: 50,
  align: 'center'
}));

// Warning box
console.log(termstyle.box('⚠️  This action cannot be undone!', {
  padding: 1,
  borderStyle: 'bold',
  borderColor: 'yellow'
}));
```

### Template Literals

```javascript
// Basic template usage
const name = 'Alice';
const status = 'online';
console.log(termstyle.template`
User: ${termstyle.blue.bold(name)}
Status: ${termstyle.green(status)}
Last seen: ${termstyle.dim('2 minutes ago')}
`);

// Complex template with conditions
function userCard(user) {
  const statusColor = user.online ? termstyle.green : termstyle.red;
  const roleColor = user.role === 'admin' ? termstyle.yellow : termstyle.white;
  
  return termstyle.template`
${termstyle.bold('User Profile')}
────────────────
Name: ${termstyle.cyan(user.name)}
Role: ${roleColor(user.role)}
Status: ${statusColor(user.online ? 'Online' : 'Offline')}
${user.premium ? termstyle.yellow('⭐ Premium Member') : ''}
  `;
}

console.log(userCard({
  name: 'John Doe',
  role: 'admin',
  online: true,
  premium: true
}));
```

### Conditional Formatting

```javascript
// Conditional styling
const isError = true;
console.log(
  termstyle.conditional(isError).red('Error occurred')
);

// Status formatters
const status = termstyle.createStatusFormatter();
console.log(status.success('Operation completed'));
console.log(status.error('Operation failed'));
console.log(status.warning('Please review'));
console.log(status.info('For your information'));

// Log formatter
const logger = termstyle.createLogFormatter({
  timestamp: true,
  usePrefix: true
});

console.log(logger.info('Server started'));
console.log(logger.warn('Low memory'));
console.log(logger.error('Connection failed'));
console.log(logger.debug('Debug info'));
```

## Real-World Applications

### CLI Application

```javascript
#!/usr/bin/env node
import termstyle from '@oxog/termstyle';

class CLIApp {
  constructor() {
    this.name = 'MyApp';
    this.version = '1.0.0';
  }
  
  showHeader() {
    console.log(termstyle.box(`${termstyle.bold.blue(this.name)} ${termstyle.dim(`v${this.version}`)}\n${termstyle.italic('A powerful CLI tool')}`, {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'blue'
    }));
  }
  
  showMenu() {
    console.log(`
${termstyle.bold('Available Commands:')}

  ${termstyle.green('start')}     Start the application
  ${termstyle.yellow('config')}    Configure settings
  ${termstyle.blue('status')}    Show current status
  ${termstyle.red('stop')}      Stop the application
  ${termstyle.gray('help')}      Show this help message
    `);
  }
  
  async processCommand(command) {
    const spinner = termstyle.spinner('Starting...');
    
    switch (command) {
      case 'start':
        spinner.start();
        spinner.update('Starting application...');
        await this.simulateTask(2000);
        spinner.succeed('Application started successfully');
        break;
        
      case 'stop':
        spinner.start();
        spinner.update('Stopping application...');
        await this.simulateTask(1000);
        spinner.succeed('Application stopped');
        break;
        
      case 'config':
        this.showConfig();
        break;
        
      case 'status':
        this.showStatus();
        break;
        
      default:
        console.log(termstyle.red(`Unknown command: ${command}`));
        this.showMenu();
    }
  }
  
  showConfig() {
    const configText = `${termstyle.bold('Configuration')}

Database: ${termstyle.green('Connected')}
Cache: ${termstyle.yellow('Enabled')}
Debug: ${termstyle.red('Disabled')}
Port: ${termstyle.blue('3000')}`;
    
    console.log(termstyle.box(configText, {
      padding: 1,
      borderStyle: 'single',
      title: '⚙️ Settings'
    }));
  }
  
  showStatus() {
    const uptime = '2h 34m';
    const memory = '145 MB';
    const cpu = '12%';
    
    console.log(`
${termstyle.bold('System Status')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${termstyle.green('●')} Status:     ${termstyle.green('Running')}
⏱️  Uptime:     ${termstyle.blue(uptime)}
🧠 Memory:     ${termstyle.yellow(memory)}
⚡ CPU:        ${termstyle.cyan(cpu)}

${termstyle.dim('Last updated: ' + new Date().toLocaleTimeString())}
    `);
  }
  
  simulateTask(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }
}

// Usage
const app = new CLIApp();
app.showHeader();
app.showMenu();
```

### Logger System

```javascript
class Logger {
  constructor(options = {}) {
    this.showTimestamp = options.timestamp !== false;
    this.colorize = options.color !== false;
  }
  
  log(level, message, data = null) {
    const timestamp = this.showTimestamp 
      ? termstyle.dim(`[${new Date().toISOString()}]`)
      : '';
    
    const formattedLevel = this.formatLevel(level);
    const formattedMessage = this.colorize ? message : termstyle.strip(message);
    
    let output = `${timestamp} ${formattedLevel} ${formattedMessage}`;
    
    if (data) {
      output += '\n' + termstyle.dim(JSON.stringify(data, null, 2));
    }
    
    console.log(output);
  }
  
  formatLevel(level) {
    const styles = {
      ERROR: termstyle.red.bold.bgWhite,
      WARN:  termstyle.black.bold.bgYellow,
      INFO:  termstyle.white.bold.bgBlue,
      DEBUG: termstyle.gray,
      TRACE: termstyle.dim
    };
    
    const style = styles[level] || termstyle.white;
    return style(` ${level.padEnd(5)} `);
  }
  
  error(message, data) { this.log('ERROR', message, data); }
  warn(message, data) { this.log('WARN', message, data); }
  info(message, data) { this.log('INFO', message, data); }
  debug(message, data) { this.log('DEBUG', message, data); }
  trace(message, data) { this.log('TRACE', message, data); }
}

// Usage
const logger = new Logger();
logger.error('Database connection failed', { host: 'localhost', port: 5432 });
logger.warn('API rate limit approaching');
logger.info('Server started successfully');
logger.debug('Processing user request', { userId: 123, action: 'login' });
```

### Test Runner Output

```javascript
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
  }
  
  async runTest(testName, testFn) {
    const spinner = termstyle.spinner(`Running ${testName}`);
    spinner.start();
    
    try {
      await testFn();
      this.passed++;
      spinner.succeed(termstyle.green(`✓ ${testName}`));
    } catch (error) {
      this.failed++;
      spinner.fail(termstyle.red(`✗ ${testName}`));
      console.log(termstyle.dim(`  ${error.message}`));
    }
  }
  
  skip(testName, reason) {
    this.skipped++;
    console.log(termstyle.yellow(`⊝ ${testName} ${termstyle.dim(`(${reason})`)}`));
  }
  
  showSummary() {
    const total = this.passed + this.failed + this.skipped;
    const summaryText = `${termstyle.bold('Test Results')}

${termstyle.green('Passed:')}  ${this.passed}/${total}
${termstyle.red('Failed:')}  ${this.failed}/${total}
${termstyle.yellow('Skipped:')} ${this.skipped}/${total}

${this.failed === 0 
  ? termstyle.green.bold('All tests passed! 🎉') 
  : termstyle.red.bold(`${this.failed} test(s) failed`)
}`;
    
    console.log('\n' + termstyle.box(summaryText, {
      padding: 1,
      borderStyle: this.failed === 0 ? 'round' : 'single',
      borderColor: this.failed === 0 ? 'green' : 'red'
    }));
  }
}

// Usage
const runner = new TestRunner();

await runner.runTest('User authentication', async () => {
  // Test implementation
  await new Promise(resolve => setTimeout(resolve, 500));
});

await runner.runTest('Database operations', async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
});

runner.skip('Integration tests', 'Database not available');

runner.showSummary();
```

## Performance Tips

### Efficient Color Usage

```javascript
// ✅ Good: Create style functions once and reuse
const errorStyle = termstyle.red.bold;
const successStyle = termstyle.green;

for (let i = 0; i < 1000; i++) {
  console.log(errorStyle('Error message'));
  console.log(successStyle('Success message'));
}

// ❌ Avoid: Creating styles repeatedly
for (let i = 0; i < 1000; i++) {
  console.log(termstyle.red.bold('Error message'));
  console.log(termstyle.green('Success message'));
}
```

### Using Themes

```javascript
// Create a theme manager
const themeManager = new termstyle.ThemeManager();

// Use built-in themes
themeManager.setTheme('dark');

// Register custom theme
themeManager.registerTheme('custom', {
  colors: {
    primary: '#007acc',
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800'
  }
});

// Apply theme
const themed = themeManager.applyTheme();
console.log(themed.primary('Primary text'));
console.log(themed.success('Success message'));
```

### Terminal Information

```javascript
// Check color support
console.log('Color support:', termstyle.supportsColor);
console.log('Color level:', termstyle.level); // 0, 1, 2, or 3

// Get detailed terminal info
const info = termstyle.getTerminalInfo();
console.log(info);
// {
//   supportsColor: true,
//   colorLevel: 3,
//   isTTY: true,
//   isCI: false,
//   width: 120,
//   height: 30,
//   columns: 120,
//   rows: 30
// }

// Strip ANSI codes when needed
const styled = termstyle.red.bold('Styled text');
const plain = termstyle.strip(styled);
console.log(plain); // 'Styled text' (no ANSI codes)
```

---

For more advanced usage and API details, see [API.md](./API.md).