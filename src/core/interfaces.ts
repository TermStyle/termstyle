/**
 * Core interfaces for API standardization
 * Provides consistent patterns across all effects and components
 */

import { Disposable } from './resource-manager';

/**
 * Standard effect interface for consistent API
 */
export interface Effect<T = any> extends Disposable {
  start(): void;
  stop(): void;
  update(value: T): void;
  dispose(): void;
}

/**
 * Standard error interface for consistent error handling
 */
export class TermStyleError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true,
    public details?: any
  ) {
    super(message);
    this.name = 'TermStyleError';
    
    // Ensure proper error stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TermStyleError);
    }
  }

  /**
   * Create a non-recoverable error
   */
  static fatal(message: string, code: string, details?: any): TermStyleError {
    return new TermStyleError(message, code, false, details);
  }

  /**
   * Create a recoverable error
   */
  static recoverable(message: string, code: string, details?: any): TermStyleError {
    return new TermStyleError(message, code, true, details);
  }

  /**
   * Convert to a plain object for serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      recoverable: this.recoverable,
      details: this.details,
      stack: this.stack
    };
  }
}

/**
 * Error recovery wrapper with consistent error handling
 */
export function withErrorRecovery<T>(
  operation: () => T,
  recovery: (error: TermStyleError) => T,
  errorTransform?: (error: unknown) => TermStyleError
): T {
  try {
    return operation();
  } catch (error) {
    let termStyleError: TermStyleError;
    
    if (error instanceof TermStyleError) {
      termStyleError = error;
    } else if (errorTransform) {
      termStyleError = errorTransform(error);
    } else {
      // Default error transformation
      termStyleError = new TermStyleError(
        error instanceof Error ? error.message : String(error),
        'UNKNOWN_ERROR',
        true,
        error
      );
    }
    
    if (termStyleError.recoverable) {
      return recovery(termStyleError);
    }
    
    throw termStyleError;
  }
}

/**
 * Async error recovery wrapper
 */
export async function withAsyncErrorRecovery<T>(
  operation: () => Promise<T>,
  recovery: (error: TermStyleError) => Promise<T> | T,
  errorTransform?: (error: unknown) => TermStyleError
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    let termStyleError: TermStyleError;
    
    if (error instanceof TermStyleError) {
      termStyleError = error;
    } else if (errorTransform) {
      termStyleError = errorTransform(error);
    } else {
      termStyleError = new TermStyleError(
        error instanceof Error ? error.message : String(error),
        'UNKNOWN_ERROR',
        true,
        error
      );
    }
    
    if (termStyleError.recoverable) {
      return await recovery(termStyleError);
    }
    
    throw termStyleError;
  }
}

/**
 * Strict typing for color inputs
 */
export type RGBTuple = readonly [number, number, number];
export type MutableRGBTuple = [number, number, number];
export type HexColor = `#${string}`;
export type ColorName = string; // Will be validated at runtime
export type ColorInput = ColorName | HexColor | RGBTuple | MutableRGBTuple | number;

/**
 * HSL color interface
 */
export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * Performance measurement interface
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: number;
  operationCount?: number;
}

/**
 * Configuration interface for all components
 */
export interface BaseConfig {
  debug?: boolean;
  performance?: boolean;
  errorRecovery?: boolean;
  memoryOptimization?: boolean;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Plugin interface for extensibility
 */
export interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];
  install(api: any): void;
  uninstall?(): void;
}

/**
 * Event emitter interface for components that need events
 */
export interface EventEmitter<T = any> {
  on(event: string, listener: (data: T) => void): void;
  off(event: string, listener: (data: T) => void): void;
  emit(event: string, data: T): void;
  removeAllListeners(event?: string): void;
}

/**
 * Simple event emitter implementation
 */
export class SimpleEventEmitter<T = any> implements EventEmitter<T> {
  private listeners = new Map<string, Set<(data: T) => void>>();

  on(event: string, listener: (data: T) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: (data: T) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(data);
        } catch (error) {
          // Log error but don't break other listeners
          console.warn(`Error in event listener for '${event}':`, error);
        }
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  getListenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }

  getEventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}