/**
 * Cache Manager for Performance Optimization
 * Provides centralized caching for expensive operations
 */

import { LRUCacheOptimized } from './lru-cache-optimized';
import { RGBTuple } from './color-processor';
import { Style } from '../styles/style';

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

export class CacheManager {
  private static instance: CacheManager;
  
  // Color conversion caches
  private colorCache: LRUCacheOptimized<string, RGBTuple>;
  private hexCache: LRUCacheOptimized<string, RGBTuple>;
  private hslCache: LRUCacheOptimized<string, RGBTuple>;
  
  // Gradient cache
  private gradientCache: LRUCacheOptimized<string, string>;
  
  // Style cache (for commonly used styles)
  private styleCache: Map<string, Style>;
  
  // Cache statistics
  private stats = {
    color: { hits: 0, misses: 0 },
    gradient: { hits: 0, misses: 0 },
    style: { hits: 0, misses: 0 }
  };
  
  private constructor() {
    // Initialize caches with reasonable sizes
    this.colorCache = new LRUCacheOptimized<string, RGBTuple>(1000);
    this.hexCache = new LRUCacheOptimized<string, RGBTuple>(500);
    this.hslCache = new LRUCacheOptimized<string, RGBTuple>(500);
    this.gradientCache = new LRUCacheOptimized<string, string>(100);
    this.styleCache = new Map<string, Style>();
  }
  
  static getInstance(): CacheManager {
    if (!this.instance) {
      this.instance = new CacheManager();
    }
    return this.instance;
  }
  
  // Color caching methods
  getColor(key: string): RGBTuple | undefined {
    const cached = this.colorCache.get(key);
    if (cached) {
      this.stats.color.hits++;
      return cached;
    }
    this.stats.color.misses++;
    return undefined;
  }
  
  setColor(key: string, value: RGBTuple): void {
    this.colorCache.set(key, value);
  }
  
  getHexColor(hex: string): RGBTuple | undefined {
    const cached = this.hexCache.get(hex);
    if (cached) {
      this.stats.color.hits++;
      return cached;
    }
    this.stats.color.misses++;
    return undefined;
  }
  
  setHexColor(hex: string, value: RGBTuple): void {
    this.hexCache.set(hex, value);
  }
  
  getHslColor(key: string): RGBTuple | undefined {
    const cached = this.hslCache.get(key);
    if (cached) {
      this.stats.color.hits++;
      return cached;
    }
    this.stats.color.misses++;
    return undefined;
  }
  
  setHslColor(key: string, value: RGBTuple): void {
    this.hslCache.set(key, value);
  }
  
  // Gradient caching
  getGradient(key: string): string | undefined {
    const cached = this.gradientCache.get(key);
    if (cached) {
      this.stats.gradient.hits++;
      return cached;
    }
    this.stats.gradient.misses++;
    return undefined;
  }
  
  setGradient(key: string, value: string): void {
    this.gradientCache.set(key, value);
  }
  
  // Style caching for common styles
  getStyle(key: string): Style | undefined {
    const cached = this.styleCache.get(key);
    if (cached) {
      this.stats.style.hits++;
      return cached;
    }
    this.stats.style.misses++;
    return undefined;
  }
  
  setStyle(key: string, value: Style): void {
    // Limit style cache size to prevent memory issues
    if (this.styleCache.size >= 100) {
      const firstKey = this.styleCache.keys().next().value;
      if (firstKey) {
        this.styleCache.delete(firstKey);
      }
    }
    this.styleCache.set(key, value);
  }
  
  // Cache management
  clear(): void {
    this.colorCache.clear();
    this.hexCache.clear();
    this.hslCache.clear();
    this.gradientCache.clear();
    this.styleCache.clear();
    this.resetStats();
  }
  
  clearColors(): void {
    this.colorCache.clear();
    this.hexCache.clear();
    this.hslCache.clear();
  }
  
  clearGradients(): void {
    this.gradientCache.clear();
  }
  
  clearStyles(): void {
    this.styleCache.clear();
  }
  
  // Statistics
  getStats(): Record<string, CacheStats> {
    return {
      color: {
        hits: this.stats.color.hits,
        misses: this.stats.color.misses,
        size: this.colorCache.getSize() + this.hexCache.getSize() + this.hslCache.getSize(),
        maxSize: 2000
      },
      gradient: {
        hits: this.stats.gradient.hits,
        misses: this.stats.gradient.misses,
        size: this.gradientCache.getSize(),
        maxSize: 100
      },
      style: {
        hits: this.stats.style.hits,
        misses: this.stats.style.misses,
        size: this.styleCache.size,
        maxSize: 100
      }
    };
  }
  
  resetStats(): void {
    this.stats = {
      color: { hits: 0, misses: 0 },
      gradient: { hits: 0, misses: 0 },
      style: { hits: 0, misses: 0 }
    };
  }
  
  // Hit rate calculation
  getHitRate(type: 'color' | 'gradient' | 'style'): number {
    const stats = this.stats[type];
    const total = stats.hits + stats.misses;
    return total > 0 ? (stats.hits / total) * 100 : 0;
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();