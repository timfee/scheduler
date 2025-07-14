# ADR-001: Manual State Management Over Libraries

## Status

Accepted

## Context

The application needs client-side state management for forms, optimistic updates, and component coordination. Modern React applications often use state management libraries like Redux, Zustand, or TanStack Query for this purpose.

## Decision

Use manual state management with React's built-in `useState` and `useEffect` hooks instead of external state management libraries.

## Consequences

### Positive

- **Simpler debugging**: State changes are explicit and easy to trace
- **Smaller bundle size**: No additional dependencies for state management
- **Full control**: Complete control over state updates and side effects
- **Less abstraction overhead**: Direct React patterns without library-specific concepts
- **Easier customization**: Simple to implement custom optimistic updates
- **Better performance**: No middleware or store overhead
- **Easier testing**: State is local to components, making tests more focused

### Negative

- **More boilerplate**: Manual state management requires more code per component
- **Potential duplication**: Similar state logic may be repeated across components
- **Learning curve**: New developers need to understand manual patterns vs library patterns

## Implementation Examples

### Manual State with Optimistic Updates

```tsx
// components/connections-client.tsx
const [connections, setConnections] =
  useState<ConnectionListItem[]>(initialConnections);

const addConnection = (item: ConnectionListItem) =>
  setConnections((prev) => [...prev, item]);

const updateConnection = (item: ConnectionListItem) =>
  setConnections((prev) => prev.map((c) => (c.id === item.id ? item : c)));

const removeConnection = (id: string) =>
  setConnections((prev) => prev.filter((c) => c.id !== id));
```

### Manual Form State

```tsx
// Custom hook for form management
const useConnectionForm = () => {
  const [formValues, setFormValues] =
    useState<ConnectionFormValues>(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual validation and submission logic
  const handleSubmit = async (values: ConnectionFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createConnectionAction(values);
      // Optimistic update handled by parent component
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { formValues, setFormValues, isSubmitting, error, handleSubmit };
};
```

## Alternatives Considered

### Redux Toolkit

- **Pros**: Powerful devtools, predictable state updates, time-travel debugging
- **Cons**: Significant complexity overhead, large bundle size, unnecessary for our use case
- **Why rejected**: Too complex for simple CRUD operations and form management

### Zustand

- **Pros**: Lightweight, simple API, good TypeScript support
- **Cons**: Still an abstraction layer, unnecessary for local component state
- **Why rejected**: Manual state management is simpler for our scale

### TanStack Query

- **Pros**: Excellent caching, optimistic updates, background refetching
- **Cons**: Overkill for simple Server Actions, adds complexity
- **Why rejected**: Server Actions with manual state management are sufficient

## When to Reconsider

Consider adding a state management library if:

- Component state becomes deeply nested (>3 levels)
- State synchronization between distant components becomes complex
- Complex async state management patterns emerge
- Team size grows significantly (>10 developers)
- Application scales beyond current feature set significantly

## Related Decisions

- [ADR-002: Server Actions Over API Routes](./adr-002-server-actions.md)
- [ADR-004: Minimal Dependencies Approach](./adr-004-minimal-dependencies.md)
