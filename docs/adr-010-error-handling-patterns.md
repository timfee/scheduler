# ADR-010: Error Handling and User Feedback Patterns

## Status

Accepted

## Context

The application needs consistent error handling patterns across server actions and user-facing components. Different error types require different handling approaches and user feedback strategies.

## Decision

Establish standardized error handling patterns that provide meaningful user feedback while maintaining security and consistency.

## Consequences

### Positive

- **Consistent user experience**: All errors are handled and displayed consistently
- **Security**: Internal errors are not exposed to users
- **Debugging**: Developers get proper error context in logs
- **Resilience**: Graceful degradation when errors occur

### Negative

- **Boilerplate**: Requires consistent error handling patterns across components
- **Complexity**: Multiple error types require different handling strategies

## Error Handling Patterns

### 1. Server Action Error Handling

```typescript
export async function serverAction(input: Input): Promise<Result> {
  try {
    // Validate input
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || "Invalid input");
    }

    // Business logic
    const result = await businessLogic(parsed.data);

    // Success response
    return { success: true, data: result };
  } catch (error) {
    // Map error to user-friendly message
    throw new Error(mapErrorToUserMessage(error, "Operation failed"));
  }
}
```

### 2. Error Mapping Function

```typescript
// lib/errors.ts
export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "BusinessError";
  }
}

export function mapErrorToUserMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof BusinessError) {
    return ERROR_MESSAGES[error.code] || fallback;
  }
  if (error instanceof Error) {
    // Log internal errors for debugging
    console.error("Internal error:", error.message, error.stack);
    return fallback;
  }
  return fallback;
}
```

### 3. User-Friendly Error Messages

```typescript
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: "Please check your input and try again.",
  NOT_FOUND: "The requested item was not found.",
  PERMISSION_DENIED: "You don't have permission to perform this action.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  CALENDAR_UNAVAILABLE: "The calendar service is temporarily unavailable.",
  BOOKING_CONFLICT: "The selected time is no longer available.",
  INVALID_TIME_SLOT: "Please select a valid time slot.",
  CONNECTION_FAILED: "Unable to connect to the calendar service.",
} as const;
```

### 4. Client-Side Error Handling

```tsx
export function ComponentWithErrorHandling() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (data: FormData) => {
    setError(null);
    setIsLoading(true);

    try {
      await serverAction(data);
      // Success handling
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleAction}>
        <button disabled={isLoading}>
          {isLoading ? "Processing..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
```

## Error Types and Handling

### 1. Validation Errors

- **Source**: Client input validation, server-side validation
- **Handling**: Show specific field errors inline
- **Message**: Specific validation message (e.g., "Name is required")

### 2. Business Logic Errors

- **Source**: Domain constraints, business rules
- **Handling**: Show user-friendly error message
- **Message**: Generic but helpful (e.g., "Time slot not available")

### 3. External Service Errors

- **Source**: Calendar providers, database connections
- **Handling**: Retry mechanisms, fallback behavior
- **Message**: Generic service unavailable message

### 4. System Errors

- **Source**: Unexpected exceptions, infrastructure issues
- **Handling**: Log for debugging, show generic error
- **Message**: "Something went wrong. Please try again."

## Rate Limiting and Abuse Prevention

### 1. Rate Limiting Implementation

```typescript
// Simple in-memory rate limiter
const lastActionAt = new Map<string, number>();

function checkRateLimit(identifier: string, windowMs: number): boolean {
  const now = Date.now();
  const last = lastActionAt.get(identifier) ?? 0;

  if (now - last < windowMs) {
    return false; // Rate limited
  }

  lastActionAt.set(identifier, now);
  return true; // OK to proceed
}
```

### 2. Error Response for Rate Limiting

```typescript
if (!checkRateLimit(email, 60_000)) {
  throw new BusinessError(
    "Too many attempts. Please wait a minute.",
    "RATE_LIMITED",
  );
}
```

## Security Considerations

### 1. Error Information Leakage

- Never expose internal error details to users
- Log detailed errors server-side for debugging
- Use generic error messages for security-sensitive operations

### 2. Input Validation Errors

- Show specific validation errors to help users
- Validate on both client and server side
- Sanitize error messages to prevent XSS

### 3. Authentication Errors

- Use generic messages for authentication failures
- Avoid revealing whether user exists or not
- Implement proper session management

## Testing Error Scenarios

### 1. Server Action Error Testing

```typescript
describe("serverAction", () => {
  it("handles validation errors", async () => {
    await expect(serverAction(invalidInput)).rejects.toThrow("Invalid input");
  });

  it("handles business logic errors", async () => {
    await expect(serverAction(conflictingData)).rejects.toThrow(
      "Conflict detected",
    );
  });

  it("handles external service errors", async () => {
    mockExternalService.mockRejectedValue(new Error("Service unavailable"));
    await expect(serverAction(validInput)).rejects.toThrow(
      "Service temporarily unavailable",
    );
  });
});
```

### 2. Component Error Testing

```typescript
describe("ComponentWithErrorHandling", () => {
  it("displays error messages", async () => {
    const mockAction = jest.fn().mockRejectedValue(new Error("Test error"));

    render(<ComponentWithErrorHandling />);

    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Test error")).toBeInTheDocument();
    });
  });
});
```

## Implementation Guidelines

### 1. Server Actions

- Always use try-catch blocks
- Validate input before processing
- Use mapErrorToUserMessage for consistent error handling
- Log detailed errors for debugging

### 2. Client Components

- Handle loading states
- Display error messages prominently
- Provide retry mechanisms where appropriate
- Clear errors on new attempts

### 3. Error Messages

- Use clear, actionable language
- Avoid technical jargon
- Provide guidance on how to fix the issue
- Be consistent across the application

## Related Decisions

- [ADR-002: Server Actions Over API Routes](./adr-002-server-actions.md)
- [ADR-007: Client-Server Communication Patterns](./adr-007-client-server-communication.md)
