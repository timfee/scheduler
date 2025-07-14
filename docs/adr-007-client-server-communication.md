# ADR-007: Client-Server Communication Patterns

## Status

Accepted

## Context

React Server Components and Next.js Server Actions enable new patterns for client-server communication. The application needs consistent patterns for data flow between client components and server actions, including error handling, loading states, and optimistic updates.

## Decision

Establish standardized patterns for client-server communication that leverage Server Actions while maintaining type safety and good user experience.

## Consequences

### Positive

- **Type safety**: End-to-end type safety from client to server
- **Simplified data flow**: Clear patterns for common operations
- **Better error handling**: Consistent error handling across features
- **Optimistic updates**: Improved user experience with immediate feedback
- **Code consistency**: Predictable patterns across the application

### Negative

- **Learning curve**: Developers need to understand the specific patterns
- **Boilerplate**: Some repetitive code for common operations
- **Error complexity**: Error handling can be complex with optimistic updates

## Communication Patterns

### 1. Server Action Definition Pattern

```tsx
// app/[feature]/server/actions.ts
"use server";

import { FormDataSchema } from "@/lib/schemas/[feature]";
import { revalidatePath, revalidateTag } from "next/cache";

export async function createEntityAction(
  formData: FormDataType,
): Promise<{ id: string; [key: string]: any }> {
  try {
    // 1. Validate input
    const parsed = FormDataSchema.safeParse(formData);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message);
    }

    // 2. Business logic
    const result = await createEntity(parsed.data);

    // 3. Cache invalidation
    revalidatePath("/[feature]");
    revalidateTag("[feature]");

    // 4. Return success result
    return result;
  } catch (error) {
    // 5. Error mapping
    throw new Error(mapErrorToUserMessage(error, "Failed to create entity"));
  }
}
```

### 2. Client Component Pattern

```tsx
// app/[feature]/components/[feature]-client.tsx
"use client";

import { useState, useTransition } from "react";
import { createEntityAction } from "@/app/[feature]/server/actions";

export default function FeatureClient({ initialData }: Props) {
  // 1. State management
  const [entities, setEntities] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 2. Optimistic update helpers
  const addEntity = (entity: Entity) =>
    setEntities((prev) => [...prev, entity]);

  const updateEntity = (entity: Entity) =>
    setEntities((prev) => prev.map((e) => (e.id === entity.id ? entity : e)));

  const removeEntity = (id: string) =>
    setEntities((prev) => prev.filter((e) => e.id !== id));

  // 3. Server action handlers
  const handleCreate = async (formData: FormDataType) => {
    setError(null);

    // Optimistic update
    const tempEntity = { ...formData, id: `temp-${Date.now()}` };
    addEntity(tempEntity);

    try {
      startTransition(async () => {
        const result = await createEntityAction(formData);
        // Replace temp entity with real one
        updateEntity(result);
      });
    } catch (error) {
      // Rollback optimistic update
      removeEntity(tempEntity.id);
      setError(error instanceof Error ? error.message : "Failed to create entity");
    }
  };

  return (
    // JSX with error handling and loading states
  );
}
```

### 3. Error Handling Pattern

```tsx
// lib/errors.ts
export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "BusinessError";
  }
}

export function mapErrorToUserMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof BusinessError) {
    return ERROR_MESSAGES[error.code] || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

// Server action error handling
export async function createEntityAction(formData: FormDataType) {
  try {
    // ... business logic
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new BusinessError(error.message, "VALIDATION_FAILED");
    }
    throw new Error(mapErrorToUserMessage(error, "Failed to create entity"));
  }
}
```

### 4. Loading States Pattern

```tsx
// Client component with loading states
export default function FeatureClient() {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormDataType) => {
    setIsSubmitting(true);

    try {
      startTransition(async () => {
        await createEntityAction(formData);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Button disabled={isPending || isSubmitting}>
        {isPending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
```

### 5. Optimistic Updates Pattern

```tsx
// Advanced optimistic updates with rollback
export default function FeatureClient() {
  const [entities, setEntities] = useState(initialData);
  const [optimisticOperations, setOptimisticOperations] = useState<
    Map<string, any>
  >(new Map());

  const handleUpdate = async (id: string, updates: Partial<Entity>) => {
    const originalEntity = entities.find((e) => e.id === id);
    if (!originalEntity) return;

    const optimisticEntity = { ...originalEntity, ...updates };
    const operationId = `update-${id}-${Date.now()}`;

    // Store operation for potential rollback
    setOptimisticOperations((prev) =>
      new Map(prev).set(operationId, originalEntity),
    );

    // Apply optimistic update
    updateEntity(optimisticEntity);

    try {
      const result = await updateEntityAction(id, updates);
      // Replace with server result
      updateEntity(result);
    } catch (error) {
      // Rollback to original state
      updateEntity(originalEntity);
      setError(error instanceof Error ? error.message : "Update failed");
    } finally {
      // Clean up operation tracking
      setOptimisticOperations((prev) => {
        const newMap = new Map(prev);
        newMap.delete(operationId);
        return newMap;
      });
    }
  };
}
```

## Data Flow Patterns

### 1. Initial Data Loading

```tsx
// app/[feature]/page.tsx
import FeatureClient from "./components/feature-client";
import { getInitialData } from "./server/data";

export default async function FeaturePage() {
  const initialData = await getInitialData();

  return <FeatureClient initialData={initialData} />;
}
```

### 2. Server Action Response Types

```tsx
// Consistent response types for server actions
export type ActionResult<T = any> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

// Usage in server actions
export async function createEntityAction(
  formData: FormDataType,
): Promise<ActionResult<Entity>> {
  try {
    const result = await createEntity(formData);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: mapErrorToUserMessage(error, "Failed to create entity"),
    };
  }
}
```

### 3. Cache Invalidation Pattern

```tsx
// Consistent cache invalidation
export async function createEntityAction(formData: FormDataType) {
  // ... business logic

  // Invalidate specific paths
  revalidatePath("/[feature]");
  revalidatePath("/[feature]/[id]");

  // Invalidate cache tags
  revalidateTag("[feature]");
  revalidateTag(`[feature]-${result.id}`);

  return result;
}
```

## Form Handling Patterns

### 1. Server Action Form Submission

```tsx
// Direct form submission to server action
export default function SimpleForm() {
  return (
    <form action={createEntityAction}>
      <input name="title" required />
      <Button type="submit">Create</Button>
    </form>
  );
}
```

### 2. Client-Side Form Handling

```tsx
// Client-side form handling with validation
export default function AdvancedForm() {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await createEntityAction(formData);
      setFormData(initialData);
      setErrors({});
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>{/* Form fields with error handling */}</form>
  );
}
```

## Anti-Patterns to Avoid

### ❌ Don't Use API Routes for Internal Operations

```tsx
// ❌ Avoid this pattern
const response = await fetch("/api/entities", {
  method: "POST",
  body: JSON.stringify(formData),
});
const result = await response.json();
```

### ❌ Don't Mix Server and Client Code

```tsx
// ❌ Don't do this
"use server";

import { useState } from "react"; // Client-side code in server file

export async function badServerAction() {
  // Server action with client-side imports
}
```

### ❌ Don't Skip Error Handling

```tsx
// ❌ Don't skip error handling
const handleSubmit = async (formData: FormDataType) => {
  // Direct server action call without error handling
  await createEntityAction(formData);
};
```

## Testing Patterns

### 1. Server Action Testing

```tsx
// app/[feature]/__tests__/actions.test.ts
import { createEntityAction } from "../server/actions";

describe("createEntityAction", () => {
  it("creates entity successfully", async () => {
    const result = await createEntityAction(validFormData);
    expect(result.id).toBeDefined();
  });

  it("handles validation errors", async () => {
    await expect(createEntityAction(invalidFormData)).rejects.toThrow();
  });
});
```

### 2. Client Component Testing

```tsx
// app/[feature]/__tests__/components.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";

import FeatureClient from "../components/feature-client";

// Mock server actions
jest.mock("../server/actions", () => ({
  createEntityAction: jest.fn(),
}));

describe("FeatureClient", () => {
  it("handles form submission", async () => {
    render(<FeatureClient initialData={[]} />);

    fireEvent.click(screen.getByText("Create"));

    expect(createEntityAction).toHaveBeenCalled();
  });
});
```

## Related Decisions

- [ADR-002: Server Actions Over API Routes](./adr-002-server-actions.md)
- [ADR-001: Manual State Management Over Libraries](./adr-001-manual-state-management.md)
- [ADR-006: File Organization Patterns](./adr-006-file-organization-patterns.md)
