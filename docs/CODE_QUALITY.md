# Code Quality Requirements

This repository has strict code quality requirements that must be met before any commit can be made.

## Pre-commit Checks

Before committing changes, all of the following checks must pass:

### 1. Code Formatting

```bash
pnpm format:check
```

- Ensures all code follows consistent formatting rules
- Fix issues by running: `pnpm format`

### 2. TypeScript Compilation

```bash
npx tsc -p tsconfig.json --noEmit
```

- Ensures all TypeScript code compiles without errors
- Fix issues by addressing TypeScript compilation errors

### 3. ESLint

```bash
npx eslint . --ext .js,.jsx,.ts,.tsx
```

- Ensures all code follows linting rules and best practices
- Fix issues by running: `pnpm lint:fix` or manually addressing ESLint errors

### 4. Tests

```bash
pnpm test --silent
```

- Ensures all tests pass
- Fix issues by addressing failing tests

## Automated Enforcement

### Git Pre-commit Hook

A pre-commit hook is installed that automatically runs all checks before each commit. If any check fails, the commit will be rejected.

### GitHub Actions

The CI workflow runs the same checks on every push and pull request.

### Manual Check

You can run all checks manually:

```bash
pnpm pre-commit
```

## ESLint Configuration

### Custom Rules

The project includes custom ESLint rules for:

- Performance patterns (database queries, React optimizations)
- Architectural patterns (file organization, import patterns)
- Code quality (consistent date formatting, naming conventions)

### Disabling Rules

When ESLint rules need to be disabled, use specific disable comments with explanations:

```typescript
// eslint-disable-next-line custom/performance-patterns -- better-sqlite3 is synchronous by design
db.insert(table).values(data).run();
```

## Performance Patterns

The custom `custom/performance-patterns` rule enforces:

- Database queries should include pagination (`.limit()` or `.take()`)
- Avoid synchronous database calls (use `await` pattern)
- Use stable React keys instead of array indices
- Avoid creating objects in render functions

### Legitimate Exceptions

Some patterns that trigger warnings are legitimate:

- **Migration scripts**: Should use synchronous database operations
- **Setup scripts**: Should use synchronous database operations
- **Small datasets**: Queries for preferences, appointment types, integrations don't need limits
- **Single record lookups**: Queries with `limit(1)` are appropriate

## Development Workflow

1. Make your changes
2. Run `pnpm format` to fix formatting
3. Run `pnpm lint:fix` to fix linting issues
4. Run `pnpm test` to ensure tests pass
5. Run `npx tsc -p tsconfig.json --noEmit` to check TypeScript
6. Commit (pre-commit hook will verify all checks pass)

## IDE Integration

Consider configuring your IDE to:

- Format on save using Prettier
- Show ESLint errors and warnings
- Run TypeScript compilation checking
- Display test results

This ensures issues are caught early in development rather than at commit time.
