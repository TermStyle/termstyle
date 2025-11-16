/**
 * ANSI Module Bug Fix Test Suite
 * Tests for bugs identified and fixed in ansi.ts
 */

import { hexToRgb } from '../../src/core/ansi';

describe('BUG-NEW-001: hexToRgb NaN Validation and Input Sanitization', () => {
  describe('Malformed Hex String Handling', () => {
    test('should return [0,0,0] for hex strings without valid hex characters', () => {
      const result = hexToRgb('#gggggg');
      expect(result).toEqual([0, 0, 0]);
      expect(result.every(v => !isNaN(v))).toBe(true);
    });

    test('should return [0,0,0] for hex strings with invalid characters', () => {
      const result = hexToRgb('#abc@@@');
      expect(result).toEqual([0, 0, 0]);
      expect(result.every(v => !isNaN(v))).toBe(true);
    });

    test('should return [0,0,0] for hex strings with mixed valid/invalid characters', () => {
      const result = hexToRgb('#ff00zz');
      expect(result).toEqual([0, 0, 0]);
      expect(result.every(v => !isNaN(v))).toBe(true);
    });

    test('should return [0,0,0] for special characters and symbols', () => {
      const testCases = ['#@@@###', '#xyz123', '#!@#$%^', '!@#$%^'];

      testCases.forEach(testCase => {
        const result = hexToRgb(testCase);
        expect(result).toEqual([0, 0, 0]);
        expect(result.every(v => !isNaN(v))).toBe(true);
      });
    });
  });

  describe('Edge Case Handling', () => {
    test('should handle empty string', () => {
      const result = hexToRgb('');
      expect(result).toEqual([0, 0, 0]);
      expect(result.every(v => !isNaN(v))).toBe(true);
    });

    test('should handle hash-only string', () => {
      const result = hexToRgb('#');
      expect(result).toEqual([0, 0, 0]);
      expect(result.every(v => !isNaN(v))).toBe(true);
    });

    test('should handle null input', () => {
      const result = hexToRgb(null as any);
      expect(result).toEqual([0, 0, 0]);
      expect(result.every(v => !isNaN(v))).toBe(true);
    });

    test('should handle undefined input', () => {
      const result = hexToRgb(undefined as any);
      expect(result).toEqual([0, 0, 0]);
      expect(result.every(v => !isNaN(v))).toBe(true);
    });

    test('should handle non-string input', () => {
      expect(hexToRgb(123 as any)).toEqual([0, 0, 0]);
      expect(hexToRgb({} as any)).toEqual([0, 0, 0]);
      expect(hexToRgb([] as any)).toEqual([0, 0, 0]);
    });
  });

  describe('Invalid Length Handling', () => {
    test('should return [0,0,0] for hex string with wrong length (4 chars)', () => {
      const result = hexToRgb('#ff00');
      expect(result).toEqual([0, 0, 0]);
      expect(result.every(v => !isNaN(v))).toBe(true);
    });

    test('should return [0,0,0] for hex string with wrong length (5 chars)', () => {
      const result = hexToRgb('#ff000');
      expect(result).toEqual([0, 0, 0]);
      expect(result.every(v => !isNaN(v))).toBe(true);
    });

    test('should return [0,0,0] for hex string with wrong length (7+ chars)', () => {
      const result = hexToRgb('#ff0000ff');
      expect(result).toEqual([0, 0, 0]);
      expect(result.every(v => !isNaN(v))).toBe(true);
    });

    test('should return [0,0,0] for hex string with 1-2 chars', () => {
      expect(hexToRgb('#f')).toEqual([0, 0, 0]);
      expect(hexToRgb('#ff')).toEqual([0, 0, 0]);
    });
  });

  describe('Valid Hex Code Parsing', () => {
    test('should correctly parse valid 6-character hex codes', () => {
      expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
      expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
      expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    });

    test('should correctly parse valid 3-character hex codes', () => {
      expect(hexToRgb('#f00')).toEqual([255, 0, 0]);
      expect(hexToRgb('#0f0')).toEqual([0, 255, 0]);
      expect(hexToRgb('#00f')).toEqual([0, 0, 255]);
      expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000')).toEqual([0, 0, 0]);
    });

    test('should handle uppercase hex codes', () => {
      expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('#ABCDEF')).toEqual([171, 205, 239]);
    });

    test('should handle mixed case hex codes', () => {
      expect(hexToRgb('#FfFfFf')).toEqual([255, 255, 255]);
      expect(hexToRgb('#AbCdEf')).toEqual([171, 205, 239]);
    });

    test('should handle hex codes without hash prefix', () => {
      expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('00ff00')).toEqual([0, 255, 0]);
      expect(hexToRgb('fff')).toEqual([255, 255, 255]);
    });

    test('should parse common color values correctly', () => {
      expect(hexToRgb('#800080')).toEqual([128, 0, 128]); // Purple
      expect(hexToRgb('#ffa500')).toEqual([255, 165, 0]);  // Orange
      expect(hexToRgb('#808080')).toEqual([128, 128, 128]); // Gray
    });
  });

  describe('NaN Prevention - Comprehensive', () => {
    test('should never return NaN for any malformed input', () => {
      const testCases = [
        '#gggggg', '#@@@###', '#xyz123', '###',
        '#ff00zz', '#zzzzzz', 'invalid', 'rgb(255,0,0)',
        '!@#$%^', '', '#', '##', '#####',
        'notahex', '123456', 'abcdefg',
        '#12345', '#1234567', '#12',
        'hsl(0,0%,0%)', 'transparent', 'inherit'
      ];

      testCases.forEach(testCase => {
        const result = hexToRgb(testCase);

        // Verify result structure
        expect(result.length).toBe(3);

        // Verify no NaN values
        expect(result.every(v => !isNaN(v))).toBe(true);

        // Verify all values are numbers
        expect(result.every(v => typeof v === 'number')).toBe(true);

        // Verify all values are in valid range
        expect(result.every(v => v >= 0 && v <= 255)).toBe(true);
      });
    });
  });

  describe('Regression Tests - Valid Inputs Still Work', () => {
    test('should maintain backward compatibility with valid inputs', () => {
      const validInputs = [
        { input: '#123456', expected: [18, 52, 86] },
        { input: '#abc', expected: [170, 187, 204] },
        { input: 'ff00ff', expected: [255, 0, 255] },
        { input: '#000', expected: [0, 0, 0] },
        { input: '#fff', expected: [255, 255, 255] }
      ];

      validInputs.forEach(({ input, expected }) => {
        expect(hexToRgb(input)).toEqual(expected);
      });
    });
  });
});

describe('Integration Tests - hexToRgb in Color Processing Pipeline', () => {
  test('should safely handle hex input in color processor', () => {
    // Test that malformed hex doesn't crash the color processor
    expect(() => {
      // This would previously cause NaN to propagate through the system
      const rgb = hexToRgb('#invalid');
      expect(rgb).toEqual([0, 0, 0]);
    }).not.toThrow();
  });

  test('should prevent NaN from propagating to ANSI codes', () => {
    const { rgb } = require('../../src/core/ansi');

    // Get RGB from malformed hex
    const [r, g, b] = hexToRgb('#gggggg');

    // Should not produce ANSI codes with NaN
    const ansiCode = rgb(r, g, b);
    expect(ansiCode).toBe('38;2;0;0;0');
    expect(ansiCode).not.toContain('NaN');
  });
});
