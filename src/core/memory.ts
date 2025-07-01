import { Style } from '../styles/style';

interface Poolable {
  reset(): void;
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private inUse = new WeakSet<T>();
  private created = 0;
  
  constructor(
    private factory: () => T,
    private maxSize: number = 1000,
    private initialSize: number = 100
  ) {
    this.preallocate();
  }

  private preallocate(): void {
    for (let i = 0; i < this.initialSize; i++) {
      this.pool.push(this.factory());
    }
    this.created = this.initialSize;
  }

  acquire(): T {
    let obj = this.pool.pop();
    
    if (!obj) {
      obj = this.factory();
      this.created++;
    }
    
    this.inUse.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (!this.inUse.has(obj)) {
      // Silently ignore attempts to release objects not from this pool
      return;
    }
    
    this.inUse.delete(obj);
    obj.reset();
    
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool.length = 0;
    this.created = 0;
  }

  get stats() {
    return {
      poolSize: this.pool.length,
      totalCreated: this.created,
      maxSize: this.maxSize
    };
  }
}

// Create interface for Style that includes our needed methods
interface PoolableStyle {
  getCodes(): string[];
  setCodes(codes: string[]): void;
  reset(): void;
  format(text: string): string;
}

export class StylePool {
  private static instance: StylePool;
  private pool: ObjectPool<PoolableStyle>;
  private styleCache = new Map<string, PoolableStyle>();
  private lru = new Set<string>();
  private maxCacheSize = 10000;

  private constructor() {
    this.pool = new ObjectPool(
      () => {
        const baseStyle = new Style([]);
        const style = baseStyle as Style & PoolableStyle & { _codes?: string[]; _open?: string; _close?: string };
        
        // Ensure the style has the required methods
        if (!style.setCodes) {
          style.setCodes = function(codes: string[]) {
            this._codes = codes;
            this._open = undefined;
            this._close = undefined;
          };
        }
        if (!style.getCodes) {
          style.getCodes = function() {
            return this._codes || [];
          };
        }
        if (!style.reset) {
          style.reset = function() {
            this._codes = [];
            this._open = undefined;
            this._close = undefined;
          };
        }
        if (!style.format) {
          style.format = function(text: string) {
            const codes = this._codes || [];
            if (codes.length === 0) return text;
            return `\x1b[${codes.join(';')}m${text}\x1b[0m`;
          };
        }
        return style;
      },
      2000,
      200
    );
  }

  static getInstance(): StylePool {
    if (!StylePool.instance) {
      StylePool.instance = new StylePool();
    }
    return StylePool.instance;
  }

  acquire(codes: string[]): PoolableStyle {
    const key = codes.sort().join(',');
    
    // Check cache first
    const cached = this.styleCache.get(key);
    if (cached) {
      this.updateLRU(key);
      return cached;
    }
    
    // Get from pool
    const style = this.pool.acquire();
    style.setCodes(codes);
    
    // Add to cache
    this.addToCache(key, style);
    
    return style;
  }

  release(style: PoolableStyle): void {
    // Remove from cache if present
    const key = style.getCodes().sort().join(',');
    this.styleCache.delete(key);
    this.lru.delete(key);
    
    // Return to pool
    this.pool.release(style);
  }

  private updateLRU(key: string): void {
    this.lru.delete(key);
    this.lru.add(key);
  }

  private addToCache(key: string, style: PoolableStyle): void {
    // Implement proper LRU eviction with size limits
    while (this.styleCache.size >= this.maxCacheSize) {
      // Evict oldest entry
      const oldest = this.lru.values().next().value;
      if (oldest !== undefined) {
        const oldStyle = this.styleCache.get(oldest);
        if (oldStyle) {
          this.styleCache.delete(oldest);
          this.lru.delete(oldest);
          this.pool.release(oldStyle);
        }
      } else {
        // Fallback: clear entire cache if LRU is corrupted
        this.clearCache();
        break;
      }
    }
    
    this.styleCache.set(key, style);
    this.lru.add(key);
  }

  clearCache(): void {
    for (const style of this.styleCache.values()) {
      this.pool.release(style);
    }
    this.styleCache.clear();
    this.lru.clear();
  }

  get stats() {
    return {
      cacheSize: this.styleCache.size,
      poolStats: this.pool.stats
    };
  }
}

// Resource cleanup manager
export class ResourceManager {
  private intervals = new Set<NodeJS.Timeout>();
  private timeouts = new Set<NodeJS.Timeout>();
  private streams = new Set<NodeJS.WriteStream>();

  addInterval(interval: NodeJS.Timeout): void {
    this.intervals.add(interval);
  }

  addTimeout(timeout: NodeJS.Timeout): void {
    this.timeouts.add(timeout);
  }

  addStream(stream: NodeJS.WriteStream): void {
    this.streams.add(stream);
  }

  removeInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  removeTimeout(timeout: NodeJS.Timeout): void {
    clearTimeout(timeout);
    this.timeouts.delete(timeout);
  }

  removeStream(stream: NodeJS.WriteStream): void {
    if (!stream.destroyed) {
      stream.end();
    }
    this.streams.delete(stream);
  }

  cleanup(): void {
    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();

    // Clear all timeouts
    for (const timeout of this.timeouts) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();

    // Close all streams
    for (const stream of this.streams) {
      if (!stream.destroyed) {
        stream.end();
      }
    }
    this.streams.clear();
  }
}

// Global resource manager instance
export const resourceManager = new ResourceManager();

// Track if handlers are registered to avoid duplicates
let handlersRegistered = false;

// Register cleanup handlers only once
if (!handlersRegistered && typeof process !== 'undefined' && typeof process.on === 'function') {
  handlersRegistered = true;
  
  const cleanup = () => {
    resourceManager.cleanup();
    StylePool.getInstance().clearCache();
  };

  process.once('exit', cleanup);
  
  process.once('SIGINT', () => {
    cleanup();
    process.exit(0);
  });

  process.once('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
}