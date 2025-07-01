/**
 * Custom Error Classes for TermStyle
 * Provides detailed error information with error codes
 */

export enum ErrorCode {
  // Input validation errors (1000-1999)
  INVALID_COLOR_INPUT = 1001,
  INVALID_PERCENT_VALUE = 1002,
  INVALID_ANIMATION_TYPE = 1003,
  INVALID_TEXT_INPUT = 1004,
  INVALID_NUMBER_INPUT = 1005,
  INVALID_ARRAY_INPUT = 1006,
  
  // Terminal errors (2000-2999)
  TERMINAL_NOT_SUPPORTED = 2001,
  TERMINAL_NO_COLOR = 2002,
  TERMINAL_DETECTION_FAILED = 2003,
  
  // Resource errors (3000-3999)
  RESOURCE_ALREADY_DISPOSED = 3001,
  RESOURCE_CLEANUP_FAILED = 3002,
  RESOURCE_NOT_FOUND = 3003,
  
  // Animation errors (4000-4999)
  ANIMATION_ALREADY_STARTED = 4001,
  ANIMATION_NOT_STARTED = 4002,
  ANIMATION_FRAME_ERROR = 4003,
  
  // Configuration errors (5000-5999)
  CONFIG_INVALID_OPTION = 5001,
  CONFIG_MISSING_REQUIRED = 5002,
  
  // System errors (9000-9999)
  INTERNAL_ERROR = 9001,
  OUT_OF_MEMORY = 9002,
  OPERATION_TIMEOUT = 9003
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: Error;
  suggestions?: string[];
}

/**
 * Base class for all TermStyle errors
 */
export class TermStyleError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: Error;
  public readonly suggestions?: string[];
  public readonly timestamp: Date;

  constructor(errorDetails: ErrorDetails) {
    super(errorDetails.message);
    this.name = this.constructor.name;
    this.code = errorDetails.code;
    this.details = errorDetails.details;
    this.cause = errorDetails.cause;
    this.suggestions = errorDetails.suggestions;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Include cause in stack trace if available
    if (this.cause && this.cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${this.cause.stack}`;
    }
  }

  /**
   * Get a formatted error message with all details
   */
  getFullMessage(): string {
    let message = `[${this.code}] ${this.message}`;
    
    if (this.details && Object.keys(this.details).length > 0) {
      message += `\nDetails: ${JSON.stringify(this.details, null, 2)}`;
    }
    
    if (this.suggestions && this.suggestions.length > 0) {
      message += `\nSuggestions:\n${this.suggestions.map(s => `  - ${s}`).join('\n')}`;
    }
    
    return message;
  }

  /**
   * Convert error to JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      suggestions: this.suggestions,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
}

/**
 * Input validation error
 */
export class ValidationError extends TermStyleError {
  constructor(message: string, code: ErrorCode, details?: Record<string, unknown>) {
    super({
      code,
      message,
      details,
      suggestions: [
        'Check the input format and type',
        'Refer to the documentation for valid input values',
        'Use the validation methods before passing values'
      ]
    });
  }
}

/**
 * Terminal compatibility error
 */
export class TerminalError extends TermStyleError {
  constructor(message: string, code: ErrorCode = ErrorCode.TERMINAL_NOT_SUPPORTED) {
    const suggestions = [];
    
    if (code === ErrorCode.TERMINAL_NO_COLOR) {
      suggestions.push(
        'Set FORCE_COLOR=1 environment variable to force color output',
        'Use a terminal that supports colors',
        'Check if NO_COLOR environment variable is set'
      );
    } else {
      suggestions.push(
        'Try using a different terminal emulator',
        'Update your terminal to the latest version',
        'Check terminal compatibility in the documentation'
      );
    }

    super({
      code,
      message,
      suggestions
    });
  }
}

/**
 * Resource management error
 */
export class ResourceError extends TermStyleError {
  constructor(message: string, code: ErrorCode = ErrorCode.RESOURCE_CLEANUP_FAILED, cause?: Error) {
    super({
      code,
      message,
      cause,
      suggestions: [
        'Ensure resources are disposed in the correct order',
        'Check for circular dependencies in resources',
        'Use try-finally blocks for resource cleanup'
      ]
    });
  }
}

/**
 * Animation error
 */
export class AnimationError extends TermStyleError {
  constructor(message: string, code: ErrorCode = ErrorCode.ANIMATION_FRAME_ERROR, details?: Record<string, unknown>) {
    super({
      code,
      message,
      details,
      suggestions: [
        'Check if the animation is already running',
        'Ensure the animation type is valid',
        'Verify terminal supports cursor manipulation'
      ]
    });
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends TermStyleError {
  constructor(message: string, code: ErrorCode = ErrorCode.CONFIG_INVALID_OPTION, details?: Record<string, unknown>) {
    super({
      code,
      message,
      details,
      suggestions: [
        'Review the configuration options',
        'Check for typos in option names',
        'Ensure all required options are provided'
      ]
    });
  }
}

/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  /**
   * Attempt to recover from an error with a fallback
   */
  static recover<T>(
    operation: () => T,
    fallback: T | (() => T),
    logError: boolean = false
  ): T {
    try {
      return operation();
    } catch (error) {
      if (logError && process.env.DEBUG) {
        console.error('[TermStyle] Error recovered:', error);
      }
      return typeof fallback === 'function' ? (fallback as () => T)() : fallback;
    }
  }

  /**
   * Retry an operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelay: number = 100
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxAttempts - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new TermStyleError({
      code: ErrorCode.OPERATION_TIMEOUT,
      message: `Operation failed after ${maxAttempts} attempts`,
      cause: lastError,
      details: { maxAttempts, initialDelay }
    });
  }

  /**
   * Wrap a function with error boundary
   */
  static withErrorBoundary<T extends (...args: any[]) => any>(
    fn: T,
    errorHandler: (error: Error) => ReturnType<T> | void
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args);
      } catch (error) {
        const result = errorHandler(error as Error);
        if (result !== undefined) {
          return result;
        }
        throw error;
      }
    }) as T;
  }

  /**
   * Create a safe version of a function that never throws
   */
  static makeSafe<T extends (...args: any[]) => any>(
    fn: T,
    defaultValue: ReturnType<T>
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args);
      } catch {
        return defaultValue;
      }
    }) as T;
  }
}

/**
 * Error context for better debugging
 */
export class ErrorContext {
  private static context: Map<string, unknown> = new Map();

  /**
   * Add context that will be included in errors
   */
  static add(key: string, value: unknown): void {
    this.context.set(key, value);
  }

  /**
   * Remove context
   */
  static remove(key: string): void {
    this.context.delete(key);
  }

  /**
   * Get all context
   */
  static getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this.context) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Clear all context
   */
  static clear(): void {
    this.context.clear();
  }

  /**
   * Run a function with temporary context
   */
  static withContext<T>(
    context: Record<string, unknown>,
    fn: () => T
  ): T {
    const keys = Object.keys(context);
    
    // Add temporary context
    for (const key of keys) {
      this.add(key, context[key]);
    }
    
    try {
      return fn();
    } finally {
      // Remove temporary context
      for (const key of keys) {
        this.remove(key);
      }
    }
  }
}