# Test Organization Strategy

This document outlines the test organization strategy for the scheduler application.

## Overview

We follow a hybrid approach that combines co-location for unit tests with centralized organization for integration tests and shared utilities.

## Test Organization Principles

### 1. Unit Tests - Co-located with Source Code

Unit tests should be placed in `__tests__` directories adjacent to the code they test:

```
app/
├── connections/
│   ├── __tests__/
│   │   ├── actions.test.ts
│   │   ├── cache-invalidation.test.ts
│   │   └── ...
│   ├── actions.ts
│   └── ...
├── (booking)/
│   ├── __tests__/
│   │   ├── booking-flow.test.tsx
│   │   ├── actions.test.ts
│   │   └── ...
│   └── ...
```

**Benefits:**

- Tests are close to the code they test
- Easy to find and maintain
- Clear ownership and responsibility
- Easier to refactor code and tests together

### 2. Integration Tests - Centralized

Integration tests that test cross-cutting concerns or end-to-end workflows should be placed in the `test/integration/` directory:

```
test/
├── integration/
│   ├── booking-flow.test.ts
│   └── ...
```

**Benefits:**

- Clear separation of concerns
- Easier to run integration tests separately
- Can test interactions between multiple modules

### 3. Test Utilities - Centralized

Shared test utilities, mocks, factories, and setup files should be centralized in the `test/` directory:

```
test/
├── __mocks__/
├── factories/
├── setup/
├── types/
├── setupEnv.ts
└── ...
```

**Benefits:**

- Reusable across all tests
- Single source of truth for test configuration
- Easier to maintain shared test utilities

## Test Types and Placement

### Unit Tests (Co-located)

- Component tests (React components)
- Function tests (utility functions)
- Service tests (individual services)
- Action tests (server actions)
- Hook tests (custom React hooks)

### Integration Tests (Centralized)

- End-to-end workflows
- Cross-module interactions
- API route tests (when testing full request/response cycle)
- Database integration tests

### Test Utilities (Centralized)

- Test factories
- Mock implementations
- Setup and teardown utilities
- Custom matchers
- Test configuration

## Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Test directories: `__tests__/`
- Integration tests: `test/integration/*.test.ts`
- Test utilities: `test/utilities/*.ts`

## Jest Configuration

The Jest configuration is set up to automatically discover tests in both locations:

```javascript
// jest.config.ts
{
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  // ... other config
}
```

## Migration Notes

This organization was implemented to address inconsistencies in test placement. The key changes made:

1. **Moved cache invalidation tests**: From `test/cache-invalidation.test.ts` to `app/connections/__tests__/cache-invalidation.test.ts` since they specifically test connection actions.

2. **Maintained existing co-location**: Most tests were already properly co-located and remained in place.

3. **Preserved integration tests**: Integration tests in `test/integration/` were kept in place as they test cross-cutting concerns.

## Best Practices

1. **Keep unit tests close to source code** - Use `__tests__` directories
2. **Centralize integration tests** - Use `test/integration/` for cross-module tests
3. **Share utilities efficiently** - Use `test/` directory for reusable test code
4. **Use clear naming** - Make test purpose clear from filename
5. **Group related tests** - Keep related test files together in the same `__tests__` directory

## Running Tests

```bash
# Run all tests
pnpm test

# Run unit tests for a specific module
pnpm test app/connections

# Run integration tests
pnpm test test/integration

# Run a specific test file
pnpm test --testPathPatterns="cache-invalidation"
```
