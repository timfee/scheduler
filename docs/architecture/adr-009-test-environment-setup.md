# ADR-009: Test Environment Setup and Mocking Strategies

## Status

Accepted

## Context

The scheduler application has complex server-side dependencies that are challenging to test:

- Environment variables protected by `envin` library
- Database connections that need different configurations for tests
- ES modules vs CommonJS compatibility issues
- Server-only modules that can't be imported in client test environments

Without proper test environment setup, tests fail due to:

- Environment variable access errors
- Database connection issues
- Module import conflicts
- Mocking strategy inconsistencies

## Decision

We will standardize test environment setup with these patterns:

### 1. Jest Configuration

- **Separate environments**: Use Jest projects for client (jsdom) and server (node) tests
- **Database tests**: Run in Node environment to avoid client-side restrictions
- **Client tests**: Run in jsdom environment for React component testing
- **Module mapping**: Use consistent module aliases and mocks

### 2. Environment Variable Mocking

- **Mock envin**: Create `/test/__mocks__/env.config.ts` with test values
- **Jest module mapping**: Map `@/env.config` to mock in Jest config
- **Test-specific mocking**: Use `jest.mock()` at file level for complex cases
- **Environment setup**: Set `NODE_ENV=test` and required variables in setupEnv.ts

### 3. Database Testing

- **Test database**: Use in-memory SQLite for all database tests
- **Mock database module**: Use `jest.mock()` or `jest.unstable_mockModule()` for ES modules
- **Encryption mocking**: Mock encryption functions to avoid key validation issues
- **Migration setup**: Ensure test database schema matches production

### 4. Module Import Strategy

- **ES modules**: Use `jest.unstable_mockModule()` for ES module mocking
- **CommonJS**: Use `jest.mock()` for CommonJS module mocking
- **Server-only**: Mock `server-only` package to allow client-side testing
- **Dynamic imports**: Use dynamic imports in tests for better mocking control

## Consequences

**Positive:**

- Tests can run in appropriate environments (node/jsdom)
- Database tests work with proper mocking
- Environment variables accessible in tests
- Consistent mocking patterns across the codebase

**Negative:**

- Complex Jest configuration to maintain
- Different mocking strategies for different module types
- Test environment setup requires deep understanding of module system

## Implementation

- Configure Jest projects in `jest.config.ts`
- Create comprehensive mock modules in `/test/__mocks__/`
- Document mocking patterns in test documentation
- Use consistent file-level mocking for complex dependencies

## Examples

```typescript
// File-level mocking for environment config
jest.mock("@/env.config", () => ({
  default: {
    SQLITE_PATH: ":memory:",
    ENCRYPTION_KEY: "test-key-64-chars...",
    NODE_ENV: "test",
  },
}));

// ES module mocking for database
jest.unstable_mockModule("@/lib/database", () => ({
  db: mockDatabase,
}));
```

## References

- Related to checkpoint analysis findings
- Addresses test environment failures
- Complements ADR-007 (Client-server communication)
