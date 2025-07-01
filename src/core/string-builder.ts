/**
 * High-performance StringBuilder for efficient string concatenation
 * Avoids the O(n²) complexity of repeated string concatenation
 */

export class StringBuilder {
  private chunks: string[] = [];
  private _length = 0;
  
  constructor(initial?: string) {
    if (initial) {
      this.append(initial);
    }
  }
  
  append(value: string | number): StringBuilder {
    if (typeof value === 'number') {
      const str = String(value);
      this.chunks.push(str);
      this._length += str.length;
    } else if (value.length > 0) {
      this.chunks.push(value);
      this._length += value.length;
    }
    return this;
  }
  
  appendLine(str: string = ''): StringBuilder {
    return this.append(str + '\n');
  }
  
  prepend(str: string): StringBuilder {
    if (str.length > 0) {
      this.chunks.unshift(str);
      this._length += str.length;
    }
    return this;
  }
  
  insert(index: number, str: string): StringBuilder {
    if (index < 0 || index > this._length) {
      throw new RangeError('Index out of bounds');
    }
    
    if (index === 0) {
      return this.prepend(str);
    }
    
    if (index === this._length) {
      return this.append(str);
    }
    
    // For insertion in the middle, we need to rebuild
    const current = this.toString();
    this.clear();
    this.append(current.slice(0, index));
    this.append(str);
    this.append(current.slice(index));
    
    return this;
  }
  
  clear(): StringBuilder {
    this.chunks = [];
    this._length = 0;
    return this;
  }
  
  toString(): string {
    // Join is much faster than repeated concatenation
    return this.chunks.join('');
  }
  
  get length(): number {
    return this._length;
  }
  
  isEmpty(): boolean {
    return this._length === 0;
  }
  
  // Static factory method
  static create(initial?: string): StringBuilder {
    return new StringBuilder(initial);
  }
  
  // Utility method for building ANSI sequences
  static ansi(codes: (string | number)[]): string {
    return `\u001b[${codes.join(';')}m`;
  }
  
  // Performance-optimized method for building styled text
  static styledText(text: string, openCodes: string[], closeCodes: string[]): string {
    if (openCodes.length === 0) return text;
    
    const builder = new StringBuilder();
    
    // Add opening codes
    for (const code of openCodes) {
      builder.append(`\u001b[${code}m`);
    }
    
    // Add text
    builder.append(text);
    
    // Add closing codes in reverse order
    for (let i = closeCodes.length - 1; i >= 0; i--) {
      builder.append(`\u001b[${closeCodes[i]}m`);
    }
    
    return builder.toString();
  }
}

/**
 * Pool of reusable StringBuilder instances to reduce GC pressure
 */
export class StringBuilderPool {
  private static pool: StringBuilder[] = [];
  private static maxPoolSize = 10;
  
  static acquire(initial?: string): StringBuilder {
    const builder = this.pool.pop() || new StringBuilder();
    if (initial) {
      builder.append(initial);
    }
    return builder;
  }
  
  static release(builder: StringBuilder): void {
    if (this.pool.length < this.maxPoolSize) {
      builder.clear();
      this.pool.push(builder);
    }
  }
  
  static withBuilder<T>(fn: (builder: StringBuilder) => T): T {
    const builder = this.acquire();
    try {
      return fn(builder);
    } finally {
      this.release(builder);
    }
  }
}