# Date/Time Naming Conventions

This document outlines the standardized naming conventions for date/time variables in the scheduler codebase.

## General Principles

1. **Self-documenting names**: Variable names should clearly indicate their timezone and format
2. **Consistency**: Use the same naming pattern throughout the codebase
3. **Precision**: Be explicit about timezone and format to avoid confusion

## Naming Patterns

### UTC Timestamps

For dates/times stored or processed in UTC:

- Use `Utc` suffix (PascalCase)
- Examples: `startUtc`, `endUtc`, `createdUtc`, `updatedUtc`

### Local/Display Times

For dates/times in a specific timezone for display:

- Use descriptive names without timezone suffixes
- Examples: `displayTime`, `localTime`, `businessStartTime`

### Timezone Identifiers

For timezone strings (IANA format):

- Use `timeZone` (camelCase) for consistency with web standards
- Examples: `businessTimeZone`, `userTimeZone`, `ownerTimeZone`

### Date Strings

For date-only values (YYYY-MM-DD format):

- Use `date` or `Date` suffix
- Examples: `selectedDate`, `bookingDate`, `startDate`

### Time Strings

For time-only values (HH:MM format):

- Use `time` or `Time` suffix
- Examples: `startTime`, `endTime`, `displayTime`

### Timestamps (Numbers)

For Unix timestamps or numeric timestamps:

- Use `timestamp` or `Timestamp` suffix
- Examples: `createdTimestamp`, `lastModifiedTimestamp`

## Database vs TypeScript Naming

### Database Fields (snake_case)

- `created_at`, `updated_at`
- `start_time_utc`, `end_time_utc`
- `business_time_zone`

### TypeScript Properties (camelCase)

- `createdAt`, `updatedAt`
- `startUtc`, `endUtc`
- `businessTimeZone`

## Examples

### ✅ Good Examples

```typescript
// UTC timestamps
const eventStartUtc = "2024-01-15T17:00:00Z";
const eventEndUtc = "2024-01-15T18:00:00Z";

// Business timezone
const businessTimeZone = "America/New_York";

// Display times
const displayStartTime = "12:00";
const displayEndTime = "13:00";

// Date strings
const selectedDate = "2024-01-15";
const bookingDate = "2024-01-15";

// Timestamps
const createdTimestamp = Date.now();
```

### ❌ Bad Examples

```typescript
// Ambiguous - timezone unclear
const startTime = "2024-01-15T17:00:00Z";
const endTime = "12:00";

// Inconsistent casing
const start_utc = "2024-01-15T17:00:00Z";
const endUTC = "2024-01-15T18:00:00Z";

// Unclear format
const time = "12:00";
const date = new Date();
```

## ESLint Rule

A custom ESLint rule will enforce these conventions:

- Variables ending with date/time patterns must follow naming conventions
- UTC timestamps must use `Utc` suffix
- Timezone variables must use `timeZone` or `TimeZone`
- Ambiguous names like `time`, `date` alone are discouraged
