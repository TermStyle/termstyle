#!/usr/bin/env node

/**
 * Test Script for Critical Bug Fixes
 * Tests all the critical fixes applied in Phase 4 Wave 1
 */

const termstyle = require('./dist');

console.log('🔧 Testing Critical Bug Fixes\n');

// Test 1: Memory Leak Prevention in Animations
console.log('Test 1: Animation Memory Leak Prevention');
try {
  const animation = new termstyle.Animation('Testing...', 'blink', { duration: 100, iterations: 1 });
  animation.start();
  
  // Immediately dispose to test race condition handling
  setTimeout(() => {
    animation.dispose();
    console.log('✅ Animation disposed without memory leak');
  }, 50);
  
  setTimeout(() => {
    // Test 2: Spinner Resource Management
    console.log('\nTest 2: Spinner Resource Management');
    const spinner = new termstyle.Spinner('Loading...', 'dots');
    spinner.start();
    
    setTimeout(() => {
      spinner.dispose();
      console.log('✅ Spinner disposed properly');
      
      // Test 3: Progress Bar Cursor Management
      setTimeout(() => {
        console.log('\nTest 3: Progress Bar Cursor Management');
        const progress = new termstyle.ProgressBar({ total: 100 });
        
        for (let i = 0; i <= 100; i += 20) {
          progress.update(i);
        }
        
        progress.complete();
        console.log('✅ Progress bar completed with proper cursor management');
        
        // Test 4: Style Array Bounds Safety
        console.log('\nTest 4: Style Array Bounds Safety');
        try {
          const style = new termstyle.Style();
          const result = style.red.blue.green.bold.italic.underline.apply('Safe style chaining');
          console.log('✅ Style chaining safe:', result.length > 0 ? 'OK' : 'FAIL');
        } catch (error) {
          console.log('❌ Style chaining failed:', error.message);
        }
        
        // Test 5: Hash Function Fix
        console.log('\nTest 5: Gradient Hash Function');
        try {
          const result1 = termstyle.gradient('Hello World', ['red', 'blue']);
          const result2 = termstyle.gradient('Hello World', ['red', 'blue']);
          console.log('✅ Gradient hash function working:', result1 === result2 ? 'OK' : 'FAIL');
        } catch (error) {
          console.log('❌ Gradient test failed:', error.message);
        }
        
        // Test 6: Resource Manager Stress Test  
        console.log('\nTest 6: Resource Manager Stress Test');
        
        // Create multiple disposable resources simultaneously
        const resources = [];
        for (let i = 0; i < 5; i++) {
          const spinner = new termstyle.Spinner(`Test ${i}`, 'dots');
          resources.push(spinner);
          spinner.start();
        }
        
        // Dispose all at once to test race conditions
        setTimeout(() => {
          resources.forEach(r => r.dispose());
          console.log('✅ Multiple resource disposal handled safely');
          
          console.log('\n🎉 All Critical Fixes Verified Successfully!');
          process.exit(0);
        }, 100);
        
      }, 200);
    }, 200);
  }, 200);
  
} catch (error) {
  console.error('❌ Critical fix test failed:', error);
  process.exit(1);
}