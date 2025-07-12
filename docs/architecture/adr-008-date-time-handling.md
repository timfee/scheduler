# ADR-008: Date and Time Handling Standards

## Status
Accepted

## Context
The scheduler application deals extensively with date and time operations, including:
- Converting between different time zones
- Formatting dates for API calls
- Creating date ranges for queries
- Parsing user input dates
- Handling business hours across time zones

Without standardized patterns, we risk inconsistent date formatting, timezone bugs, and duplicated code across components.

## Decision
We will standardize date and time handling with these patterns:

### 1. Date Formatting
- **API calls**: Always use ISO format `"yyyy-MM-dd'T'HH:mm:ssXXX"` via `formatDateForApi()`
- **Database storage**: Store timestamps as integers (Unix timestamps)
- **UI display**: Use `date-fns` formatting functions with explicit patterns

### 2. Date Range Creation
- Use `createDateRange()` utility for consistent range creation
- Default to 7 days from today for general queries
- Use specific day counts when needed (e.g., 5 days for booking flow)

### 3. Timezone Handling
- Always specify timezone explicitly in business logic
- Use `TIME_ZONES.DEFAULT` constant for fallback
- Store timezone information alongside date/time data when needed

### 4. Date Utilities Location
- Common date utilities go in `/lib/utils/date-range.ts`
- Business-specific date logic goes in feature directories
- Keep date-fns as the primary date manipulation library

## Consequences
**Positive:**
- Consistent date formatting across the application
- Reduced code duplication in date range creation
- Explicit timezone handling prevents bugs
- Centralized utilities make maintenance easier

**Negative:**
- Developers must learn utility functions instead of using date-fns directly
- Additional abstraction layer to maintain

## Implementation
- Create `/lib/utils/date-range.ts` with standard utilities
- Add ESLint rule to enforce consistent date formatting patterns
- Update existing code to use utilities where applicable
- Document patterns in development guidelines

## References
- Related to ADR-003 (Feature-based architecture)
- Implements patterns detected in checkpoint analysis
- Addresses code duplication in date formatting