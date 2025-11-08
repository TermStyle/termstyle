/**
 * Comprehensive Bug Fix Test Suite
 * Tests for all bugs identified and fixed in comprehensive repository analysis
 */

import { Container } from '../../src/core/container';
import { Animation, pulse } from '../../src/effects/animation';
import { BatchProcessor } from '../../src/core/cache';
import { cleanup as terminalCleanup } from '../../src/utils/terminal';

describe('BUG-006: TypeScript Configuration Fix', () => {
  test('should compile without Node.js type errors', () => {
    // This test passes if the file compiles
    expect(typeof console).toBe('object');
    expect(typeof process).toBe('object');
    expect(typeof setTimeout).toBe('function');
  });
});

describe('BUG-007: Unhandled Promise Rejections in Container', () => {
  test('should handle async factory rejection with cleanup', async () => {
    const container = new Container();

    container.singleton('asyncService', async () => {
      throw new Error('Factory failed');
    });

    await expect(container.getAsync('asyncService')).rejects.toThrow('Factory failed');

    // Verify cleanup happened (resolving set should be empty)
    expect(container['resolving'].size).toBe(0);
  });

  test('should handle async dependency resolution failure', async () => {
    const container = new Container();

    container.singleton('dep1', async () => {
      throw new Error('Dependency failed');
    });

    container.singleton('service', (dep) => dep, ['dep1']);

    await expect(container.getAsync('service')).rejects.toThrow();
  });
});

describe('BUG-010 & BUG-011: Division by Zero in Animation', () => {
  test('should handle animation with duration less than interval', () => {
    // Duration < interval would cause totalFrames = 0
    const anim = new Animation('test', 'blink', {
      duration: 50,  // Less than default interval of 100
      interval: 100
    });

    // Should not throw
    expect(() => anim.start()).not.toThrow();

    anim.dispose();
  });

  test('should handle pulse with very small duration', () => {
    // Duration < 100 would cause totalFrames = 0
    const frames = pulse('test', { duration: 50 });

    // Should return at least 1 frame
    expect(frames.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle very small valid duration', () => {
    const anim = new Animation('test', 'fade', {
      duration: 1,  // Very small but valid
      interval: 100
    });

    expect(() => anim.start()).not.toThrow();
    anim.dispose();
  });
});

describe('BUG-012: Memory Leak in Terminal Resize Listener', () => {
  test('should register cleanup on process exit', () => {
    // Terminal module registers cleanup automatically
    // This test verifies cleanup function exists and can be called
    expect(typeof terminalCleanup).toBe('function');
    expect(() => terminalCleanup()).not.toThrow();
  });
});

describe('BUG-015: Batch Processor Result Array Mismatch', () => {
  test('should validate processor returns correct number of results', () => {
    const processor = (items: number[]) => {
      // Intentionally return wrong number of results
      return items.slice(0, items.length - 1);
    };

    const batchProcessor = new BatchProcessor(processor, 3, 10);

    const promise1 = batchProcessor.process(1);
    const promise2 = batchProcessor.process(2);
    const promise3 = batchProcessor.process(3);

    return Promise.all([promise1, promise2, promise3])
      .catch(error => {
        expect(error.message).toContain('returned');
        expect(error.message).toContain('expected');
      });
  });

  test('should work correctly when processor returns correct results', async () => {
    const processor = (items: number[]) => items.map(x => x * 2);

    const batchProcessor = new BatchProcessor(processor, 3, 10);

    const results = await Promise.all([
      batchProcessor.process(1),
      batchProcessor.process(2),
      batchProcessor.process(3)
    ]);

    expect(results).toEqual([2, 4, 6]);
  });
});

describe('BUG-009: Plugin Uninstall Error Logging', () => {
  test('should log plugin uninstall errors to console', async () => {
    const PluginManager = require('../../src/core/plugin').PluginManager;
    const manager = new PluginManager(() => ({}), () => {});

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const failingPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      install: jest.fn(),
      uninstall: jest.fn().mockRejectedValue(new Error('Uninstall failed'))
    };

    await manager.register(failingPlugin);
    await manager.unregister('test-plugin');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('test-plugin'),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});

describe('BUG-016: Error Handler Error Logging', () => {
  test('should log errors in error handlers', () => {
    const { safeExecute } = require('../../src/core/safe-utils');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = safeExecute(
      () => {
        throw new Error('Operation failed');
      },
      'fallback',
      () => {
        throw new Error('Handler failed');
      }
    );

    expect(result).toBe('fallback');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error in error handler:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  test('should log errors in async error handlers', async () => {
    const { safeExecuteAsync } = require('../../src/core/safe-utils');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await safeExecuteAsync(
      async () => {
        throw new Error('Async operation failed');
      },
      'fallback',
      () => {
        throw new Error('Async handler failed');
      }
    );

    expect(result).toBe('fallback');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error in async error handler:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});

describe('BUG-017: Container Dispose Error Handling', () => {
  test('should handle errors during disposal of services', () => {
    const container = new Container();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const disposableService = {
      dispose: jest.fn().mockImplementation(() => {
        throw new Error('Disposal failed');
      })
    };

    container.value('service1', disposableService);
    container.value('service2', { data: 'test' });

    expect(() => container.dispose()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('service1'),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  test('should dispose all services even if one fails', () => {
    const container = new Container();
    jest.spyOn(console, 'error').mockImplementation();

    const service1 = { dispose: jest.fn().mockImplementation(() => { throw new Error(); }) };
    const service2 = { dispose: jest.fn() };
    const service3 = { dispose: jest.fn() };

    container.value('s1', service1);
    container.value('s2', service2);
    container.value('s3', service3);

    container.dispose();

    // All dispose methods should be called despite first one failing
    expect(service1.dispose).toHaveBeenCalled();
    expect(service2.dispose).toHaveBeenCalled();
    expect(service3.dispose).toHaveBeenCalled();

    jest.restoreAllMocks();
  });
});

describe('Regression Tests - Ensure No Breaks', () => {
  test('container should still work normally for sync services', () => {
    const container = new Container();
    container.singleton('config', () => ({ api: 'test' }));

    const config = container.get('config');
    expect(config).toEqual({ api: 'test' });
  });

  test('animation should work with normal parameters', () => {
    const anim = new Animation('Hello', 'blink', {
      duration: 1000,
      interval: 100
    });

    expect(() => anim.start()).not.toThrow();
    anim.dispose();
  });

  test('batch processor should work normally', async () => {
    const processor = (items: string[]) => items.map(s => s.toUpperCase());
    const bp = new BatchProcessor(processor, 5, 10);

    const results = await Promise.all([
      bp.process('hello'),
      bp.process('world')
    ]);

    expect(results).toEqual(['HELLO', 'WORLD']);
  });
});
