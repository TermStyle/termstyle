/**
 * Global Resource Manager for tracking and disposing resources
 * Prevents memory leaks by ensuring all resources are properly cleaned up
 */

export interface Disposable {
  dispose(): void;
}

export class ResourceManager {
  private static resources = new Set<Disposable>();
  private static initialized = false;
  private static isDisposing = false;

  static register(resource: Disposable): void {
    this.ensureInitialized();
    this.resources.add(resource);
  }

  static unregister(resource: Disposable): void {
    this.resources.delete(resource);
  }

  static disposeAll(): void {
    // Atomic check-and-set to prevent race conditions
    const wasDisposing = this.isDisposing;
    this.isDisposing = true;
    
    // If already disposing, wait and return
    if (wasDisposing) return;
    
    const resources = Array.from(this.resources);
    this.resources.clear();
    
    // Dispose resources with error isolation
    for (const resource of resources) {
      try {
        resource.dispose();
      } catch (error) {
        // Log error but continue cleanup to prevent cascading failures
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('Error disposing resource:', error);
        }
      }
    }
    
    this.isDisposing = false;
  }

  static getResourceCount(): number {
    return this.resources.size;
  }

  private static ensureInitialized(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Set up process exit handlers only once
    const cleanup = () => {
      this.disposeAll();
    };

    // Create cleanup handler that ensures single execution
    let cleanupExecuted = false;
    const safeCleanup = () => {
      if (!cleanupExecuted) {
        cleanupExecuted = true;
        cleanup();
      }
    };

    // Increase listener limit to prevent warnings
    if (typeof process !== 'undefined' && process.setMaxListeners) {
      const currentMax = process.getMaxListeners();
      if (currentMax < 20) {
        process.setMaxListeners(20);
      }
    }

    // Register cleanup handlers with safe wrapper
    if (typeof process !== 'undefined') {
      process.once('exit', safeCleanup);
      process.once('SIGINT', safeCleanup);
      process.once('SIGTERM', safeCleanup);
      process.once('uncaughtException', (error) => {
        console.error('Uncaught exception:', error);
        safeCleanup();
      });
      process.once('unhandledRejection', (reason) => {
        console.error('Unhandled rejection:', reason);
        safeCleanup();
      });
    }
  }
}

/**
 * Helper decorator for auto-registering disposable classes
 */
export function autoDispose<T extends new (...args: any[]) => Disposable>(
  constructor: T
) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);
      ResourceManager.register(this);
    }

    dispose(): void {
      ResourceManager.unregister(this);
      super.dispose();
    }
  };
}

/**
 * Utility for creating disposable resources with automatic cleanup
 */
export function createDisposable<T>(
  resource: T,
  disposeFn: (resource: T) => void
): Disposable & { resource: T } {
  const disposable = {
    resource,
    dispose(): void {
      try {
        disposeFn(resource);
      } catch (error) {
        console.warn('Error in dispose function:', error);
      }
    }
  };

  ResourceManager.register(disposable);
  return disposable;
}