/**
 * Optimized LRU Cache implementation using Map for O(1) operations
 */

export class LRUCacheOptimized<K, V> {
  private cache = new Map<K, V>();
  private readonly capacity: number;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('Cache capacity must be positive');
    }
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // If key exists, delete it first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    // Add to end (most recently used)
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  getSize(): number {
    return this.cache.size;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  values(): V[] {
    return Array.from(this.cache.values());
  }

  entries(): Array<[K, V]> {
    return Array.from(this.cache.entries());
  }

  forEach(callback: (value: V, key: K, map: Map<K, V>) => void): void {
    this.cache.forEach(callback);
  }
}

/**
 * Create a memoized version of a function with optimized LRU caching
 */
export function memoizeOptimized<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  options: {
    capacity?: number;
    keyGenerator?: (...args: Args) => string;
  } = {}
): (...args: Args) => Return {
  const cache = new LRUCacheOptimized<string, Return>(options.capacity || 100);
  const keyGen = options.keyGenerator || ((...args) => JSON.stringify(args));

  return (...args: Args): Return => {
    const key = keyGen(...args);
    
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}