/**
 * Enhanced Test Utilities for Comprehensive Testing
 * Provides tools for testing all aspects of TermStyle functionality
 */

import { PerformanceMetrics } from './interfaces';
import { TerminalInfo } from './types';
import { ResourceManager } from './resource-manager';
import { ColorProcessor } from './color-processor';
import { StylePool } from './style-pool';

/**
 * Mock terminal environment for testing
 */
class MockTerminal {
  private static originalTerminal: TerminalInfo | null = null;
  private mockInfo: TerminalInfo;

  constructor(capabilities: Partial<TerminalInfo> = {}) {
    this.mockInfo = {
      supportsColor: true,
      colorLevel: 3,
      isTTY: true,
      isCI: false,
      width: 80,
      height: 24,
      columns: 80,
      rows: 24,
      supportsUnicode: true,
      supportsEmoji: true,
      terminalApp: 'test',
      platform: 'linux',
      ...capabilities
    };
  }

  /**
   * Apply mock terminal settings
   */
  apply(): void {
    // This would need to integrate with the terminal detection system
    // For now, we'll store the original and provide methods to access mock
  }

  /**
   * Restore original terminal settings
   */
  restore(): void {
    // Restore original terminal info
  }

  /**
   * Get mock terminal info
   */
  getInfo(): TerminalInfo {
    return this.mockInfo;
  }

  /**
   * Update mock capabilities
   */
  updateCapabilities(capabilities: Partial<TerminalInfo>): void {
    this.mockInfo = { ...this.mockInfo, ...capabilities };
  }
}

/**
 * Output capture utility for testing
 */
class OutputCapture {
  private originalWrite: typeof process.stdout.write;
  private capturedOutput: string[] = [];
  private isCapturing = false;

  constructor() {
    this.originalWrite = process.stdout.write.bind(process.stdout);
  }

  /**
   * Start capturing output
   */
  start(): void {
    if (this.isCapturing) return;
    
    this.isCapturing = true;
    this.capturedOutput = [];
    
    process.stdout.write = ((chunk: any, encoding?: any, callback?: any) => {
      if (typeof chunk === 'string') {
        this.capturedOutput.push(chunk);
      } else if (chunk instanceof Buffer) {
        this.capturedOutput.push(chunk.toString());
      }
      
      // Call original callback if provided
      if (typeof encoding === 'function') {
        encoding();
      } else if (typeof callback === 'function') {
        callback();
      }
      
      return true;
    }) as any;
  }

  /**
   * Stop capturing and return captured output
   */
  stop(): string {
    if (!this.isCapturing) return '';
    
    process.stdout.write = this.originalWrite;
    this.isCapturing = false;
    
    const result = this.capturedOutput.join('');
    this.capturedOutput = [];
    return result;
  }

  /**
   * Execute function and capture its output
   */
  capture(fn: () => void): string {
    this.start();
    try {
      fn();
      return this.stop();
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  /**
   * Execute async function and capture its output
   */
  async captureAsync(fn: () => Promise<void>): Promise<string> {
    this.start();
    try {
      await fn();
      return this.stop();
    } catch (error) {
      this.stop();
      throw error;
    }
  }
}

/**
 * Performance measurement utility
 */
class PerformanceMeasurer {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;
  private marks: Map<string, number> = new Map();

  /**
   * Start measuring performance
   */
  start(): void {
    this.startTime = performance.now();
  }

  /**
   * Stop measuring and return duration
   */
  stop(): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    this.metrics.push({
      startTime: this.startTime,
      endTime,
      duration,
      memoryUsage: this.getMemoryUsage()
    });
    
    return duration;
  }

  /**
   * Measure execution time of a function
   */
  measure<T>(fn: () => T, name?: string): { result: T; duration: number } {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (name) {
      this.marks.set(name, duration);
    }
    
    return { result, duration };
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(fn: () => Promise<T>, name?: string): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    if (name) {
      this.marks.set(name, duration);
    }
    
    return { result, duration };
  }

  /**
   * Run benchmark with multiple iterations
   */
  benchmark(fn: () => void, iterations: number = 1000): {
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    opsPerSecond: number;
  } {
    const times: number[] = [];
    let totalTime = 0;
    
    for (let i = 0; i < iterations; i++) {
      const { duration } = this.measure(fn);
      times.push(duration);
      totalTime += duration;
    }
    
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSecond = 1000 / averageTime;
    
    return {
      totalTime,
      averageTime,
      minTime,
      maxTime,
      opsPerSecond
    };
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get marks
   */
  getMarks(): Map<string, number> {
    return new Map(this.marks);
  }

  /**
   * Clear all metrics and marks
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }
}

/**
 * Memory leak detector
 */
class MemoryLeakDetector {
  private initialMemory: number = 0;
  private snapshots: Array<{ time: number; memory: number; description?: string }> = [];

  /**
   * Start monitoring memory
   */
  start(): void {
    this.initialMemory = this.getCurrentMemory();
    this.snapshots = [{ time: Date.now(), memory: this.initialMemory, description: 'start' }];
  }

  /**
   * Take a memory snapshot
   */
  snapshot(description?: string): void {
    const memory = this.getCurrentMemory();
    this.snapshots.push({
      time: Date.now(),
      memory,
      description
    });
  }

  /**
   * Analyze memory usage and detect potential leaks
   */
  analyze(): {
    totalIncrease: number;
    averageIncrease: number;
    potentialLeak: boolean;
    snapshots: Array<{ time: number; memory: number; description?: string }>;
    recommendations: string[];
  } {
    if (this.snapshots.length < 2) {
      throw new Error('Need at least 2 snapshots to analyze');
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const totalIncrease = last.memory - first.memory;
    
    // Calculate average increase per snapshot
    let totalDelta = 0;
    for (let i = 1; i < this.snapshots.length; i++) {
      totalDelta += this.snapshots[i].memory - this.snapshots[i - 1].memory;
    }
    const averageIncrease = totalDelta / (this.snapshots.length - 1);

    // Simple leak detection heuristics
    const potentialLeak = totalIncrease > 10 * 1024 * 1024 || // 10MB increase
                          averageIncrease > 1024 * 1024;      // 1MB average increase

    const recommendations: string[] = [];
    if (potentialLeak) {
      recommendations.push('Potential memory leak detected');
      recommendations.push('Check for unreleased resources (animations, progress bars, etc.)');
      recommendations.push('Ensure dispose() methods are called');
      recommendations.push('Check for event listener leaks');
    }

    // Add specific recommendations based on resource counts
    const resourceStats = ResourceManager.getResourceCount();
    if (resourceStats > 100) {
      recommendations.push(`High resource count: ${resourceStats} active resources`);
    }

    return {
      totalIncrease,
      averageIncrease,
      potentialLeak,
      snapshots: [...this.snapshots],
      recommendations
    };
  }

  private getCurrentMemory(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }
}

/**
 * Test helpers for common scenarios
 */
class TestUtils {
  /**
   * Create a mock terminal with specific capabilities
   */
  static mockTerminal(capabilities: Partial<TerminalInfo> = {}): MockTerminal {
    return new MockTerminal(capabilities);
  }

  /**
   * Capture output from a function
   */
  static captureOutput(fn: () => void): string {
    const capture = new OutputCapture();
    return capture.capture(fn);
  }

  /**
   * Capture output from an async function
   */
  static async captureOutputAsync(fn: () => Promise<void>): Promise<string> {
    const capture = new OutputCapture();
    return capture.captureAsync(fn);
  }

  /**
   * Measure performance of a function
   */
  static measurePerformance(fn: () => void, iterations: number = 1000) {
    const measurer = new PerformanceMeasurer();
    return measurer.benchmark(fn, iterations);
  }

  /**
   * Test for memory leaks
   */
  static async testMemoryLeak(testFn: () => Promise<void> | void, iterations: number = 10) {
    const detector = new MemoryLeakDetector();
    detector.start();

    for (let i = 0; i < iterations; i++) {
      await testFn();
      detector.snapshot(`iteration-${i + 1}`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    return detector.analyze();
  }

  /**
   * Strip ANSI escape codes for testing
   */
  static stripAnsi(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\u001B\[[0-9;]*m/g, '');
  }

  /**
   * Compare styled output by stripping ANSI codes
   */
  static compareStyled(actual: string, expected: string): boolean {
    return this.stripAnsi(actual) === this.stripAnsi(expected);
  }

  /**
   * Create a test suite for resource cleanup
   */
  static createResourceCleanupTest(createResource: () => any, iterations: number = 100) {
    return async () => {
      const initialCount = ResourceManager.getResourceCount();
      const resources: any[] = [];

      // Create resources
      for (let i = 0; i < iterations; i++) {
        resources.push(createResource());
      }

      // Dispose resources
      for (const resource of resources) {
        if (resource && typeof resource.dispose === 'function') {
          resource.dispose();
        }
      }

      // Check if resources were properly cleaned up
      const finalCount = ResourceManager.getResourceCount();
      const leaked = finalCount - initialCount;

      return {
        initialCount,
        finalCount,
        leaked,
        success: leaked === 0
      };
    };
  }

  /**
   * Create a stress test for performance
   */
  static createStressTest(testFn: () => void, duration: number = 5000) {
    return () => {
      const startTime = Date.now();
      let iterations = 0;
      let errors = 0;

      while (Date.now() - startTime < duration) {
        try {
          testFn();
          iterations++;
        } catch (error) {
          errors++;
        }
      }

      const actualDuration = Date.now() - startTime;
      const iterationsPerSecond = iterations / (actualDuration / 1000);

      return {
        iterations,
        errors,
        duration: actualDuration,
        iterationsPerSecond,
        errorRate: errors / iterations
      };
    };
  }

  /**
   * Clear all caches and pools for clean testing
   */
  static resetAll(): void {
    ColorProcessor.clearCaches();
    StylePool.clear();
    ResourceManager.disposeAll();
  }

  /**
   * Wait for a specified amount of time
   */
  static wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a timeout promise for testing async operations
   */
  static timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
      )
    ]);
  }
}

/**
 * Export commonly used testing utilities
 */
export { MockTerminal, OutputCapture, PerformanceMeasurer, MemoryLeakDetector, TestUtils };