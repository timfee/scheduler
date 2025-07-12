# Development Guidelines

This document provides guidelines for maintaining simplicity and consistency in the Scheduler application.

## Core Principles

### 1. Simplicity Over Complexity
- Choose the simplest solution that works
- Avoid over-engineering for hypothetical future needs
- Prefer built-in solutions over external libraries
- Keep code readable and maintainable

### 2. Consistency Over Flexibility
- Follow established patterns throughout the application
- Use consistent naming conventions
- Maintain uniform code structure across features
- Standardize error handling and validation

### 3. Explicit Over Implicit
- Make dependencies and data flow clear
- Avoid hidden side effects
- Document architectural decisions
- Use descriptive variable and function names

## When NOT to Add Dependencies

### ❌ State Management Libraries
**Don't add:** Redux, Zustand, Jotai, or similar state management libraries

**Why:** Manual state management with React hooks works well for our scale
- Current patterns are simple and debuggable
- No complex state synchronization needs
- Optimistic updates are straightforward to implement

**Instead:** Use manual state management patterns:
```typescript
// ✅ Good: Manual state management
const [connections, setConnections] = useState<Connection[]>(initialConnections);
const addConnection = (connection: Connection) => 
  setConnections(prev => [...prev, connection]);
```

### ❌ Data Fetching Libraries
**Don't add:** TanStack Query, SWR, Apollo Client, or similar data fetching libraries

**Why:** Server Actions provide sufficient functionality
- Built-in error handling and serialization
- Automatic cache invalidation with revalidatePath/revalidateTag
- Type safety from client to server

**Instead:** Use Server Actions with manual state management:
```typescript
// ✅ Good: Server Actions with manual state
export async function createConnectionAction(data: ConnectionFormData) {
  const result = await createConnection(data);
  revalidatePath("/connections");
  return result;
}
```

### ❌ Form Libraries (for simple forms)
**Don't add:** Formik, React Hook Form (for basic forms)

**Why:** HTML5 + React is sufficient for most forms
- Built-in validation is adequate
- Custom validation logic is straightforward
- Less abstraction makes debugging easier

**Instead:** Use controlled components with validation:
```typescript
// ✅ Good: Simple form state management
const [formData, setFormData] = useState<FormData>(defaultValues);
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (validateForm(formData)) {
    await submitForm(formData);
  }
};
```

**Exception:** Use React Hook Form for complex forms with:
- Dynamic field arrays
- Complex validation rules
- Multiple dependent fields

### ❌ UI Libraries Beyond shadcn/ui
**Don't add:** Material-UI, Chakra UI, Ant Design, or similar comprehensive UI libraries

**Why:** shadcn/ui + Tailwind provides sufficient components
- Keeps bundle size small
- Maintains design consistency
- Easy to customize and extend

**Instead:** Extend existing components:
```typescript
// ✅ Good: Extend existing components
import { Button } from "@/components/ui/button";

const SpecialButton = ({ children, ...props }) => (
  <Button className="special-styling" {...props}>
    {children}
  </Button>
);
```

### ❌ Animation Libraries
**Don't add:** Framer Motion, React Spring, Lottie, or similar animation libraries

**Why:** CSS animations and transitions are sufficient
- Better performance with CSS
- Smaller bundle size
- Easier to maintain

**Instead:** Use CSS animations:
```css
/* ✅ Good: CSS animations */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Exception:** Add animation libraries for:
- Complex interactive animations
- Physics-based animations
- Advanced gesture handling

### ❌ Utility Libraries
**Don't add:** Lodash, Ramda, or similar utility libraries

**Why:** Modern JavaScript provides most needed utilities
- Reduces bundle size
- Fewer dependencies to maintain
- Native methods are well-optimized

**Instead:** Use native JavaScript:
```typescript
// ❌ Don't: Lodash
import _ from "lodash";
const unique = _.uniq(array);

// ✅ Good: Native JavaScript
const unique = [...new Set(array)];
```

### ❌ Date Libraries (beyond date-fns)
**Don't add:** Moment.js, Day.js (if date-fns is sufficient)

**Why:** date-fns is already included and handles most needs
- Tree-shakeable
- Functional approach
- Good TypeScript support

**Instead:** Use date-fns:
```typescript
// ✅ Good: Use existing date-fns
import { format, addDays } from "date-fns";
const formatted = format(new Date(), "yyyy-MM-dd");
```

### ❌ HTTP Client Libraries
**Don't add:** Axios, ky, or similar HTTP client libraries

**Why:** Server Actions eliminate most HTTP client needs
- Built-in error handling
- Automatic serialization
- Type safety

**Instead:** Use Server Actions or native fetch:
```typescript
// ✅ Good: Server Actions for mutations
export async function createItem(data: ItemData) {
  return await createItemInDatabase(data);
}

// ✅ Good: Native fetch for external APIs (if needed)
const response = await fetch("/api/external", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

## When NOT to Add Complexity

### ❌ Complex State Management Patterns
**Don't implement:** Redux-like patterns, complex state machines, or event-driven architectures

**Why:** Current scale doesn't require complex state management
- State flows are simple and predictable
- No complex async state coordination needed
- Manual state management is sufficient

**Instead:** Keep state management simple:
```typescript
// ✅ Good: Simple state management
const [items, setItems] = useState<Item[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### ❌ Over-abstracted Data Layers
**Don't create:** Generic repository patterns, complex ORM abstractions, or data access layers

**Why:** Drizzle ORM provides sufficient abstraction
- Direct database queries are readable
- Type safety is built-in
- No performance overhead

**Instead:** Use direct Drizzle queries:
```typescript
// ✅ Good: Direct database queries
export async function getConnections() {
  return await db.select().from(connections);
}
```

### ❌ Complex Error Handling Systems
**Don't implement:** Global error boundaries, complex error tracking, or custom error types (unless needed)

**Why:** Simple error handling is sufficient
- Errors are handled at component level
- Server Actions provide error boundaries
- Built-in error mapping works well

**Instead:** Use simple error handling:
```typescript
// ✅ Good: Simple error handling
try {
  await createConnection(data);
} catch (error) {
  setError(mapErrorToUserMessage(error, "Failed to create connection"));
}
```

### ❌ Premature Performance Optimizations
**Don't implement:** Complex memoization, virtual scrolling, or advanced caching (unless needed)

**Why:** Application performance is currently acceptable
- React.memo and useMemo should be used judiciously
- Simple solutions often perform better
- Optimize only when bottlenecks are identified

**Instead:** Use simple optimizations:
```typescript
// ✅ Good: Simple memoization when needed
const expensiveValue = useMemo(() => 
  computeExpensiveValue(data), [data]
);
```

## Code Organization Guidelines

### 1. Keep Components Under 300 Lines
- Break large components into smaller pieces
- Extract logic into custom hooks
- Separate concerns clearly

### 2. Use Consistent File Structure
```
feature/
├── actions.ts          # Server actions
├── data.ts            # Data access
├── page.tsx           # Page component
├── components/        # Feature components
├── hooks/            # Custom hooks
├── schemas/          # Validation schemas
└── __tests__/        # Tests
```

### 3. Follow Naming Conventions
- **Components:** PascalCase (e.g., `ConnectionForm`)
- **Files:** kebab-case (e.g., `connection-form.tsx`)
- **Functions:** camelCase (e.g., `createConnection`)
- **Types:** PascalCase (e.g., `ConnectionFormData`)
- **Constants:** UPPER_CASE (e.g., `MAX_CONNECTIONS`, `TIME_ZONES`, `DEFAULT_TIME_ZONE`)
- **Environment Variables:** UPPER_CASE (e.g., `ENCRYPTION_KEY`, `WEBHOOK_SECRET`)

### 4. Use TypeScript Strictly
- Define interfaces for all props and data
- Use Zod for runtime validation
- Avoid `any` types
- Prefer type inference when possible

```typescript
// ✅ Good: Strict typing
interface ConnectionFormProps {
  initialData?: ConnectionFormData;
  onSubmit: (data: ConnectionFormData) => Promise<void>;
  onCancel: () => void;
}
```

## Testing Guidelines

### 1. Test Business Logic
- Test Server Actions
- Test data transformation functions
- Test validation schemas

### 2. Test User Interactions
- Test form submissions
- Test error handling
- Test optimistic updates

### 3. Keep Tests Simple
- One concept per test
- Clear test names
- Minimal setup/teardown

```typescript
// ✅ Good: Clear, focused test
describe("createConnectionAction", () => {
  it("creates a connection with valid data", async () => {
    const formData = { name: "Test", provider: "caldav" };
    const result = await createConnectionAction(formData);
    
    expect(result.id).toBeDefined();
    expect(result.name).toBe("Test");
  });
});
```

## Performance Guidelines

### 1. Optimize When Needed
- Profile before optimizing
- Use React DevTools Profiler
- Measure actual performance impact

### 2. Common Optimizations
- Use `React.memo` for expensive components
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers in optimized components

### 3. Avoid Premature Optimization
- Keep code simple and readable first
- Optimize only when performance issues are identified
- Measure before and after optimizations

## When to Reconsider These Guidelines

### Application Scale Changes
- User base grows significantly (>1000 concurrent users)
- Feature complexity increases substantially
- Team size grows (>10 developers)
- Performance requirements become more stringent

### Business Requirements Change
- Need for real-time features
- Complex state synchronization requirements
- Advanced UI/UX requirements
- Integration with complex external systems

### Technical Requirements Change
- Need for mobile applications
- Offline functionality requirements
- Advanced security requirements
- Compliance needs (GDPR, HIPAA, etc.)

## Decision Process

When considering adding complexity:

1. **Identify the problem**: What specific problem are you trying to solve?
2. **Evaluate current solution**: Why is the current approach insufficient?
3. **Consider alternatives**: What are the simplest ways to solve this?
4. **Assess impact**: What are the trade-offs of each approach?
5. **Make decision**: Choose the simplest solution that solves the problem
6. **Document decision**: Update ADRs or code comments as needed

## Review Process

### Regular Architecture Reviews
- Monthly review of new dependencies
- Quarterly review of architectural decisions
- Annual review of overall architecture direction

### Code Review Guidelines
- Review for simplicity and consistency
- Challenge unnecessary complexity
- Ensure adherence to established patterns
- Verify error handling and type safety