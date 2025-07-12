# ADR-006: File Organization Patterns

## Status
Accepted

## Context
As the application grows, it becomes important to have consistent file organization patterns within features. Different patterns can be used for organizing server-side code, client-side components, hooks, and other utilities within feature directories.

## Decision
Establish standardized file organization patterns within feature directories to ensure consistency and maintainability.

## Consequences

### Positive
- **Predictable structure**: Developers can easily locate files within any feature
- **Clear separation**: Server and client code are clearly separated
- **Scalable organization**: Pattern scales well as features grow
- **Easier navigation**: Consistent structure reduces cognitive load
- **Better tooling**: IDEs and tools can better understand the structure

### Negative
- **Initial overhead**: Requires setup of directory structure for new features
- **Enforcement complexity**: Need tooling to ensure pattern compliance
- **Potential over-organization**: May create unnecessary nesting for simple features

## File Organization Pattern

### Feature Directory Structure
```
app/[feature]/
├── components/           # Client components for this feature
│   ├── [feature-name]-client.tsx
│   ├── [feature-name]-form.tsx
│   └── index.ts         # Re-exports
├── hooks/               # Client-side hooks
│   ├── use-[feature-name].ts
│   └── index.ts         # Re-exports
├── server/              # Server-side code
│   ├── actions.ts       # Server actions
│   ├── data.ts          # Data access layer
│   └── [specific].ts    # Feature-specific server utilities
├── utils/               # Feature-specific utilities
│   └── [utility-name].ts
├── __tests__/           # Feature tests
│   ├── actions.test.ts
│   ├── components.test.tsx
│   └── data.test.ts
├── layout.tsx           # Feature layout (if needed)
└── page.tsx             # Feature page component
```

### Current Examples

#### Booking Feature
```
app/(booking)/
├── components/
│   ├── date-selector.tsx
│   ├── time-selector.tsx
│   └── booking-form.tsx
├── hooks/
│   └── use-booking-state.ts
├── server/
│   ├── actions.ts
│   ├── data.ts
│   ├── availability.ts
│   └── availability-core.ts
├── __tests__/
│   ├── actions.test.ts
│   ├── availability-calculation.test.ts
│   └── data.test.ts
└── page.tsx
```

#### Connections Feature
```
app/connections/
├── components/
│   ├── connections-client.tsx
│   ├── connection-form.tsx
│   ├── connections-list.tsx
│   └── index.ts
├── hooks/
│   ├── use-connection-form.ts
│   └── use-test-connection.ts
├── server/
│   ├── actions.ts
│   ├── data.ts
│   └── calendar-actions.ts
├── utils/
│   └── form-data-builder.ts
├── __tests__/
│   ├── actions.test.ts
│   └── cache-invalidation.test.ts
└── page.tsx
```

## Naming Conventions

### Server Actions
- **File**: `server/actions.ts`
- **Functions**: `[verb][Feature]Action` (e.g., `createConnectionAction`)
- **Exports**: Use named exports, not default exports

### Client Components
- **File**: `components/[feature-name]-client.tsx` for main component
- **Functions**: `[FeatureName]Client` (e.g., `ConnectionsClient`)
- **Exports**: Use default exports for main components

### Hooks
- **File**: `hooks/use-[feature-name].ts`
- **Functions**: `use[FeatureName]` (e.g., `useConnectionForm`)
- **Exports**: Use named exports

### Data Access
- **File**: `server/data.ts`
- **Functions**: `get[EntityName]`, `list[EntityName]`, etc.
- **Exports**: Use named exports

## Import Patterns

### Server Actions in Components
```tsx
// ✅ Import server actions explicitly
import {
  createConnectionAction,
  deleteConnectionAction,
  updateConnectionAction,
} from "@/app/connections/server/actions";

// ❌ Don't use default imports for server actions
import connectionActions from "@/app/connections/server/actions";
```

### Component Re-exports
```tsx
// components/index.ts
export { default as ConnectionsClient } from "./connections-client";
export { default as ConnectionForm } from "./connection-form";
export { default as ConnectionsList } from "./connections-list";
```

### Hook Re-exports
```tsx
// hooks/index.ts
export { useConnectionForm } from "./use-connection-form";
export { useTestConnection } from "./use-test-connection";
```

## Directory Rules

### Server Directory
- **Purpose**: Server-side code only
- **Contents**: Server actions, data access, business logic
- **Imports**: Cannot import from `components/` or `hooks/`
- **Exports**: Must use named exports

### Components Directory
- **Purpose**: Client-side React components
- **Contents**: UI components, forms, lists
- **Imports**: Can import from `hooks/`, `server/actions`, and `utils/`
- **Exports**: Default exports for main components, named for utilities

### Hooks Directory
- **Purpose**: Client-side React hooks
- **Contents**: Custom hooks, state management
- **Imports**: Can import from `server/actions` and `utils/`
- **Exports**: Named exports only

### Utils Directory
- **Purpose**: Feature-specific utilities
- **Contents**: Helper functions, formatters, builders
- **Imports**: Should be pure functions with minimal dependencies
- **Exports**: Named exports only

## Cross-Feature Dependencies

### Allowed
- Features can import from `lib/` (shared utilities)
- Features can import from `components/ui/` (shared UI components)
- Features can import from `infrastructure/` (shared infrastructure)

### Restricted
- Features should not import from other feature directories
- Use shared utilities in `lib/` for cross-feature functionality
- Use URL state or props for cross-feature communication

## Enforcement

### ESLint Rules
- Enforce import restrictions between directories
- Require specific naming patterns for server actions
- Prevent server code from importing client code
- Enforce consistent export patterns

### File Naming
- Use kebab-case for file names
- Include feature name in main component files
- Use descriptive names for utility files

## When to Deviate

### Simple Features
For very simple features with minimal code:
- May skip `utils/` directory
- May combine related functionality in fewer files
- Still maintain server/client separation

### Complex Features
For complex features with many subdomains:
- May add subdirectories within `components/`
- May split server actions into multiple files
- May add feature-specific types directory

## Migration Strategy

### Existing Code
1. Identify files that don't follow the pattern
2. Move files to appropriate directories
3. Update imports across the codebase
4. Add index files for re-exports

### New Features
1. Create directory structure first
2. Add placeholder files with proper exports
3. Implement functionality following the pattern
4. Add tests in the `__tests__/` directory

## Related Decisions
- [ADR-002: Server Actions Over API Routes](./adr-002-server-actions.md)
- [ADR-003: Feature-based Architecture](./adr-003-feature-based-architecture.md)
- [ADR-004: Minimal Dependencies Approach](./adr-004-minimal-dependencies.md)