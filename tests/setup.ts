/**
 * Jest Setup File
 * Provides test utilities and global configuration
 */

// Extend Jest matchers if needed
declare global {
  namespace jest {
    interface Matchers<R> {
      // Add custom matchers here if needed
    }
  }
}

// Setup test environment
beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test cleanup
});

export {};
