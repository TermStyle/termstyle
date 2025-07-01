#!/usr/bin/env node

/**
 * Performance Benchmark for TermStyle
 * Demonstrates the performance improvements from caching and optimization
 */

const { performance } = require('perf_hooks');

async function runBenchmark() {
  console.log('🚀 TermStyle Performance Benchmark\n');
  
  // Force color support for testing
  process.env.FORCE_COLOR = '3';
  
  const termstyle = require('./dist/index.js');
  const ts = termstyle.default;
  const { gradient, style } = termstyle;
  
  // Warm up the caches
  console.log('Warming up caches...');
  for (let i = 0; i < 100; i++) {
    ts.red('warmup');
    gradient('warmup', ['red', 'blue']);
  }
  
  // Test 1: Basic Style Performance
  console.log('\n📊 Test 1: Basic Style Performance');
  console.log('Applying red.bold.italic 10,000 times:');
  
  const styleStart = performance.now();
  for (let i = 0; i < 10000; i++) {
    ts.red.bold.italic('Performance Test');
  }
  const styleEnd = performance.now();
  const styleTime = styleEnd - styleStart;
  const stylePerOp = styleTime / 10000;
  
  console.log(`Total time: ${styleTime.toFixed(2)}ms`);
  console.log(`Per operation: ${stylePerOp.toFixed(4)}ms`);
  console.log(`Operations/second: ${Math.round(1000 / stylePerOp).toLocaleString()}`);
  
  // Test 2: Gradient Performance
  console.log('\n🌈 Test 2: Gradient Performance');
  console.log('Rendering gradients 1,000 times:');
  
  const gradientText = 'This is a gradient test with multiple words to see performance';
  const gradientStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    gradient(gradientText, ['red', 'yellow', 'green', 'blue']);
  }
  const gradientEnd = performance.now();
  const gradientTime = gradientEnd - gradientStart;
  const gradientPerOp = gradientTime / 1000;
  
  console.log(`Total time: ${gradientTime.toFixed(2)}ms`);
  console.log(`Per gradient: ${gradientPerOp.toFixed(4)}ms`);
  console.log(`Gradients/second: ${Math.round(1000 / gradientPerOp).toLocaleString()}`);
  
  // Test 3: Color Conversion Performance
  console.log('\n🎨 Test 3: Color Conversion Performance');
  console.log('Converting colors 10,000 times:');
  
  const colorStart = performance.now();
  for (let i = 0; i < 10000; i++) {
    style.color(255, 128, 64).apply('Test');
    style.color('#ff8040').apply('Test');
    style.color('orange').apply('Test');
  }
  const colorEnd = performance.now();
  const colorTime = colorEnd - colorStart;
  const colorPerOp = colorTime / 30000; // 3 conversions per iteration
  
  console.log(`Total time: ${colorTime.toFixed(2)}ms`);
  console.log(`Per conversion: ${colorPerOp.toFixed(4)}ms`);
  console.log(`Conversions/second: ${Math.round(1000 / colorPerOp).toLocaleString()}`);
  
  // Test 4: Cache Hit Rate
  console.log('\n💾 Test 4: Cache Performance');
  
  // Reset cache stats if available
  if (termstyle.cacheManager) {
    termstyle.cacheManager.resetStats();
  }
  
  // Perform operations that should hit cache
  const cacheTestColors = ['red', 'green', 'blue', 'yellow', 'magenta'];
  for (let i = 0; i < 1000; i++) {
    const color = cacheTestColors[i % 5];
    ts[color]('Cache test');
    gradient('Cache gradient', [color, 'white']);
  }
  
  // Get cache stats
  try {
    // Try to access cache manager from the internal structure
    const { cacheManager } = require('./dist/index.js');
    
    if (cacheManager && cacheManager.getStats) {
      const stats = cacheManager.getStats();
      console.log('\nCache Statistics:');
      for (const [type, stat] of Object.entries(stats)) {
        const hitRate = stat.hits + stat.misses > 0 
          ? ((stat.hits / (stat.hits + stat.misses)) * 100).toFixed(1)
          : '0.0';
        console.log(`${type}: ${stat.hits} hits, ${stat.misses} misses (${hitRate}% hit rate)`);
      }
    }
  } catch (err) {
    console.log('\nCache statistics not available');
  }
  
  // Test 5: Memory Usage
  console.log('\n🧠 Test 5: Memory Efficiency');
  
  if (global.gc) {
    global.gc(); // Force garbage collection if available
  }
  
  const memBefore = process.memoryUsage().heapUsed;
  
  // Create many styled strings
  const styledStrings = [];
  for (let i = 0; i < 10000; i++) {
    styledStrings.push(ts.red.bold(`String ${i}`));
  }
  
  const memAfter = process.memoryUsage().heapUsed;
  const memUsed = (memAfter - memBefore) / 1024 / 1024;
  
  console.log(`Memory used for 10,000 styled strings: ${memUsed.toFixed(2)} MB`);
  console.log(`Average per string: ${((memUsed * 1024) / 10000).toFixed(2)} KB`);
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📈 PERFORMANCE SUMMARY');
  console.log('='.repeat(50));
  console.log(`Style operations: ${(1000 / stylePerOp).toFixed(0)} ops/sec`);
  console.log(`Gradient rendering: ${(1000 / gradientPerOp).toFixed(0)} ops/sec`);
  console.log(`Color conversions: ${(1000 / colorPerOp).toFixed(0)} ops/sec`);
  console.log(`Memory efficiency: ${((memUsed * 1024) / 10000).toFixed(2)} KB per styled string`);
  console.log('='.repeat(50));
  
  // Performance assertions
  const targets = {
    stylePerOp: 0.01,      // < 0.01ms per style operation
    gradientPerOp: 1.0,    // < 1ms per gradient
    colorPerOp: 0.001,     // < 0.001ms per color conversion
    memoryPerString: 0.5   // < 0.5KB per styled string
  };
  
  console.log('\n✅ Performance Targets:');
  console.log(`Style ops: ${stylePerOp <= targets.stylePerOp ? '✅' : '❌'} ${stylePerOp.toFixed(4)}ms (target: ${targets.stylePerOp}ms)`);
  console.log(`Gradients: ${gradientPerOp <= targets.gradientPerOp ? '✅' : '❌'} ${gradientPerOp.toFixed(4)}ms (target: ${targets.gradientPerOp}ms)`);
  console.log(`Colors: ${colorPerOp <= targets.colorPerOp ? '✅' : '❌'} ${colorPerOp.toFixed(4)}ms (target: ${targets.colorPerOp}ms)`);
  console.log(`Memory: ${((memUsed * 1024) / 10000) <= targets.memoryPerString ? '✅' : '❌'} ${((memUsed * 1024) / 10000).toFixed(2)}KB (target: ${targets.memoryPerString}KB)`);
}

// Run the benchmark
runBenchmark().catch(console.error);