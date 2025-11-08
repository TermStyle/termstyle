/**
 * Safe utility functions for preventing runtime errors
 * Provides bounds checking, error recovery, and safe operations
 */

/**
 * Safe division that prevents division by zero and handles edge cases
 */
export function safeDivide(a: number, b: number, defaultValue = 0): number {
  if (b === 0 || !isFinite(b) || !isFinite(a)) {
    return defaultValue;
  }
  const result = a / b;
  return isFinite(result) ? result : defaultValue;
}

/**
 * Safe substring with bounds checking
 */
export function safeSubstring(str: string, start: number, end?: number): string {
  if (!str || typeof str !== 'string') return '';
  
  const len = str.length;
  const safeStart = Math.max(0, Math.min(start, len));
  
  if (end === undefined) {
    return str.substring(safeStart);
  }
  
  const safeEnd = Math.max(safeStart, Math.min(end, len));
  return str.substring(safeStart, safeEnd);
}

/**
 * Safe array access with bounds checking
 */
export function safeArrayAccess<T>(array: T[], index: number, defaultValue?: T): T | undefined {
  if (!Array.isArray(array) || index < 0 || index >= array.length) {
    return defaultValue;
  }
  return array[index];
}

/**
 * Safe number parsing with fallback
 */
export function safeParseInt(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number' && isFinite(value)) {
    return Math.floor(value);
  }
  
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isFinite(parsed) ? parsed : defaultValue;
  }
  
  return defaultValue;
}

/**
 * Safe float parsing with fallback
 */
export function safeParseFloat(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number' && isFinite(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isFinite(parsed) ? parsed : defaultValue;
  }
  
  return defaultValue;
}

/**
 * Safe execution wrapper with error recovery
 */
export function safeExecute<T>(
  operation: () => T,
  fallback: T,
  errorHandler?: (error: Error) => void
): T {
  try {
    return operation();
  } catch (error) {
    if (errorHandler) {
      try {
        errorHandler(error as Error);
      } catch (handlerError) {
        // Log handler errors but don't propagate to prevent cascading failures
        if (typeof console !== 'undefined' && console.error) {
          console.error('Error in error handler:', handlerError);
        }
      }
    }
    return fallback;
  }
}

/**
 * Safe async execution wrapper
 */
export async function safeExecuteAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorHandler?: (error: Error) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (errorHandler) {
      try {
        errorHandler(error as Error);
      } catch (handlerError) {
        // Log handler errors but don't propagate
        if (typeof console !== 'undefined' && console.error) {
          console.error('Error in async error handler:', handlerError);
        }
      }
    }
    return fallback;
  }
}

/**
 * Clamp number to range
 */
export function clamp(value: number, min: number, max: number): number {
  if (!isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Safe object property access
 */
export function safeGet<T>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T | undefined {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  const keys = Array.isArray(path) ? path : path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }

  return current;
}

/**
 * Debounce function to prevent excessive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Throttle function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}