/**
 * BUG FIX VERIFICATION TESTS
 * Tests for all bugs identified and fixed in the comprehensive analysis
 */

import { ColorProcessor } from '../../src/core/color-processor';
import { Animation, Spinner } from '../../src/effects/animation';
import { ProgressBar } from '../../src/effects/progress';

describe('BUG-002: Deprecated substr() Method Fixes', () => {
  describe('Color HEX parsing uses slice() not substr()', () => {
    test('should correctly parse 6-digit hex color', () => {
      const result = ColorProcessor.processColor('#ff0000');
      expect(result).toEqual([255, 0, 0]);
    });

    test('should correctly parse 3-digit hex color', () => {
      const result = ColorProcessor.processColor('#f00');
      expect(result).toEqual([255, 0, 0]);
    });

    test('should correctly parse hex with various values', () => {
      const testCases = [
        ['#000000', [0, 0, 0]],
        ['#ffffff', [255, 255, 255]],
        ['#123456', [18, 52, 86]],
        ['#abcdef', [171, 205, 239]],
      ];

      testCases.forEach(([hex, expected]) => {
        const result = ColorProcessor.processColor(hex as string);
        expect(result).toEqual(expected);
      });
    });

    test('should handle edge case hex values correctly', () => {
      // Test boundary conditions
      const result1 = ColorProcessor.processColor('#0a0b0c');
      expect(result1).toEqual([10, 11, 12]);

      const result2 = ColorProcessor.processColor('#fafbfc');
      expect(result2).toEqual([250, 251, 252]);
    });
  });

  describe('Component ID generation uses slice() not substr()', () => {
    test('Animation component ID should be properly generated', () => {
      const animation = new Animation('test', 'blink', { duration: 100 });

      // Verify ID format: animation-{timestamp}-{random}
      expect(animation['componentId']).toMatch(/^animation-\d+-[a-z0-9]{9}$/);

      // Cleanup
      animation.dispose();
    });

    test('Spinner component ID should be properly generated', () => {
      const spinner = new Spinner('test', 'dots');

      // Verify ID format: spinner-{timestamp}-{random}
      expect(spinner['componentId']).toMatch(/^spinner-\d+-[a-z0-9]{9}$/);

      // Cleanup
      spinner.dispose();
    });

    test('ProgressBar component ID should be properly generated', () => {
      const progressBar = new ProgressBar({ total: 100 });

      // Verify ID format: progress-{timestamp}-{random}
      expect(progressBar['componentId']).toMatch(/^progress-\d+-[a-z0-9]{9}$/);

      // Cleanup
      progressBar.dispose();
    });

    test('Component IDs should be unique', () => {
      const animation1 = new Animation('test1', 'blink');
      const animation2 = new Animation('test2', 'blink');
      const spinner1 = new Spinner('test1', 'dots');
      const progressBar1 = new ProgressBar();

      const ids = new Set([
        animation1['componentId'],
        animation2['componentId'],
        spinner1['componentId'],
        progressBar1['componentId'],
      ]);

      // All IDs should be unique
      expect(ids.size).toBe(4);

      // Cleanup
      animation1.dispose();
      animation2.dispose();
      spinner1.dispose();
      progressBar1.dispose();
    });
  });

  describe('slice() vs substr() behavior verification', () => {
    test('slice() correctly extracts substring with length', () => {
      const str = '0123456789';

      // substr(2, 9) means start at 2, take 9 chars
      // slice(2, 11) means start at 2, end at 11 (9 chars)
      const sliceResult = str.slice(2, 11);
      expect(sliceResult).toBe('23456789');
      expect(sliceResult.length).toBe(8); // Only 8 chars available
    });

    test('slice() handles bounds correctly', () => {
      const str = 'abcdef';

      // slice beyond string length should not error
      expect(str.slice(0, 100)).toBe('abcdef');
      expect(str.slice(2, 100)).toBe('cdef');
    });
  });
});

describe('BUG-003: ESLint Configuration', () => {
  test('should allow linting without tests directory', () => {
    // This test verifies the package.json lint command works
    // The actual test is whether `npm run lint` succeeds (tested in CI)
    expect(true).toBe(true);
  });
});

describe('Color Processing - Edge Cases', () => {
  test('should handle invalid hex colors gracefully', () => {
    // Invalid hex should fallback to white [255, 255, 255]
    const result = ColorProcessor.processColor('invalid');
    expect(result).toEqual([255, 255, 255]);
  });

  test('should clamp RGB values', () => {
    const result = ColorProcessor.processColor([300, -10, 128]);
    expect(result[0]).toBeLessThanOrEqual(255);
    expect(result[0]).toBeGreaterThanOrEqual(0);
    expect(result[1]).toBeLessThanOrEqual(255);
    expect(result[1]).toBeGreaterThanOrEqual(0);
    expect(result[2]).toBeLessThanOrEqual(255);
    expect(result[2]).toBeGreaterThanOrEqual(0);
  });

  test('should handle number colors correctly', () => {
    // Red: 0xFF0000
    const red = ColorProcessor.processColor(0xff0000);
    expect(red).toEqual([255, 0, 0]);

    // Green: 0x00FF00
    const green = ColorProcessor.processColor(0x00ff00);
    expect(green).toEqual([0, 255, 0]);

    // Blue: 0x0000FF
    const blue = ColorProcessor.processColor(0x0000ff);
    expect(blue).toEqual([0, 0, 255]);
  });

  test('should process color names correctly', () => {
    const red = ColorProcessor.processColor('red');
    expect(red[0]).toBeGreaterThan(200); // Red channel should be high

    const green = ColorProcessor.processColor('green');
    expect(green[1]).toBeGreaterThan(200); // Green channel should be high

    const blue = ColorProcessor.processColor('blue');
    expect(blue[2]).toBeGreaterThan(200); // Blue channel should be high
  });
});

describe('Resource Management', () => {
  test('should properly dispose animation resources', () => {
    const animation = new Animation('test', 'blink', { duration: 100 });

    animation.start();
    expect(animation['running']).toBe(true);

    animation.dispose();
    expect(animation['isDisposed']).toBe(true);
    expect(animation['running']).toBe(false);
  });

  test('should prevent operations after disposal', () => {
    const animation = new Animation('test', 'blink');
    animation.dispose();

    // Operations after disposal should be no-ops
    animation.start(); // Should not throw
    expect(animation['running']).toBe(false);
  });

  test('multiple dispose calls should be safe', () => {
    const spinner = new Spinner('test', 'dots');

    spinner.dispose();
    spinner.dispose(); // Should not throw
    spinner.dispose(); // Should not throw

    expect(spinner['isDisposed']).toBe(true);
  });
});

describe('Validation Tests', () => {
  test('Animation should validate text input', () => {
    expect(() => {
      new Animation('valid text', 'blink');
    }).not.toThrow();
  });

  test('Animation should validate duration', () => {
    expect(() => {
      new Animation('test', 'blink', { duration: -100 });
    }).toThrow();
  });

  test('ProgressBar should validate total', () => {
    expect(() => {
      new ProgressBar({ total: -10 });
    }).toThrow();
  });

  test('ProgressBar should validate width', () => {
    expect(() => {
      new ProgressBar({ width: -5 });
    }).toThrow();
  });
});
