# Architecture Overview

This document provides a high-level overview of the scheduler application's architecture, design decisions, and patterns.

## Core Architectural Principles

### 1. Minimal Complexity

- **Prefer simple solutions** over complex ones
- **Use built-in capabilities** of Next.js, React, and the web platform
- **Avoid dependencies** unless they solve genuinely complex problems
- **Manual state management** over external state libraries

### 2. Feature-Based Organization

- **Organize by business domain** rather than technical layers
- **Self-contained features** with clear boundaries
- **Minimal cross-feature dependencies**
- **Shared utilities** in dedicated directories

### 3. Type Safety & Validation

- **End-to-end type safety** from client to server
- **Runtime validation** with Zod schemas
- **Strong TypeScript usage** with strict settings
- **Consistent error handling** patterns

### 4. Server-First Architecture

- **Server Actions** for data mutations
- **Server Components** for data fetching
- **Client Components** only when necessary
- **Progressive enhancement** where possible

## Architecture Decision Records (ADRs)

Our architectural decisions are documented in ADRs that explain the context, decision, and consequences:

| ADR                                                 | Decision                       | Status      | Key Pattern                  |
| --------------------------------------------------- | ------------------------------ | ----------- | ---------------------------- |
| [ADR-001](./adr-001-manual-state-management.md)     | Manual State Management        | ✅ Accepted | React hooks + local state    |
| [ADR-002](./adr-002-server-actions.md)              | Server Actions Over API Routes | ✅ Accepted | Direct function calls        |
| [ADR-003](./adr-003-feature-based-architecture.md)  | Feature-Based Architecture     | ✅ Accepted | Domain-driven organization   |
| [ADR-004](./adr-004-minimal-dependencies.md)        | Minimal Dependencies           | ✅ Accepted | Built-in solutions preferred |
| [ADR-005](./adr-005-in-memory-solutions.md)         | In-Memory Solutions            | ✅ Accepted | Map-based caching            |
| [ADR-006](./adr-006-file-organization-patterns.md)  | File Organization Patterns     | ✅ Accepted | Predictable structure        |
| [ADR-007](./adr-007-client-server-communication.md) | Client-Server Communication    | ✅ Accepted | Optimistic updates           |

## Technology Stack

### Core Framework

- **Next.js 15** with App Router
- **React 19** with Server Components
- **TypeScript** for type safety
- **Tailwind CSS** for styling

### Data Layer

- **Drizzle ORM** for database operations
- **SQLite** for local development
- **PostgreSQL** for production
- **Zod** for validation schemas

### External Integrations

- **CalDAV** for calendar synchronization
- **tsdav** for CalDAV client operations
- **Better SQLite3** for local database

### Developer Experience

- **ESLint** with custom rules for architectural enforcement
- **Prettier** for code formatting
- **Jest** for testing
- **Playwright** for end-to-end testing

## Project Structure

```
scheduler/
├── app/                          # Next.js App Router
│   ├── (booking)/               # Booking feature
│   │   ├── components/          # Feature components
│   │   ├── hooks/               # Feature hooks
│   │   ├── server/              # Server actions & data
│   │   └── __tests__/           # Feature tests
│   ├── connections/             # Calendar connections
│   ├── admin/                   # Admin interface
│   └── appointments/            # Appointment management
├── components/                   # Shared UI components
│   ├── ui/                      # Base UI components
│   └── layout/                  # Layout components
├── lib/                         # Shared utilities
│   ├── types/                   # Type definitions
│   ├── schemas/                 # Validation schemas
│   └── utils/                   # Utility functions
├── infrastructure/              # External integrations
│   ├── database/                # Database layer
│   └── providers/               # External providers
├── docs/                        # Documentation
│   └── architecture/            # Architecture docs
├── eslint-rules/                # Custom ESLint rules
└── scripts/                     # Build & utility scripts
```

## Key Patterns

### 1. Server Actions Pattern

```typescript
// app/[feature]/server/actions.ts
"use server";

export async function createEntityAction(formData: FormData) {
  try {
    // 1. Validate input
    const parsed = schema.safeParse(formData);

    // 2. Business logic
    const result = await createEntity(parsed.data);

    // 3. Cache invalidation
    revalidatePath("/feature");

    return result;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to create"));
  }
}
```

### 2. Client Component Pattern

```typescript
// components/feature-client.tsx
"use client";

export default function FeatureClient({ initialData }) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  // Optimistic updates
  const handleCreate = async (formData) => {
    const tempItem = { ...formData, id: `temp-${Date.now()}` };
    setData(prev => [...prev, tempItem]);

    try {
      startTransition(async () => {
        const result = await createEntityAction(formData);
        setData(prev => prev.map(item =>
          item.id === tempItem.id ? result : item
        ));
      });
    } catch (error) {
      setData(prev => prev.filter(item => item.id !== tempItem.id));
      // Handle error
    }
  };

  return (/* JSX */);
}
```

### 3. Data Access Pattern

```typescript
// app/[feature]/server/data.ts
export async function getEntityRecords(): Promise<Entity[]> {
  const records = await db.select().from(entityTable);
  return records.map(transformEntity);
}
```

### 4. Form Validation Pattern

```typescript
// lib/schemas/[feature].ts
export const entitySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export type EntityFormData = z.infer<typeof entitySchema>;
```

## Architectural Enforcement

### Custom ESLint Rules

- **datetime-naming**: Enforces consistent date/time variable naming
- **file-organization**: Enforces feature organization patterns
- **server-action-patterns**: Enforces server action best practices

### Type Safety

- **Strict TypeScript** configuration
- **End-to-end type safety** from client to server
- **Runtime validation** with Zod schemas

### Testing Strategy

- **Unit tests** for server actions and utilities
- **Integration tests** for component interactions
- **E2E tests** for user workflows

## Development Workflow

### 1. Creating New Features

1. Follow the [Feature Template](./templates/feature-template.md)
2. Create feature directory structure
3. Implement following established patterns
4. Add tests for all functionality
5. Update documentation as needed

### 2. Making Architectural Decisions

1. Use the [ADR Template](./templates/adr-template.md)
2. Document context and alternatives
3. Implement enforcement mechanisms
4. Update this overview document

### 3. Code Quality

- **ESLint** catches architectural violations
- **TypeScript** ensures type safety
- **Tests** validate functionality
- **Code review** ensures pattern compliance

## Performance Considerations

### 1. Bundle Size

- **Minimal dependencies** keep bundles small
- **Tree shaking** removes unused code
- **Code splitting** by feature

### 2. Runtime Performance

- **Server Components** reduce client-side work
- **Optimistic updates** improve perceived performance
- **In-memory caching** for frequently accessed data

### 3. Database Performance

- **Connection pooling** for database efficiency
- **Query optimization** with Drizzle ORM
- **Proper indexing** for common queries

## Security Considerations

### 1. Data Validation

- **Server-side validation** for all inputs
- **Sanitization** of user data
- **Type-safe database operations**

### 2. Authentication & Authorization

- **Server-side session management**
- **Secure token handling**
- **Proper access controls**

### 3. External Integrations

- **Encrypted credential storage**
- **Secure API communication**
- **Rate limiting** for external calls

## Monitoring & Observability

### 1. Error Handling

- **Consistent error patterns**
- **User-friendly error messages**
- **Structured error logging**

### 2. Performance Monitoring

- **Bundle analysis** for size tracking
- **Database query monitoring**
- **Cache hit rate tracking**

### 3. Development Tools

- **ESLint** for static analysis
- **TypeScript** for compile-time checks
- **Jest** for unit testing
- **Playwright** for E2E testing

## Future Considerations

### When to Revisit Architecture

- **Team growth** beyond 10 developers
- **Feature complexity** exceeding current patterns
- **Performance requirements** beyond current capabilities
- **External integration** complexity increasing

### Potential Improvements

- **Micro-frontend architecture** for very large teams
- **External caching** for high-traffic scenarios
- **GraphQL** for complex data requirements
- **Event-driven architecture** for complex workflows

## Getting Started

1. **Read the ADRs** to understand architectural decisions
2. **Review the patterns** in existing features
3. **Use the templates** for new features
4. **Run ESLint** to ensure compliance
5. **Write tests** for all new functionality

## Contributing

When contributing to the architecture:

1. **Follow established patterns** unless there's a good reason not to
2. **Document new patterns** in ADRs
3. **Update enforcement rules** when adding new patterns
4. **Consider the impact** on existing features
5. **Keep it simple** - complexity should be justified

---

_This overview is a living document. Update it when making significant architectural changes._
