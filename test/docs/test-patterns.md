# Test Patterns and Guidelines

This document outlines the standardized test patterns used in the scheduler project.

## Test Structure

### Directory Organization

All tests follow the `__tests__/` directory pattern:

```
src/
├── features/
│   └── booking/
│       ├── __tests__/
│       │   ├── actions.test.ts
│       │   ├── data.test.ts
│       │   └── components/
│       │       └── booking-form.test.tsx
│       └── ... (source files)
├── test/
│   ├── factories/     # Test data factories
│   ├── fixtures/      # Static test data
│   ├── integration/   # Integration tests
│   ├── e2e/          # End-to-end tests
│   └── setup/        # Test setup files
```

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.test.ts` in `test/integration/`
- E2E tests: `*.test.ts` in `test/e2e/`

## Test Data Factories

### Using the Factory System

Instead of inline test data, use the factory system:

```typescript
// ❌ Don't do this
const bookingData = {
  type: 'intro',
  date: '2024-01-01',
  time: '10:00',
  name: 'Test User',
  email: 'test@example.com'
};

// ✅ Do this
import { bookingFactory, bookingVariants } from '@test/factories';

const bookingData = bookingFactory.build();
const introBooking = bookingVariants.intro();
const customBooking = bookingFactory.build({ email: 'custom@example.com' });
```

### Available Factories

#### Booking Factory
```typescript
import { bookingFactory, bookingVariants } from '@test/factories';

// Basic usage
const booking = bookingFactory.build();
const bookings = bookingFactory.buildList(5);

// Variants
const intro = bookingVariants.intro();
const followUp = bookingVariants.followUp();
const consultation = bookingVariants.consultation();
const customTime = bookingVariants.withCustomTime('14:30');
```

#### Calendar Event Factory
```typescript
import { calendarEventFactory, calendarEventVariants } from '@test/factories';

// Basic usage
const event = calendarEventFactory.build();
const events = calendarEventFactory.buildList(3);

// Variants
const intro = calendarEventVariants.intro();
const duration60 = calendarEventVariants.withDuration(60);
const timeRange = calendarEventVariants.withTimeRange('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z');
```

#### Connection Factory
```typescript
import { connectionFactory, connectionVariants } from '@test/factories';

// Basic usage
const connection = connectionFactory.build();

// Variants
const google = connectionVariants.google();
const apple = connectionVariants.apple();
const caldav = connectionVariants.caldav();
const bookingCapable = connectionVariants.bookingCapable();
```

#### Appointment Type Factory
```typescript
import { appointmentTypeFactory, appointmentTypeVariants } from '@test/factories';

// Basic usage
const appointmentType = appointmentTypeFactory.build();

// Variants
const intro = appointmentTypeVariants.intro();
const consultation = appointmentTypeVariants.consultation();
const custom = appointmentTypeVariants.withDuration(45);
```

### Creating Custom Factories

```typescript
import { Factory } from '@test/factories';

export const customFactory = Factory.define<CustomType>(() => ({
  id: randomUUID(),
  name: 'Default Name',
  value: 0,
}));

// With variants
export const customVariants = {
  active: () => customFactory.build({ active: true }),
  withName: (name: string) => customFactory.build({ name }),
};
```

## Mock Management

### Standardized Setup

Import the standardized mock setup:

```typescript
import '@test/setup/jest.setup';
```

This provides:
- `beforeEach(() => jest.clearAllMocks())` - Clear mock call history
- `afterEach(() => jest.restoreAllMocks())` - Restore original implementations

### Module Mocking

Use type-safe Jest ESM mocking:

```typescript
import { jest } from '@jest/globals';

// Type-safe module mocking
jest.unstable_mockModule('@/some/module', () => ({
  someFunction: jest.fn(),
  someValue: 'mocked-value',
}));

// Import after mocking
const { someFunction } = await import('@/some/module');
```

### When to Use resetModules

Only use `jest.resetModules()` when specifically testing module import/export scenarios:

```typescript
afterAll(() => {
  jest.resetModules(); // Only when needed
});
```

## Test Organization Patterns

### Unit Tests

```typescript
import { describe, it, expect, beforeAll, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';
import { someFactory } from '@test/factories';
import '@test/setup/jest.setup';

describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup that runs once before all tests
  });

  describe('specific functionality', () => {
    it('should do something specific', () => {
      const testData = someFactory.build();
      // Test implementation
    });
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { jest } from '@jest/globals';
import { createTestDb, cleanupTestDb } from '@/infrastructure/database/__tests__/helpers/db';
import { connectionFactory } from '@test/factories';
import '@test/setup/jest.setup';

describe('Integration Test', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: ReturnType<typeof createTestDb>['sqlite'];

  beforeAll(async () => {
    const testDb = createTestDb();
    db = testDb.db;
    sqlite = testDb.sqlite;
    
    // Mock database module
    jest.unstable_mockModule('@/infrastructure/database', () => ({ db }));
  });

  afterAll(() => {
    cleanupTestDb(sqlite);
    jest.resetModules();
  });

  beforeEach(() => {
    // Clear test data between tests
    db.delete(schema.someTable).where(sql`1=1`);
  });

  it('should work with real database', async () => {
    const testData = connectionFactory.build();
    // Test implementation
  });
});
```

## Environment Setup

### Test Environment Variables

Common environment variables for tests:

```typescript
beforeAll(() => {
  Object.assign(process.env, {
    NODE_ENV: 'development',
    ENCRYPTION_KEY: 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148',
    SQLITE_PATH: ':memory:',
    WEBHOOK_SECRET: 'test-webhook-secret-with-at-least-32-characters',
  });
});
```

## Running Tests

### Command Line Usage

```bash
# Run all tests
pnpm test

# Run tests silently
pnpm test --silent

# Run specific test file
pnpm test path/to/test.ts

# Run tests with coverage
pnpm test --coverage

# Run tests in watch mode
pnpm test --watch
```

### Pre-commit Validation

Before committing, always run:

```bash
npx tsc -p tsconfig.json --noEmit
npx eslint . --ext .js,.jsx,.ts,.tsx
pnpm test --silent
```

## Best Practices

### 1. Use Factories Over Inline Data
- Factories provide consistent, valid test data
- Easier to maintain and update
- Reduce test duplication

### 2. Keep Tests Focused
- One assertion per test when possible
- Clear test names that describe expected behavior
- Group related tests in describe blocks

### 3. Mock at the Right Level
- Mock external dependencies (APIs, databases)
- Don't mock the code under test
- Use type-safe mocking patterns

### 4. Clean Up After Tests
- Use the standardized mock setup
- Clear database state between tests
- Don't rely on test execution order

### 5. Test Error Conditions
- Test both success and failure scenarios
- Verify error messages and types
- Test edge cases and boundary conditions

## Common Patterns

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Errors

```typescript
it('should throw error for invalid input', async () => {
  await expect(functionThatThrows()).rejects.toThrow('Expected error message');
});
```

### Testing with Mocks

```typescript
it('should call external service', async () => {
  const mockService = jest.fn().mockResolvedValue('success');
  
  await functionUnderTest();
  
  expect(mockService).toHaveBeenCalledWith(expectedParams);
});
```

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure TypeScript paths are configured correctly
2. **Mock not working**: Check that you're importing after mocking
3. **Test flakiness**: Ensure proper cleanup between tests
4. **Environment errors**: Set required environment variables in test setup

### Debug Tips

```typescript
// Debug factory data
console.log('Factory data:', factoryName.build());

// Debug mock calls
console.log('Mock calls:', mockFunction.mock.calls);

// Debug test environment
console.log('Process env:', process.env);
```