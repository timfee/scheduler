const fs = require('fs');
const path = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');

// Ensure an encryption key exists for config parsing and tests
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
}

const tsconfigFile = fs.readFileSync(path.resolve('./tsconfig.json'), 'utf-8');
const tsconfig = JSON.parse(tsconfigFile);
const { compilerOptions } = tsconfig;
if (
  typeof compilerOptions !== 'object' ||
  compilerOptions === null ||
  typeof compilerOptions.baseUrl !== 'string' ||
  typeof compilerOptions.paths !== 'object' ||
  compilerOptions.paths === null
) {
  throw new Error(
    'Invalid tsconfig: missing or invalid compilerOptions.baseUrl or compilerOptions.paths'
  );
}

module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/__tests__/setupEnv.ts'],
  roots: ['<rootDir>'],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    'server-only': '<rootDir>/__tests__/__mocks__/server-only.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: './tsconfig.jest.json' }],
  },
};
