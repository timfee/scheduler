# Investigation Context for LLM

## Overview
You're working on a Next.js 15 scheduling application that needs significant refactoring. The app currently has an admin interface for managing calendar connections but lacks the customer-facing booking flow.

## Key Architecture Decisions

### 1. Parallel Routes ARE the Right Choice
The previous reviewer incorrectly dismissed parallel routes. They are PERFECT for the booking flow because:
- **Simultaneous Rendering**: Show appointment type, calendar, and time slots in separate slots
- **Independent Navigation**: Each slot updates via URL without affecting others  
- **Progressive Enhancement**: Slots appear as selections are made
- **URL State**: Everything is shareable/bookmarkable via nuqs

### 2. Remove Primary Calendar
The current system uses a boolean `isPrimary` flag which conflicts with the capability-based design. Instead:
- Add `display_order` column to sort calendars
- Select booking calendar by capability + order
- Remove all primary-related code and UI

### 3. Simplify State Management
Zustand is overkill for simple admin CRUD. Use React 19's built-in:
- `useState` for local state
- `useTransition` for optimistic updates
- Server actions for mutations

### 4. Current Problems to Fix
- 57 shadcn/ui components but probably <10 used
- URL polyfill fighting Next.js native patterns
- No customer booking routes
- Tests only found in `__tests__` folders
- No proper loading/error boundaries

### 5. Modern Next.js Patterns to Implement
- Route Groups for organization `(admin)` and `(booking)`
- Parallel routes for booking flow
- `unstable_cache` for expensive queries
- Suspense boundaries for streaming
- Route Handlers for webhooks (not server actions)

## Technical Context
- Next.js 15 with App Router
- React 19 with useTransition
- SQLite database with Drizzle ORM
- CalDAV integration for calendars
- TypeScript with strict mode
- Server Components by default

## What NOT to Do
- Don't add Storybook or unnecessary tooling
- Don't set arbitrary performance metrics
- Don't use dynamic routes for booking (use parallel routes + nuqs)
- Don't keep the primary calendar concept
- Don't use Zustand for simple state


# TODO.md

```markdown
# TODO - Scheduler Refactoring & Feature Implementation

## [ ] Phase 1: Clean Architecture & Remove Bloat

### [ ] Remove Unused Components
- [ ] Run usage audit script:
  ```bash
  for component in components/ui/*.tsx; do
    name=$(basename "$component" .tsx)
    echo "=== $name ==="
    grep -r "from.*ui/$name" app/ features/ --include="*.tsx" --include="*.ts" | wc -l
  done
  ```
- [ ] Delete components with 0 usage count
- [ ] Create `components/ui/index.ts` with exports for remaining components
- [ ] Remove shadcn/ui from package.json if no longer needed

**Definition of Done**: 
- UI components folder has only actively used components
- No unused imports warnings from ESLint
- Barrel export file created for remaining components

### [ ] Remove URL Polyfill
- [ ] Delete `url-polyfill.ts` file
- [ ] Remove `import "./url-polyfill"` from `next.config.ts`
- [ ] Search codebase for `url.parse` usage: `grep -r "url\.parse" --include="*.ts" --include="*.tsx"`
- [ ] Replace any found instances with `new URL()` constructor
- [ ] Run `pnpm test` to ensure CalDAV operations work

**Definition of Done**:
- No url-polyfill.ts in codebase
- No imports of url.parse
- All tests pass

## [ ] Phase 2: Fix Data Model

### [ ] Remove Primary Calendar Concept
- [ ] Add display_order column to database:
  ```sql
  ALTER TABLE calendar_integrations ADD COLUMN display_order INTEGER DEFAULT 0;
  CREATE INDEX idx_integrations_order ON calendar_integrations(display_order);
  ```
- [ ] Update `infrastructure/database/schema.ts`:
  ```typescript
  // Remove: isPrimary: integer("is_primary", { mode: "boolean" })
  // Add: displayOrder: integer("display_order").notNull().default(0)
  ```
- [ ] Delete these functions from `infrastructure/database/integrations.ts`:
  - `getPrimaryCalendarIntegration()`
  - `setPrimaryConnectionAction()`
- [ ] Create new capability-based selector in `infrastructure/database/integrations.ts`:
  ```typescript
  export async function getBookingCalendar() {
    const calendars = await db
      .select()
      .from(calendarIntegrations)
      .where(/* config contains BOOKING capability */)
      .orderBy(asc(calendarIntegrations.displayOrder))
      .limit(1);
    return calendars[0] || null;
  }
  ```
- [ ] Remove from UI components:
  - Primary badge in `ConnectionsList`
  - Set Primary button in `ConnectionsList`
  - isPrimary field from forms
- [ ] Add calendar reordering:
  - Add up/down arrow buttons to `ConnectionsList`
  - Create `updateCalendarOrder` server action
  - Update display_order when arrows clicked

**Definition of Done**:
- Database has display_order column, no is_primary column
- No primary-related functions or UI elements
- Calendars can be reordered via UI
- Booking calendar selected by capability + order

### [ ] Replace Zustand with React State
- [ ] Delete `features/connections/stores/connection-store.ts`
- [ ] Update `features/connections/components/connections-client.tsx`:
  ```typescript
  // Replace: const { connections, setConnections, ... } = useConnectionStore();
  // With: const [connections, setConnections] = useState(initialConnections);
  ```
- [ ] Implement optimistic updates with React 19:
  ```typescript
  const [isPending, startTransition] = useTransition();
  
  const handleDelete = async (id: string) => {
    startTransition(() => {
      setConnections(prev => prev.filter(c => c.id !== id));
    });
    try {
      await deleteConnectionAction(id);
    } catch (error) {
      // Revert on error
      setConnections(initialConnections);
    }
  };
  ```
- [ ] Remove zustand from package.json: `pnpm remove zustand`
- [ ] Remove zustand devtools imports

**Definition of Done**:
- No zustand imports anywhere
- Optimistic updates work smoothly
- Error states revert optimistic changes

## [ ] Phase 3: Implement Parallel Routes Booking Flow

### [ ] Setup nuqs for URL State
- [ ] Install nuqs: `pnpm add nuqs`
- [ ] Create `app/providers.tsx`:
  ```typescript
  'use client'
  import { NuqsAdapter } from 'nuqs/adapters/next/app'
  
  export function Providers({ children }: { children: React.ReactNode }) {
    return <NuqsAdapter>{children}</NuqsAdapter>
  }
  ```
- [ ] Update `app/layout.tsx` to wrap with Providers:
  ```typescript
  import { Providers } from './providers'
  
  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    )
  }
  ```

**Definition of Done**:
- nuqs installed
- Providers wrapper in place
- Can use useQueryState in components

### [ ] Create Parallel Routes Structure
- [ ] Create folder structure:
  ```
  app/
    (booking)/
      layout.tsx
      page.tsx
      @apptType/
        page.tsx
        loading.tsx
        error.tsx
      @date/
        page.tsx
        loading.tsx
        error.tsx
      @time/
        page.tsx
        loading.tsx
        error.tsx
  ```
- [ ] Implement `app/(booking)/layout.tsx`:
  ```typescript
  export default function BookingLayout({
    children,
    apptType,
    date,
    time,
  }: {
    children: React.ReactNode
    apptType: React.ReactNode
    date: React.ReactNode
    time: React.ReactNode
  }) {
    return (
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        <div>{apptType}</div>
        <div>{date}</div>
        <div>{time}</div>
        {children}
      </div>
    )
  }
  ```
- [ ] Create loading states for each slot
- [ ] Create error boundaries for each slot

**Definition of Done**:
- All parallel route folders exist
- Layout renders all slots
- Loading and error states work independently

### [ ] Build Booking Components
- [ ] Create `features/booking/hooks/use-booking-state.ts`:
  ```typescript
  import { parseAsString, parseAsIsoDateTime, useQueryStates } from 'nuqs'
  
  export const bookingParsers = {
    type: parseAsString.withDefault(''),
    date: parseAsIsoDateTime,
    time: parseAsString.withDefault(''),
  }
  
  export function useBookingState() {
    return useQueryStates(bookingParsers)
  }
  ```
- [ ] Implement `@apptType/page.tsx`:
  - Fetch appointment types from database
  - Display as cards or list
  - Update URL when clicked using nuqs
- [ ] Implement `@date/page.tsx`:
  - Show calendar only if type selected
  - Fetch availability for selected type
  - Highlight available dates
  - Update URL when date clicked
- [ ] Implement `@time/page.tsx`:
  - Show time slots only if date selected
  - Fetch available times for type + date
  - Update URL when time clicked
- [ ] Implement main booking `page.tsx`:
  - Show confirmation when all selected
  - Create booking form for user details
  - Server action to save booking

**Definition of Done**:
- Each slot updates URL independently
- Back button preserves selections
- Shareable URLs work
- Booking can be completed

## [ ] Phase 4: Testing & Performance

### [ ] Update Test Configuration
- [ ] Edit `jest.config.ts`:
  ```typescript
  testMatch: ["**/*.test.ts", "**/*.test.tsx"]
  ```
- [ ] Move existing tests next to source:
  - `features/connections/__tests__/actions.test.ts` → `features/connections/actions/actions.test.ts`
  - Delete empty `__tests__` folders
- [ ] Update relative imports in moved tests
- [ ] Run `pnpm test` to verify all tests found

**Definition of Done**:
- Tests can live next to source files
- All existing tests still pass
- No empty test folders

### [ ] Optimize Next.js Patterns
- [ ] Add caching to expensive queries:
  ```typescript
  import { unstable_cache } from 'next/cache'
  
  export const getCachedCalendars = unstable_cache(
    async () => listCalendarIntegrations(),
    ['calendars'],
    { revalidate: 300, tags: ['calendars'] }
  )
  ```
- [ ] Add Suspense boundaries to booking slots:
  ```typescript
  <Suspense fallback={<div>Loading times...</div>}>
    <TimeSlots date={selectedDate} />
  </Suspense>
  ```
- [ ] Create proper loading.tsx files with skeletons
- [ ] Add error.tsx files with reset functionality
- [ ] Move webhooks to Route Handlers:
  ```typescript
  // app/api/webhooks/calendar/route.ts
  export async function POST(request: Request) {
    const signature = request.headers.get('x-webhook-signature')
    // Verify and process webhook
  }
  ```

**Definition of Done**:
- Database queries cached where appropriate
- Loading states use Suspense
- Webhook endpoints as Route Handlers
- Error boundaries catch and display errors

## [ ] Phase 5: Code Quality & Documentation

### [ ] Remove Dead Code
- [ ] Find unused exports:
  ```bash
  # Find all export statements
  grep -r "export" --include="*.ts" --include="*.tsx" features/ > exports.txt
  # Find all import statements
  grep -r "import.*from" --include="*.ts" --include="*.tsx" features/ > imports.txt
  # Manual review for unused exports
  ```
- [ ] Delete identified unused exports
- [ ] Remove these specific unused imports found in review:
  - `app/connections/page.tsx` - AlertTitle if unused
  - Any UI components with 0 usage from Phase 1
- [ ] Consolidate duplicate type definitions:
  - Search for `type.*=.*{` to find all type definitions
  - Move shared types to `types/` folder
  - Remove duplicates

**Definition of Done**:
- No unused exports in features folder
- No duplicate type definitions
- Each file exports only what's imported elsewhere

### [ ] Add Documentation
- [ ] Add JSDoc to complex functions:
  ```typescript
  /**
   * Fetches available time slots for a given appointment type and date
   * @param appointmentType - The type of appointment
   * @param date - The selected date
   * @returns Array of available time slots with UTC timestamps
   */
  export async function getAvailableSlots(appointmentType: string, date: Date) {
    // ...
  }
  ```
- [ ] Document these specific functions:
  - `prepareConfig()` - explain well-known URL resolution
  - `getBookingCalendar()` - explain capability ordering
  - `encrypt()/decrypt()` - explain encryption format
  - All server actions - explain parameters and errors
- [ ] Create README.md for each feature:
  - `features/connections/README.md` - explain architecture
  - `features/booking/README.md` - explain parallel routes flow
- [ ] Update root README.md with:
  - Clear setup instructions
  - Environment variable requirements
  - Architecture overview

**Definition of Done**:
- Complex functions have JSDoc comments
- Each feature folder has a README
- Root README accurately describes project

### [ ] Improve Type Safety
- [ ] Remove all `as` type assertions:
  ```bash
  grep -r " as " --include="*.ts" --include="*.tsx" features/
  ```
- [ ] Replace with proper type guards:
  ```typescript
  // Instead of: const config = data as Config
  // Use: 
  function isConfig(data: unknown): data is Config {
    return typeof data === 'object' && data !== null && 'authMethod' in data
  }
  ```
- [ ] Fix all TypeScript strict mode errors:
  - Run `pnpm tsc --noEmit`
  - Fix each error without using `any` or `as`
- [ ] Enable `noUncheckedIndexedAccess` in tsconfig.json

**Definition of Done**:
- No `as` assertions in features folder
- TypeScript strict mode passes
- All array/object access is null-checked
```
