import { Style } from '../styles/style';
import { ColorValue, RGB } from '../types';

interface CacheEntry<T> {
  value: T;
  hits: number;
  lastAccess: number;
  size: number;
}

export class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private accessOrder: K[] = [];
  private currentSize = 0;

  constructor(
    private maxSize: number,
    private sizeCalculator: (value: V) => number = () => 1
  ) {}

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Update access order
    this.updateAccessOrder(key);
    entry.hits++;
    entry.lastAccess = Date.now();

    return entry.value;
  }

  set(key: K, value: V): void {
    const size = this.sizeCalculator(value);
    
    // Remove existing entry if present
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.currentSize -= oldEntry.size;
    }

    // Evict entries if necessary
    while (this.currentSize + size > this.maxSize && this.accessOrder.length > 0) {
      this.evictLRU();
    }

    // Add new entry
    this.cache.set(key, {
      value,
      hits: 0,
      lastAccess: Date.now(),
      size
    });
    this.updateAccessOrder(key);
    this.currentSize += size;
  }

  private updateAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    const key = this.accessOrder.shift();
    if (key !== undefined) {
      const entry = this.cache.get(key);
      if (entry) {
        this.currentSize -= entry.size;
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.currentSize = 0;
  }

  get stats() {
    const entries = Array.from(this.cache.entries());
    const totalHits = entries.reduce((sum, [_, entry]) => sum + entry.hits, 0);
    
    return {
      size: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      totalHits,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      entries: entries.map(([key, entry]) => ({
        key,
        hits: entry.hits,
        size: entry.size,
        age: Date.now() - entry.lastAccess
      })).sort((a, b) => b.hits - a.hits).slice(0, 10)
    };
  }
}

export class StyleCache {
  private static instance: StyleCache;
  private styleCache: LRUCache<string, Style>;
  private colorCache: LRUCache<string, RGB>;
  private ansiCache: LRUCache<string, string>;

  private constructor() {
    // Style cache
    this.styleCache = new LRUCache(10000);
    
    // Color conversion cache
    this.colorCache = new LRUCache(5000);
    
    // ANSI sequence cache
    this.ansiCache = new LRUCache(20000, value => value.length);
  }

  static getInstance(): StyleCache {
    if (!StyleCache.instance) {
      StyleCache.instance = new StyleCache();
    }
    return StyleCache.instance;
  }

  getStyle(codes: string[]): Style | undefined {
    const key = this.getStyleKey(codes);
    return this.styleCache.get(key);
  }

  setStyle(codes: string[], style: Style): void {
    const key = this.getStyleKey(codes);
    this.styleCache.set(key, style);
  }

  getColor(input: ColorValue): RGB | undefined {
    const key = this.getColorKey(input);
    return this.colorCache.get(key);
  }

  setColor(input: ColorValue, rgb: RGB): void {
    const key = this.getColorKey(input);
    this.colorCache.set(key, rgb);
  }

  getAnsi(style: Style, text: string): string | undefined {
    // Use style object identity as key since we can't access private codes
    const key = `style:${text}`;
    return this.ansiCache.get(key);
  }

  setAnsi(style: Style, text: string, result: string): void {
    // Use style object identity as key since we can't access private codes
    const key = `style:${text}`;
    this.ansiCache.set(key, result);
  }

  private getStyleKey(codes: string[]): string {
    return codes.sort().join(',');
  }

  private getColorKey(input: ColorValue): string {
    if (typeof input === 'string') return `s:${input}`;
    if (typeof input === 'number') return `n:${input}`;
    if (Array.isArray(input)) return `a:${input.join(',')}`;
    if (typeof input === 'object' && 'r' in input) {
      return `rgb:${input.r},${input.g},${input.b}`;
    }
    return `unknown:${JSON.stringify(input)}`;
  }

  clear(): void {
    this.styleCache.clear();
    this.colorCache.clear();
    this.ansiCache.clear();
  }

  get stats() {
    return {
      style: this.styleCache.stats,
      color: this.colorCache.stats,
      ansi: this.ansiCache.stats
    };
  }
}

// Memoization decorator
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
}

// Batch processing for efficiency
export class BatchProcessor<T, R> {
  private queue: Array<{ item: T; resolve: (value: R) => void; reject: (error: Error) => void }> = [];
  private processing = false;
  private batchTimeout?: NodeJS.Timeout;

  constructor(
    private processor: (items: T[]) => R[],
    private batchSize: number = 100,
    private batchDelay: number = 10
  ) {}

  async process(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      this.scheduleBatch();
    });
  }

  private scheduleBatch(): void {
    if (this.processing) return;

    if (this.queue.length >= this.batchSize) {
      this.processBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.batchDelay);
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = undefined;
    }

    if (this.queue.length === 0 || this.processing) return;

    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      const items = batch.map(b => b.item);
      const results = this.processor(items);

      // Validate that processor returned correct number of results
      if (!Array.isArray(results) || results.length !== batch.length) {
        throw new Error(`Batch processor returned ${results?.length ?? 0} results but expected ${batch.length}`);
      }

      batch.forEach((b, i) => {
        b.resolve(results[i]);
      });
    } catch (error) {
      // Reject all promises in the batch with proper error handling
      batch.forEach(b => {
        b.reject(error instanceof Error ? error : new Error(String(error)));
      });
    } finally {
      this.processing = false;
      
      // Process next batch if queue is not empty
      if (this.queue.length > 0) {
        this.scheduleBatch();
      }
    }
  }

  flush(): Promise<void> {
    return new Promise((resolve) => {
      if (this.queue.length === 0) {
        resolve();
        return;
      }

      const checkComplete = () => {
        if (this.queue.length === 0 && !this.processing) {
          resolve();
        } else {
          setTimeout(checkComplete, 10);
        }
      };

      this.processBatch();
      checkComplete();
    });
  }
}