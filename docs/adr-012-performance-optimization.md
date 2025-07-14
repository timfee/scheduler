# ADR-012: Performance Optimization Strategies

## Status

Accepted

## Context

The application needs consistent performance optimization strategies to ensure good user experience as it scales. This includes caching, query optimization, and preventing common performance anti-patterns.

## Decision

Establish performance optimization patterns that can be applied consistently across the application while maintaining code simplicity and reliability.

## Consequences

### Positive

- **Consistent performance**: Standardized optimization approaches
- **Scalability**: Patterns that work well under load
- **Maintainability**: Simple, well-understood optimization techniques
- **User experience**: Fast, responsive application

### Negative

- **Complexity**: Additional considerations for developers
- **Memory usage**: Caching strategies require memory management
- **Development overhead**: Performance considerations in code reviews

## Caching Strategies

### 1. Next.js App Router Caching

```typescript
// Static data that rarely changes
export async function getAppointmentTypes() {
  return await db
    .select()
    .from(appointmentTypes)
    .where(eq(appointmentTypes.isActive, true));
}

// Cache for 5 minutes
export const revalidate = 300;
```

### 2. Manual Cache Management

```typescript
// Cache invalidation in server actions
export async function createAppointmentTypeAction(
  data: CreateAppointmentTypeData,
) {
  try {
    // ... business logic

    // Invalidate relevant caches
    revalidateTag("appointment-types");
    revalidatePath("/admin/appointment-types");

    return { success: true, id };
  } catch (error) {
    // ... error handling
  }
}
```

### 3. In-Memory Caching for Expensive Operations

```typescript
// Cache expensive computations
const availabilityCache = new Map<
  string,
  { data: AvailabilityData; expiresAt: number }
>();

export async function getAvailability(date: string): Promise<AvailabilityData> {
  const cacheKey = `availability:${date}`;
  const cached = availabilityCache.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const data = await computeAvailability(date);

  // Cache for 5 minutes
  availabilityCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return data;
}
```

## Database Query Optimization

### 1. Prevent N+1 Queries

```typescript
// ❌ N+1 query pattern
export async function getAppointmentsWithTypes() {
  const appointments = await db.select().from(appointments);

  for (const appointment of appointments) {
    appointment.type = await db
      .select()
      .from(appointmentTypes)
      .where(eq(appointmentTypes.id, appointment.typeId))
      .limit(1);
  }

  return appointments;
}

// ✅ Single query with join
export async function getAppointmentsWithTypes() {
  return await db
    .select({
      id: appointments.id,
      title: appointments.title,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      typeName: appointmentTypes.name,
      typeDuration: appointmentTypes.durationMinutes,
    })
    .from(appointments)
    .leftJoin(appointmentTypes, eq(appointments.typeId, appointmentTypes.id));
}
```

### 2. Efficient Pagination

```typescript
// Cursor-based pagination for large datasets
export async function getAppointmentsPaginated(
  cursor?: string,
  limit = 20,
): Promise<{ appointments: Appointment[]; nextCursor?: string }> {
  const query = db
    .select()
    .from(appointments)
    .orderBy(desc(appointments.createdAt))
    .limit(limit + 1); // Get one extra to check if there's a next page

  if (cursor) {
    query.where(lt(appointments.createdAt, new Date(cursor)));
  }

  const results = await query;
  const hasNext = results.length > limit;
  const appointments = hasNext ? results.slice(0, -1) : results;

  return {
    appointments,
    nextCursor: hasNext
      ? appointments[appointments.length - 1]?.createdAt.toISOString()
      : undefined,
  };
}
```

### 3. Query Result Optimization

```typescript
// Select only needed columns
export async function getAppointmentSummaries(): Promise<AppointmentSummary[]> {
  return await db
    .select({
      id: appointments.id,
      title: appointments.title,
      startTime: appointments.startTime,
      // Don't select description, notes, etc. if not needed
    })
    .from(appointments)
    .where(eq(appointments.isActive, true));
}
```

## Client-Side Performance

### 1. Optimistic Updates

```typescript
export function AppointmentTypeManager() {
  const [types, setTypes] = useState<AppointmentType[]>([]);

  const handleCreate = async (data: CreateAppointmentTypeData) => {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticType = { ...data, id: tempId, isActive: true };
    setTypes(prev => [...prev, optimisticType]);

    try {
      const result = await createAppointmentTypeAction(data);

      // Replace optimistic item with real one
      setTypes(prev =>
        prev.map(type =>
          type.id === tempId
            ? { ...type, id: result.id! }
            : type
        )
      );
    } catch (error) {
      // Rollback optimistic update
      setTypes(prev => prev.filter(type => type.id !== tempId));
      throw error;
    }
  };

  return (
    // Component JSX
  );
}
```

### 2. Debounced Input Handling

```typescript
import { useDebouncedCallback } from 'use-debounce';

export function SearchInput({ onSearch }: { onSearch: (term: string) => void }) {
  const debouncedSearch = useDebouncedCallback(onSearch, 300);

  return (
    <input
      type="text"
      placeholder="Search..."
      onChange={(e) => debouncedSearch(e.target.value)}
    />
  );
}
```

### 3. Virtualization for Large Lists

```typescript
// Use virtualization for large lists
import { FixedSizeList as List } from 'react-window';

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <AppointmentItem appointment={appointments[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={appointments.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

## Bundle Size Optimization

### 1. Code Splitting

```typescript
// Lazy load heavy components
const AppointmentCalendar = lazy(() => import('./appointment-calendar'));
const ReportsPage = lazy(() => import('./reports-page'));

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/calendar" element={<AppointmentCalendar />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. Tree Shaking

```typescript
// ✅ Import only what you need
import { format } from "date-fns";
// ❌ Don't import entire libraries
import * as dateFns from "date-fns";
```

## Memory Management

### 1. Cleanup Patterns

```typescript
export function useAppointmentUpdates() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh appointments
      fetchAppointments().then(setAppointments);
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return appointments;
}
```

### 2. Cache Size Management

```typescript
// Implement LRU cache for memory efficiency
class LRUCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

## Performance Monitoring

### 1. Custom ESLint Rules for Performance

```javascript
// eslint-rules/performance-patterns.js
module.exports = {
  "no-sync-database-calls": {
    create(context) {
      return {
        CallExpression(node) {
          // Detect synchronous database calls
          if (
            node.callee.property?.name === "run" &&
            !node.parent?.type?.includes("Await")
          ) {
            context.report({
              node,
              message: "Use async database calls with await",
            });
          }
        },
      };
    },
  },
};
```

### 2. Performance Metrics

```typescript
// lib/performance.ts
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  return async function (...args: any[]) {
    const start = performance.now();

    try {
      const result = await fn.apply(this, args);
      const duration = performance.now() - start;

      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation: ${name} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Failed operation: ${name} took ${duration}ms`, error);
      throw error;
    }
  };
}

// Usage
export const getAvailability = measurePerformance(
  "getAvailability",
  async (date: string) => {
    // ... implementation
  },
);
```

## Best Practices

### 1. Database Queries

- Use indexes on frequently queried columns
- Avoid SELECT \* queries
- Use pagination for large result sets
- Implement query result caching

### 2. Client-Side Rendering

- Use React.memo for expensive components
- Implement virtualization for large lists
- Debounce user input handlers
- Use optimistic updates for better UX

### 3. Bundle Size

- Implement code splitting for routes
- Use tree shaking for dependencies
- Analyze bundle size regularly
- Lazy load heavy components

### 4. Memory Management

- Clean up timers and subscriptions
- Implement cache size limits
- Monitor memory usage in production
- Use weak references where appropriate

## Performance Testing

### 1. Load Testing

```typescript
// test/performance/load-test.ts
export async function loadTestBookingCreation() {
  const concurrentUsers = 10;
  const bookingsPerUser = 5;

  const promises = Array.from(
    { length: concurrentUsers },
    async (_, userIndex) => {
      for (let i = 0; i < bookingsPerUser; i++) {
        const start = performance.now();

        await createBookingAction({
          type: "standard",
          selectedDate: "2024-01-15",
          selectedTime: "10:00",
          name: `User ${userIndex}`,
          email: `user${userIndex}@example.com`,
        });

        const duration = performance.now() - start;
        console.log(`Booking ${i + 1} for user ${userIndex}: ${duration}ms`);
      }
    },
  );

  await Promise.all(promises);
}
```

### 2. Memory Testing

```typescript
// Monitor memory usage during tests
export function trackMemoryUsage() {
  const initialMemory = process.memoryUsage();

  return () => {
    const currentMemory = process.memoryUsage();
    const diff = {
      rss: currentMemory.rss - initialMemory.rss,
      heapUsed: currentMemory.heapUsed - initialMemory.heapUsed,
      external: currentMemory.external - initialMemory.external,
    };

    console.log("Memory usage diff:", diff);
    return diff;
  };
}
```

## Related Decisions

- [ADR-001: Manual State Management Over Libraries](./adr-001-manual-state-management.md)
- [ADR-005: In-memory Solutions Over External Services](./adr-005-in-memory-solutions.md)
- [ADR-007: Client-Server Communication Patterns](./adr-007-client-server-communication.md)
