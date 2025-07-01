/**
 * Object Pool for Style instances
 * Reduces garbage collection pressure by reusing Style objects
 */

import { Style } from '../styles/style';

export class StylePool {
  private static pool: Style[] = [];
  private static maxSize = 100;
  private static created = 0;
  private static reused = 0;

  /**
   * Acquire a Style instance from the pool or create a new one
   */
  static acquire(): Style {
    if (this.pool.length > 0) {
      const style = this.pool.pop()!;
      this.reused++;
      return style;
    }

    this.created++;
    return new Style();
  }

  /**
   * Release a Style instance back to the pool
   */
  static release(style: Style): void {
    if (this.pool.length >= this.maxSize) {
      return; // Pool is full, let GC handle it
    }

    // Reset the style to a clean state
    try {
      // We'll need to add a reset method to Style class
      if ('reset' in style && typeof (style as any).reset === 'function') {
        (style as any).reset();
      }
      this.pool.push(style);
    } catch (error) {
      // If reset fails, don't add to pool
    }
  }

  /**
   * Set the maximum pool size
   */
  static setMaxSize(size: number): void {
    if (size < 0) {
      throw new Error('Pool size must be non-negative');
    }
    
    this.maxSize = size;
    
    // Trim pool if necessary
    while (this.pool.length > size) {
      this.pool.pop();
    }
  }

  /**
   * Clear the entire pool
   */
  static clear(): void {
    this.pool.length = 0;
  }

  /**
   * Get pool statistics
   */
  static getStats() {
    return {
      poolSize: this.pool.length,
      maxSize: this.maxSize,
      created: this.created,
      reused: this.reused,
      reuseRatio: this.created > 0 ? this.reused / (this.created + this.reused) : 0
    };
  }

  /**
   * Reset statistics
   */
  static resetStats(): void {
    this.created = 0;
    this.reused = 0;
  }
}

/**
 * String Builder for efficient string concatenation
 * Alternative to repeated string concatenation which creates many temporary strings
 */
export class StringBuilder {
  private parts: string[] = [];
  private length = 0;

  /**
   * Append a string to the builder
   */
  append(str: string): this {
    if (str) {
      this.parts.push(str);
      this.length += str.length;
    }
    return this;
  }

  /**
   * Append multiple strings
   */
  appendAll(...strings: string[]): this {
    for (const str of strings) {
      this.append(str);
    }
    return this;
  }

  /**
   * Prepend a string to the builder
   */
  prepend(str: string): this {
    if (str) {
      this.parts.unshift(str);
      this.length += str.length;
    }
    return this;
  }

  /**
   * Insert a string at a specific position
   */
  insert(index: number, str: string): this {
    if (str && index >= 0 && index <= this.parts.length) {
      this.parts.splice(index, 0, str);
      this.length += str.length;
    }
    return this;
  }

  /**
   * Get the current length
   */
  getLength(): number {
    return this.length;
  }

  /**
   * Check if the builder is empty
   */
  isEmpty(): boolean {
    return this.length === 0;
  }

  /**
   * Clear the builder
   */
  clear(): this {
    this.parts.length = 0;
    this.length = 0;
    return this;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.parts.join('');
  }

  /**
   * Convert to string and clear the builder
   */
  toStringAndClear(): string {
    const result = this.toString();
    this.clear();
    return result;
  }
}

/**
 * Performance-optimized string formatter
 * Uses string builders and object pooling for better performance
 */
export class PerformantFormatter {
  private static builderPool: StringBuilder[] = [];
  private static maxBuilders = 50;

  /**
   * Get a StringBuilder from the pool
   */
  static acquireBuilder(): StringBuilder {
    return this.builderPool.pop() || new StringBuilder();
  }

  /**
   * Return a StringBuilder to the pool
   */
  static releaseBuilder(builder: StringBuilder): void {
    if (this.builderPool.length < this.maxBuilders) {
      builder.clear();
      this.builderPool.push(builder);
    }
  }

  /**
   * Format a string using a builder for performance
   */
  static format(template: string, replacements: Record<string, string>): string {
    if (!template || Object.keys(replacements).length === 0) {
      return template;
    }

    const builder = this.acquireBuilder();
    let lastIndex = 0;

    // Find all placeholders and replace them
    for (const [key, value] of Object.entries(replacements)) {
      const placeholder = `:${key}`;
      let index = template.indexOf(placeholder, lastIndex);
      
      while (index !== -1) {
        // Append text before placeholder
        if (index > lastIndex) {
          builder.append(template.substring(lastIndex, index));
        }
        
        // Append replacement value
        builder.append(value);
        
        lastIndex = index + placeholder.length;
        index = template.indexOf(placeholder, lastIndex);
      }
    }

    // Append remaining text
    if (lastIndex < template.length) {
      builder.append(template.substring(lastIndex));
    }

    const result = builder.toString();
    this.releaseBuilder(builder);
    
    return result;
  }

  /**
   * Clear all pools
   */
  static clearPools(): void {
    this.builderPool.length = 0;
  }

  /**
   * Get pool statistics
   */
  static getStats() {
    return {
      builderPoolSize: this.builderPool.length,
      maxBuilders: this.maxBuilders
    };
  }
}