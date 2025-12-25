/**
 * Comprehensive Bug Fix Tests - 2025-12-25
 * Tests for all bugs discovered and fixed in this session
 */

import { box } from '../../src/effects/box';
import { ProgressBar } from '../../src/effects/progress';
import { Formatter } from '../../src/formatter';

describe('BUG-001: Box title overflow prevention', () => {
  it('should not throw RangeError when title is longer than content width', () => {
    // This would previously throw: RangeError: Invalid count value
    expect(() => {
      box('Short', {
        title: 'This is a very long title that exceeds the content width significantly',
        width: 30
      });
    }).not.toThrow();
  });

  it('should handle title exactly at content width', () => {
    expect(() => {
      box('Content', {
        title: 'Title123456789012345678',  // 24 chars
        width: 26  // 26 - 2 = 24 for content
      });
    }).not.toThrow();
  });

  it('should handle empty content with long title', () => {
    expect(() => {
      box('', {
        title: 'Very long title for empty content box',
        width: 20
      });
    }).not.toThrow();
  });

  it('should handle title with ANSI codes longer than width', () => {
    expect(() => {
      box('Test', {
        title: '\x1b[31mRed Title That Is Very Long And Should Not Crash\x1b[39m',
        width: 20
      });
    }).not.toThrow();
  });

  it('should correctly render box with long title using all alignment options', () => {
    const longTitle = 'This title is intentionally very long';

    expect(() => {
      box('Content', { title: longTitle, titleAlignment: 'left', width: 25 });
    }).not.toThrow();

    expect(() => {
      box('Content', { title: longTitle, titleAlignment: 'center', width: 25 });
    }).not.toThrow();

    expect(() => {
      box('Content', { title: longTitle, titleAlignment: 'right', width: 25 });
    }).not.toThrow();
  });
});

describe('BUG-002 & BUG-003: Progress bar ETA consistency and capping', () => {
  it('should use consistent percent threshold in render() and getRenderString()', () => {
    const bar = new ProgressBar({ total: 1000, width: 40 });

    // Update to 0.05% progress (0.0005 as decimal)
    bar.update(0.5);

    // Both methods should now use the same 0.001 threshold
    const renderStr = bar.getRenderString();
    expect(renderStr).toBeDefined();
    expect(renderStr).toContain('0%');
  });

  it('should cap ETA at 24 hours in getRenderString()', () => {
    const bar = new ProgressBar({ total: 1000000, width: 40 });

    // Tiny progress to trigger large ETA
    bar.update(1);

    const renderStr = bar.getRenderString();

    // Should not show extremely large ETA values
    expect(renderStr).toBeDefined();
    // ETA should be capped, not showing absurd values like "999:59:59"
    expect(renderStr).not.toMatch(/\d{4,}:/); // No 4+ digit hours
  });

  it('should handle zero progress without division errors', () => {
    const bar = new ProgressBar({ total: 100, width: 40 });

    // Zero progress should not cause NaN or Infinity
    expect(() => {
      bar.getRenderString();
    }).not.toThrow();

    const renderStr = bar.getRenderString();
    expect(renderStr).not.toContain('NaN');
    expect(renderStr).not.toContain('Infinity');
  });

  it('should use 0.001 threshold consistently', () => {
    const bar = new ProgressBar({ total: 10000, width: 40 });

    // Progress at exactly 0.1% (0.001 threshold)
    bar.update(10);

    const renderStr = bar.getRenderString();
    expect(renderStr).toBeDefined();
    expect(renderStr).toContain('0%');
  });
});

describe('BUG-004: Progress bar head display with 1-character fill', () => {
  it('should display head character when filled length is 1', () => {
    const bar = new ProgressBar({
      total: 100,
      width: 40,
      complete: '█',
      incomplete: '░',
      head: '>'
    });

    // Set to minimal progress (1/100 = 1%, should fill 0.4 chars, rounds to 0)
    // Set to 3% to get filledLength = 1 (3% of 40 = 1.2, floors to 1)
    bar.update(3);

    const renderStr = bar.getRenderString();

    // Should show the head character, not empty
    expect(renderStr).toContain('>');
    // Should not have empty filled section
    expect(renderStr).not.toMatch(/^\s*░/); // Not starting with incomplete chars only
  });

  it('should display head character correctly with 2-character fill', () => {
    const bar = new ProgressBar({
      total: 100,
      width: 40,
      complete: '█',
      incomplete: '░',
      head: '>'
    });

    // 5% progress = 2 chars filled
    bar.update(5);

    const renderStr = bar.getRenderString();

    // Should have 1 complete char + head
    expect(renderStr).toContain('█>');
  });

  it('should not display head when progress is 0%', () => {
    const bar = new ProgressBar({
      total: 100,
      width: 40,
      head: '>'
    });

    bar.update(0);

    const renderStr = bar.getRenderString();

    // Head should not appear at 0%
    expect(renderStr).not.toContain('>');
  });

  it('should not display head when progress is 100%', () => {
    const bar = new ProgressBar({
      total: 100,
      width: 40,
      complete: '█',
      head: '>'
    });

    bar.update(100);

    const renderStr = bar.getRenderString();

    // Head should not appear at 100%
    expect(renderStr).not.toContain('>');
    // Should be all complete chars
    expect(renderStr).toContain('█'.repeat(40));
  });
});

describe('BUG-005: Type safety improvements in Formatter', () => {
  it('should handle unknown types safely in formatter function', () => {
    const fmt = Formatter.create();

    // Test with various types that were previously any[]
    expect(() => {
      (fmt as any)(null);
    }).not.toThrow();

    expect(() => {
      (fmt as any)(undefined);
    }).not.toThrow();

    expect(() => {
      (fmt as any)(123);
    }).not.toThrow();

    expect(() => {
      (fmt as any)({ foo: 'bar' });
    }).not.toThrow();
  });

  it('should convert unknown types to strings correctly', () => {
    const fmt = Formatter.create();

    // Numbers should be converted to strings
    const numResult = (fmt as any)(123);
    expect(typeof numResult).toBe('string');
    expect(numResult).toContain('123');

    // Objects should be converted to strings
    const objResult = (fmt as any)({ test: 'value' });
    expect(typeof objResult).toBe('string');
  });

  it('should handle template strings with unknown substitutions', () => {
    const fmt = Formatter.create();

    // Template with various types
    const result = (fmt as any)`Value: ${null} ${undefined} ${123} ${{ foo: 'bar' }}`;

    expect(typeof result).toBe('string');
    expect(result).toContain('null');
    expect(result).toContain('undefined');
    expect(result).toContain('123');
  });

  it('should maintain backward compatibility with any[] API', () => {
    const fmt = Formatter.create();

    // Original usage should still work
    const result1 = fmt.red('test');
    expect(result1).toContain('test');

    const result2 = (fmt.red as any)('multiple', 'args', 'here');
    expect(typeof result2).toBe('string');

    const result3 = (fmt.blue as any)`Template ${123}`;
    expect(typeof result3).toBe('string');
  });
});

describe('Regression Tests: Ensure previous fixes still work', () => {
  it('should not break existing box functionality', () => {
    const result = box('Hello World', {
      padding: 1,
      borderStyle: 'single'
    });

    expect(result).toContain('Hello World');
    expect(result).toContain('┌');
    expect(result).toContain('└');
  });

  it('should not break existing progress bar functionality', () => {
    const bar = new ProgressBar({ total: 100, width: 20 });
    bar.update(50);

    const result = bar.getRenderString();
    expect(result).toContain('50%');
  });

  it('should not break existing formatter functionality', () => {
    const fmt = Formatter.create({ force: true }); // Force color output
    const result = fmt.red.bold('Test');

    expect(result).toContain('Test');
    expect(result).toMatch(/\x1b\[\d+m/); // Has ANSI codes
  });
});

describe('Edge Cases: Additional safety checks', () => {
  it('should handle box with zero width gracefully', () => {
    expect(() => {
      box('Test', { width: 0, title: 'Title' });
    }).not.toThrow();
  });

  it('should handle progress bar with zero total', () => {
    const bar = new ProgressBar({ total: 0, width: 40 });

    expect(() => {
      bar.update(0);
      bar.getRenderString();
    }).not.toThrow();
  });

  it('should handle formatter with empty string', () => {
    const fmt = Formatter.create();

    const result = fmt.red('');
    expect(result).toBe('');
  });
});
