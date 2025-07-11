# ADR-004: Minimal Dependencies Approach

## Status
Accepted

## Context
Modern web applications often accumulate many dependencies to solve common problems. While libraries can accelerate development, they also introduce complexity, security risks, bundle size increases, and maintenance overhead.

## Decision
Maintain a minimal dependency approach, preferring built-in solutions and carefully evaluating each new dependency against strict criteria.

## Consequences

### Positive
- **Smaller bundle size**: Fewer dependencies mean faster load times
- **Reduced security surface**: Fewer third-party packages to monitor for vulnerabilities
- **Lower maintenance overhead**: Fewer dependencies to update and maintain
- **Better performance**: No unnecessary abstraction layers
- **Simpler debugging**: Less complex dependency chains to trace
- **Reduced lock-in**: Less dependent on external library decisions and breaking changes

### Negative
- **More implementation work**: Writing functionality that libraries provide
- **Potential reinvention**: Risk of implementing suboptimal solutions
- **Slower initial development**: More time spent on implementation vs configuration

## Current Dependencies Analysis

### Core Dependencies (Essential)
```json
{
  "next": "15.3.5",           // Framework
  "react": "^19.1.0",         // UI library
  "react-dom": "^19.1.0",     // DOM rendering
  "typescript": "^5.8.3"      // Type safety
}
```

### UI Dependencies (Justified)
```json
{
  "@radix-ui/*": "^1.x",      // Accessible UI primitives
  "tailwindcss": "^4.1.11",   // Styling system
  "lucide-react": "^0.525.0", // Icon system
  "clsx": "^2.1.1"            // Conditional classes
}
```

### Business Logic Dependencies (Minimal)
```json
{
  "drizzle-orm": "^0.44.2",   // Database ORM
  "better-sqlite3": "^12.2.0", // Database driver
  "zod": "^4.0.3",            // Validation
  "date-fns": "^4.1.0"        // Date handling
}
```

## Decision Criteria for New Dependencies

### ✅ Add a dependency if:
- **Core functionality**: Required for essential business features
- **Security-critical**: Handles authentication, encryption, or security
- **Complex domain**: Solves genuinely complex problems (date/time, parsing)
- **Standards compliance**: Implements complex standards (CalDAV, OAuth)
- **Accessibility**: Provides accessible UI components
- **Well-maintained**: Active development with good track record

### ❌ Avoid dependencies for:
- **Simple utilities**: Can be implemented in <50 lines
- **Styling solutions**: CSS and Tailwind are sufficient
- **State management**: Manual state management works well
- **Data fetching**: Server Actions are sufficient
- **Form handling**: HTML5 + React is adequate
- **Animation**: CSS animations are preferred

## Examples of Avoided Dependencies

### State Management Libraries
```tsx
// ❌ Could add Redux/Zustand
// ✅ Using manual state management
const [connections, setConnections] = useState<ConnectionListItem[]>();
const addConnection = (item: ConnectionListItem) => 
  setConnections(prev => [...prev, item]);
```

### Data Fetching Libraries
```tsx
// ❌ Could add TanStack Query/SWR
// ✅ Using Server Actions
export async function createConnectionAction(formData: ConnectionFormData) {
  const integration = await createCalendarIntegration(formData);
  revalidatePath("/connections");
  return integration;
}
```

### Form Libraries
```tsx
// ❌ Could add Formik/React Hook Form for complex forms
// ✅ Using react-hook-form only for specific validation needs
const [formData, setFormData] = useState<ConnectionFormData>(defaultValues);
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  await createConnectionAction(formData);
};
```

### Utility Libraries
```tsx
// ❌ Could add Lodash
// ✅ Using built-in array methods
const uniqueConnections = connections.filter((conn, index, arr) => 
  arr.findIndex(c => c.id === conn.id) === index
);
```

## Dependency Evaluation Process

### 1. Assessment Questions
- Can this be implemented reasonably with existing tools?
- Does this solve a genuinely complex problem?
- Is the bundle size increase justified?
- How stable is this library's API?
- How active is the maintenance?

### 2. Implementation Alternatives
- Built-in browser APIs
- React built-in hooks and patterns
- Next.js built-in features
- Tailwind CSS utilities
- Custom utility functions

### 3. Decision Documentation
Document the decision in:
- This ADR (for architectural patterns)
- Code comments (for specific implementations)
- Feature documentation (for feature-specific choices)

## Approved Dependencies by Category

### Database & ORM
- **drizzle-orm**: Type-safe database operations
- **better-sqlite3**: SQLite driver for local development
- **postgres**: PostgreSQL driver for production

### Validation & Types
- **zod**: Runtime validation and type generation
- **typescript**: Static type checking

### UI & Styling
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Consistent icon system
- **clsx**: Conditional CSS class utility

### Date & Time
- **date-fns**: Date manipulation and formatting
- **react-day-picker**: Calendar/date picker component

### External Integrations
- **tsdav**: CalDAV client for calendar integration
- **ical-generator**: iCalendar generation

## When to Reconsider

Consider adding dependencies if:
- **Team scaling**: Larger teams need more abstractions
- **Feature complexity**: Business logic becomes significantly more complex
- **Performance requirements**: Need specialized optimizations
- **Security requirements**: Need specialized security libraries
- **Compliance needs**: Need libraries for regulatory compliance

## Monitoring Dependencies

### Regular Review Process
- Monthly dependency audit
- Security vulnerability scanning
- Bundle size analysis
- Performance impact assessment

### Update Strategy
- Security updates: Immediate
- Minor updates: Monthly batch
- Major updates: Quarterly evaluation
- Breaking changes: Careful evaluation and planning

## Related Decisions
- [ADR-001: Manual State Management Over Libraries](./adr-001-manual-state-management.md)
- [ADR-002: Server Actions Over API Routes](./adr-002-server-actions.md)
- [ADR-005: In-memory Solutions Over External Services](./adr-005-in-memory-solutions.md)