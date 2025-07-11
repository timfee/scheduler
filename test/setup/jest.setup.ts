import { beforeEach, afterEach, jest } from '@jest/globals';

/**
 * Standardized mock management setup
 * This file should be imported by all test files that need consistent mock management
 */

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Restore all mocks after each test
afterEach(() => {
  jest.restoreAllMocks();
});

// Note: jest.resetModules() should only be used when specifically needed
// for testing module import/export scenarios