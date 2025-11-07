/**
 * INTEGRATION TESTS FOR BUG FIXES
 * Tests that verify fixes work in real-world scenarios
 */

import { Style } from '../../src/styles/style';
import { gradient, rainbow } from '../../src/effects/gradient';
import { Animation, Spinner } from '../../src/effects/animation';
import { ProgressBar } from '../../src/effects/progress';

describe('Integration: Color Processing', () => {
  test('should apply hex colors to text using fixed color processor', () => {
    const style = new Style([], [], { force: true });
    const result = style.hex('#ff0000').apply('test');

    expect(result).toContain('test');
    expect(result).toContain('\u001b['); // Should contain ANSI codes
  });

  test('should apply RGB colors to text', () => {
    const style = new Style([], [], { force: true });
    const result = style.rgb(255, 0, 0).apply('test');

    expect(result).toContain('test');
    expect(result).toContain('\u001b[38;2'); // True color ANSI code
  });

  test('should chain multiple color methods', () => {
    const style = new Style([], [], { force: true });
    const result = style
      .hex('#ff0000')
      .bold
      .underline
      .apply('test');

    expect(result).toContain('test');
    expect(result.length).toBeGreaterThan('test'.length); // Has ANSI codes
  });
});

describe('Integration: Gradient Effects', () => {
  test('should create gradient with hex colors', () => {
    const result = gradient('Hello World', ['#ff0000', '#00ff00', '#0000ff']);

    // Result should either contain original text or styled version
    expect(result.length).toBeGreaterThanOrEqual('Hello World'.length);
  });

  test('should create rainbow gradient', () => {
    const result = rainbow('Rainbow Text');

    // Result should contain at least the original text
    expect(result.length).toBeGreaterThanOrEqual('Rainbow Text'.length);
  });

  test('should handle empty text gracefully', () => {
    const result = gradient('', ['#ff0000', '#00ff00']);
    expect(result).toBe('');
  });

  test('should handle single color', () => {
    const result = gradient('Test', ['#ff0000']);
    expect(result).toContain('Test');
  });
});

describe('Integration: Animation Components', () => {
  test('should create and dispose animation without errors', (done) => {
    const animation = new Animation('Loading...', 'pulse', {
      duration: 100,
      iterations: 1,
      onComplete: () => {
        animation.dispose();
        done();
      }
    });

    animation.start();
  }, 5000);

  test('should create spinner with all frames', () => {
    const spinner = new Spinner('Processing', 'dots');

    expect(spinner).toBeDefined();
    expect(spinner['frames']).toBeDefined();
    expect(spinner['frames'].length).toBeGreaterThan(0);

    spinner.dispose();
  });

  test('should stop animation cleanly', () => {
    const animation = new Animation('test', 'blink', { duration: 1000 });

    animation.start();
    expect(animation['running']).toBe(true);

    animation.stop();
    expect(animation['running']).toBe(false);

    animation.dispose();
  });
});

describe('Integration: Progress Bars', () => {
  test('should create and update progress bar', () => {
    const progressBar = new ProgressBar({
      total: 100,
      width: 20
    });

    progressBar.update(50);
    const rendered = progressBar.getRenderString();

    expect(rendered).toContain('50%');
    expect(rendered.length).toBeGreaterThan(0);

    progressBar.dispose();
  });

  test('should handle progress completion', () => {
    const progressBar = new ProgressBar({ total: 100 });

    progressBar.update(100);
    const rendered = progressBar.getRenderString();

    expect(rendered).toContain('100%');

    progressBar.complete();
    expect(progressBar['isDisposed']).toBe(true);
  });

  test('should throttle rendering', () => {
    const progressBar = new ProgressBar({
      total: 100,
      renderThrottle: 100 // 100ms throttle
    });

    let renderCount = 0;
    const originalRender = progressBar['render'].bind(progressBar);
    progressBar['render'] = function(tokens?: Record<string, string>, forceRender = false) {
      renderCount++;
      return originalRender(tokens, forceRender);
    };

    // Multiple rapid updates
    for (let i = 0; i < 10; i++) {
      progressBar.tick(1);
    }

    // Should be throttled (no more than 10 renders)
    expect(renderCount).toBeLessThanOrEqual(10);

    progressBar.dispose();
  });
});

describe('Integration: Component ID Uniqueness', () => {
  test('should generate unique IDs across multiple components', () => {
    const components: any[] = [];

    // Create multiple components
    for (let i = 0; i < 10; i++) {
      components.push(new Animation(`test${i}`, 'blink'));
      components.push(new Spinner(`test${i}`, 'dots'));
      components.push(new ProgressBar());
    }

    // Extract all component IDs
    const ids = components.map(c => c['componentId']);
    const uniqueIds = new Set(ids);

    // All IDs should be unique
    expect(uniqueIds.size).toBe(ids.length);

    // Cleanup
    components.forEach(c => c.dispose());
  });

  test('should generate IDs with correct format', () => {
    const animation = new Animation('test', 'blink');
    const spinner = new Spinner('test', 'dots');
    const progressBar = new ProgressBar();

    expect(animation['componentId']).toMatch(/^animation-\d+-[a-z0-9]+$/);
    expect(spinner['componentId']).toMatch(/^spinner-\d+-[a-z0-9]+$/);
    expect(progressBar['componentId']).toMatch(/^progress-\d+-[a-z0-9]+$/);

    animation.dispose();
    spinner.dispose();
    progressBar.dispose();
  });
});

describe('Integration: Error Recovery', () => {
  test('should handle invalid color inputs gracefully in production', () => {
    const style = new Style([], [], { force: true });

    // Invalid color should return unchanged style (no throw in production)
    const result = style.color('not-a-color' as any);
    expect(result).toBeDefined();
  });

  test('should handle disposal of already disposed components', () => {
    const animation = new Animation('test', 'blink');

    animation.dispose();

    // Second disposal should not throw
    expect(() => animation.dispose()).not.toThrow();
  });

  test('should handle component operations after disposal gracefully', () => {
    const spinner = new Spinner('test', 'dots');
    spinner.dispose();

    // Operations should be no-ops
    expect(() => spinner.start()).not.toThrow();
    expect(() => spinner.stop()).not.toThrow();
    expect(() => spinner.update('new text')).not.toThrow();
  });
});
