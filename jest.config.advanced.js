module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@effects/(.*)$': '<rootDir>/src/effects/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@validation/(.*)$': '<rootDir>/src/validation/$1',
    '^@themes/(.*)$': '<rootDir>/src/themes/$1',
    '^@template/(.*)$': '<rootDir>/src/template/$1',
    '^@conditional/(.*)$': '<rootDir>/src/conditional/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  snapshotSerializers: ['<rootDir>/tests/serializers/ansi-serializer.js'],
  testTimeout: 30000,
  maxWorkers: 4,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true
};