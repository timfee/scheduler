# ADR-003: Feature-based Architecture

## Status
Accepted

## Context
The application needs a clear organization strategy for code, components, and business logic. Common approaches include layered architecture (separating by technical concerns) or feature-based architecture (separating by business domains).

## Decision
Organize code by feature/domain rather than by technical layer, with clear boundaries between features and shared utilities.

## Consequences

### Positive
- **Clear boundaries**: Each feature is self-contained with its own components, actions, and data
- **Easier navigation**: Developers can find all related code in one place
- **Better maintainability**: Changes to one feature don't affect others
- **Scalable team structure**: Teams can own entire features
- **Reduced coupling**: Features communicate through well-defined interfaces
- **Easier testing**: Feature-specific tests are co-located with the feature

### Negative
- **Potential duplication**: Similar logic might be repeated across features
- **Shared component complexity**: Determining what belongs in shared vs feature-specific areas
- **Refactoring overhead**: Moving functionality between features requires more planning

## Current Structure

```
app/
├── (booking)/           # Booking feature
│   ├── actions.ts       # Server actions for booking
│   ├── data.ts         # Data access layer
│   ├── layout.tsx      # Feature-specific layout
│   ├── page.tsx        # Main booking page
│   └── __tests__/      # Feature tests
├── connections/         # Connection management feature
│   ├── actions.ts      # Server actions for connections
│   ├── calendar-actions.ts # Calendar-specific actions
│   ├── data.ts         # Data access layer
│   ├── page.tsx        # Main connections page
│   └── hooks/          # Feature-specific hooks
├── appointments/        # Appointment management feature
│   ├── actions.ts      # Server actions for appointments
│   └── page.tsx        # Main appointments page
└── providers.tsx       # Global providers

components/
├── ui/                 # Shared UI components (shadcn/ui)
├── layout/             # Layout-specific components
├── connections-client.tsx # Feature-specific client components
├── connection-form.tsx
└── connections-list.tsx

infrastructure/
├── database/           # Database layer
│   ├── schema.ts      # Database schema
│   ├── integrations.ts # Integration management
│   └── encryption.ts  # Encryption utilities
└── providers/         # External provider integrations
    └── caldav.ts      # CalDAV provider

lib/
├── types/             # Shared types
├── schemas/           # Shared validation schemas
├── hooks/             # Shared hooks
└── utils/             # Shared utilities
```

## Feature Organization Principles

### 1. Feature Boundaries
Each feature should be:
- **Self-contained**: All related code in the feature directory
- **Loosely coupled**: Minimal dependencies on other features
- **Well-defined interface**: Clear public API for other features

### 2. Shared Code Strategy
- **UI components**: Shared in `components/ui/` (shadcn/ui pattern)
- **Types**: Shared in `lib/types/` when used across features
- **Utilities**: Shared in `lib/utils/` when reusable
- **Infrastructure**: Database, providers, and external integrations

### 3. Feature Communication
Features communicate through:
- **Shared types**: Common interfaces and data structures
- **Server actions**: Cross-feature operations through actions
- **URL state**: Shareable state via URL parameters (using nuqs)
- **Database**: Shared data layer

## Implementation Examples

### Feature-Specific Server Actions
```tsx
// app/connections/actions.ts
"use server";

export async function createConnectionAction(formData: ConnectionFormData) {
  // Feature-specific business logic
  const integration = await createCalendarIntegration(formData);
  
  // Feature-specific cache invalidation
  revalidatePath("/connections");
  revalidateTag("calendars");
  
  return integration;
}
```

### Feature-Specific Components
```tsx
// components/connections-client.tsx
import { createConnectionAction } from "@/app/connections/actions";

export default function ConnectionsClient() {
  // Feature-specific state and logic
  const [connections, setConnections] = useState<ConnectionListItem[]>();
  
  // Feature-specific handlers
  const handleCreate = async (formData: ConnectionFormData) => {
    const result = await createConnectionAction(formData);
    setConnections(prev => [...prev, result]);
  };
  
  return (
    // Feature-specific UI
  );
}
```

### Shared Infrastructure
```tsx
// infrastructure/database/integrations.ts
export async function createCalendarIntegration(input: CreateCalendarIntegrationInput) {
  // Shared database operations used by multiple features
  const integration = await db.insert(calendarIntegrations).values(input);
  return integration;
}
```

## Cross-Feature Considerations

### Shared State
- **Avoid**: Global state that spans multiple features
- **Prefer**: URL state, server state, or explicit prop passing
- **Pattern**: Use nuqs for shareable URL state

### Shared Components
- **UI primitives**: Keep in `components/ui/` (Button, Input, etc.)
- **Feature-specific**: Keep in feature directories
- **Layout components**: Keep in `components/layout/`

### Shared Types
```tsx
// lib/types/calendar.ts
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

// Used across booking and connections features
```

## Alternatives Considered

### Layered Architecture
- **Pros**: Clear technical separation, familiar pattern
- **Cons**: Scattered feature logic, harder to maintain feature cohesion
- **Why rejected**: Feature-based organization is more maintainable for domain-driven applications

### Monolithic Structure
- **Pros**: Simple, everything in one place
- **Cons**: Becomes unmaintainable as application grows
- **Why rejected**: Poor scalability and maintainability

### Micro-frontend Architecture
- **Pros**: Complete feature isolation, independent deployments
- **Cons**: Significant complexity overhead, unnecessary for current scale
- **Why rejected**: Too complex for current team size and application scope

## When to Reconsider

Consider alternative architectures if:
- Features become too tightly coupled
- Shared code becomes predominant (>50% of codebase)
- Team structure changes significantly
- Application scales beyond current complexity
- Independent deployment of features becomes necessary

## Related Decisions
- [ADR-001: Manual State Management Over Libraries](./adr-001-manual-state-management.md)
- [ADR-004: Minimal Dependencies Approach](./adr-004-minimal-dependencies.md)