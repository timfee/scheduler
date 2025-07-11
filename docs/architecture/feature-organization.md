# Feature Organization

## Directory Structure

Each feature follows this structure:

```
app/
  feature-name/
    _server/        # Server-only code (actions, data fetching)
    _components/    # Client components
    _hooks/         # Client-side hooks
    layout.tsx      # Feature layout (if needed)
    page.tsx        # Main page (server component by default)
```

## Rules

1. **Server components by default** - only add 'use client' when needed
2. **Data fetching happens in server components or server actions**
3. **Client components only for interactivity**
4. **Schemas go in `/lib/schemas/`**
5. **Shared utilities in `/lib/utils/`**
6. **Infrastructure code in `/infrastructure/`**

## Import Rules

- `_server/` cannot import from `_components/` or `_hooks/`
- Features should not import from other features' private directories
- Use `/lib/` for shared code between features

## Example Structure

### Booking Feature
```
app/(booking)/
  ├── _server/
  │   ├── actions.ts          # Server actions for booking
  │   └── data.ts             # Data fetching functions
  ├── _components/
  │   ├── booking-progress.tsx  # Client component for progress
  │   ├── date-selector.tsx     # Client component for date selection
  │   └── time-selector.tsx     # Client component for time selection
  ├── _hooks/
  │   └── use-booking-state.ts  # Client hook for state management
  ├── layout.tsx              # Layout with parallel routes
  └── page.tsx                # Main booking page
```

### Connections Feature
```
app/connections/
  ├── _server/
  │   ├── actions.ts          # Server actions for connections
  │   ├── calendar-actions.ts # Calendar-specific actions
  │   └── data.ts             # Data fetching functions
  ├── _components/
  │   ├── connections-client.tsx # Main client component
  │   ├── connection-form.tsx    # Form component
  │   └── connections-list.tsx   # List component
  ├── _hooks/
  │   ├── use-connection-form.ts # Form hook
  │   └── use-test-connection.ts # Test connection hook
  └── page.tsx                # Main connections page
```

### Admin Features
```
app/admin/
  ├── _components/
  │   └── navigation.tsx      # Shared admin navigation
  ├── availability/
  │   ├── _server/
  │   │   └── actions.ts      # Availability server actions
  │   ├── _components/
  │   │   ├── availability-template.tsx
  │   │   └── day-availability.tsx
  │   └── page.tsx            # Availability management page
  ├── event-types/
  │   ├── _components/
  │   │   └── event-type-manager.tsx
  │   └── page.tsx            # Event types management page
  └── connections/
      └── page.tsx            # Admin connections page
```

## Schema Organization

All schemas are centralized in `/lib/schemas/`:

```
lib/schemas/
  ├── database/               # Database table schemas
  │   ├── calendar-integrations.ts
  │   ├── calendars.ts
  │   ├── preferences.ts
  │   ├── api-cache.ts
  │   ├── appointment-types.ts
  │   └── index.ts            # Re-export all
  ├── availability.ts         # Domain schema
  ├── calendar-event.ts       # Domain schema
  ├── booking.ts              # Booking form schema
  └── connection.ts           # Connection form schema
```

## Benefits

1. **Clear separation of concerns** - server vs client code is obvious
2. **Consistent organization** - all features follow the same pattern
3. **Easier navigation** - developers know where to find code
4. **Prevents coupling** - private directories can't be imported externally
5. **Scalable** - pattern works for features of any size

## Migration Guide

When creating a new feature:

1. Create the feature directory structure
2. Start with server components in `page.tsx`
3. Move data fetching to `_server/data.ts`
4. Move server actions to `_server/actions.ts`
5. Create client components in `_components/` only when needed
6. Use `_hooks/` for client-side state management
7. Add schemas to `/lib/schemas/`
8. Keep tests alongside the code they test