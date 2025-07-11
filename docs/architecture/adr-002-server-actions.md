# ADR-002: Server Actions Over API Routes

## Status
Accepted

## Context
The application needs server-side operations for CRUD operations, authentication, and data validation. Traditional Next.js applications use API routes (`/api/*`) for server-side operations, but Next.js 13+ introduced Server Actions as an alternative.

## Decision
Use Next.js Server Actions for all server-side mutations and data operations instead of traditional API routes.

## Consequences

### Positive
- **Simplified data flow**: Direct function calls from client to server without HTTP layer
- **Better type safety**: Full TypeScript support from client to server
- **Automatic serialization**: No manual request/response handling
- **Built-in error handling**: Errors are automatically serialized and passed to client
- **Reduced boilerplate**: No need for separate API route files and fetch calls
- **Progressive enhancement**: Works without JavaScript enabled
- **Better DX**: Easier to debug and trace execution flow

### Negative
- **Less flexibility**: Cannot easily call from external systems
- **Coupling**: Tighter coupling between client and server code
- **Debugging complexity**: Stack traces span client and server
- **Caching limitations**: Less control over HTTP caching headers

## Implementation Examples

### Server Action Definition
```tsx
// app/connections/actions.ts
"use server";

export async function createConnectionAction(
  formData: ConnectionFormData,
): Promise<{ id: string; displayName: string }> {
  try {
    const parsed = connectionFormSchema.safeParse(formData);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message);
    }

    const integration = await createCalendarIntegration(parsed.data);
    
    revalidatePath("/connections");
    revalidateTag("calendars");
    
    return {
      id: integration.id,
      displayName: integration.displayName,
    };
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to create connection"));
  }
}
```

### Client Usage
```tsx
// components/connections-client.tsx
import { createConnectionAction } from "@/app/connections/actions";

const handleSubmit = async (formData: ConnectionFormData) => {
  setIsSubmitting(true);
  try {
    const result = await createConnectionAction(formData);
    // Optimistic update
    addConnection({
      id: result.id,
      displayName: result.displayName,
      // ... other fields
    });
  } catch (error) {
    setError(error.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

### Error Handling Pattern
```tsx
// lib/errors.ts
export function mapErrorToUserMessage(error: unknown, fallback: string): string {
  if (error instanceof CalendarConnectionError) {
    return CALENDAR_ERROR_MESSAGES[error.code] || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
```

## Data Validation Strategy

Server Actions include built-in validation using Zod schemas:

```tsx
// Validate input at the server action boundary
const parsed = connectionFormSchema.safeParse(formData);
if (!parsed.success) {
  throw new Error(parsed.error.issues[0]?.message);
}
```

## Cache Management

Server Actions integrate with Next.js cache invalidation:

```tsx
// Invalidate specific pages and cache tags
revalidatePath("/connections");
revalidateTag("calendars");
```

## Alternatives Considered

### Traditional API Routes
- **Pros**: HTTP standard, external API compatibility, better caching control
- **Cons**: More boilerplate, separate type definitions, manual error handling
- **Why rejected**: Server Actions provide better DX for internal operations

### tRPC
- **Pros**: End-to-end type safety, powerful query/mutation patterns
- **Cons**: Additional complexity, learning curve, unnecessary for simple operations
- **Why rejected**: Server Actions provide sufficient type safety with less complexity

### GraphQL
- **Pros**: Flexible querying, strong typing, tooling ecosystem
- **Cons**: Significant complexity overhead, overkill for simple CRUD
- **Why rejected**: Too complex for our use case and team size

## When to Reconsider

Consider API routes if:
- External systems need to call the endpoints
- Complex HTTP caching strategies are required
- WebSocket or streaming responses are needed
- Third-party integrations require webhook endpoints
- The application becomes a public API

## Related Decisions
- [ADR-001: Manual State Management Over Libraries](./adr-001-manual-state-management.md)
- [ADR-004: Minimal Dependencies Approach](./adr-004-minimal-dependencies.md)