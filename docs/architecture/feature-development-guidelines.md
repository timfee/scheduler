# Feature Development Guidelines

This document outlines the patterns and practices for developing new features in the Scheduler application.

## Feature Structure

Each feature should follow this organizational pattern:

```
app/
├── feature-name/
│   ├── README.md          # Feature documentation
│   ├── actions.ts         # Server actions
│   ├── data.ts           # Data access layer
│   ├── page.tsx          # Main feature page
│   ├── layout.tsx        # Feature-specific layout (if needed)
│   ├── schemas/          # Zod validation schemas
│   │   └── feature-name.ts
│   ├── hooks/            # Custom React hooks
│   │   └── use-feature-name.ts
│   ├── components/       # Feature-specific components
│   │   ├── feature-client.tsx
│   │   └── feature-form.tsx
│   └── __tests__/        # Feature tests
│       ├── actions.test.ts
│       ├── data.test.ts
│       └── components.test.tsx

components/
├── feature-name-client.tsx    # Main client component
├── feature-name-form.tsx      # Form components
└── feature-name-list.tsx      # List components
```

## Development Patterns

### 1. Server Actions Pattern

Create server actions for all mutations:

```typescript
// app/feature-name/actions.ts
"use server";

import { mapErrorToUserMessage } from "@/lib/errors";
import { revalidatePath, revalidateTag } from "next/cache";

import { featureSchema } from "./schemas/feature-name";

export async function createFeatureAction(
  formData: FeatureFormData,
): Promise<{ id: string; name: string }> {
  try {
    // 1. Validate input
    const parsed = featureSchema.safeParse(formData);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message);
    }

    // 2. Business logic
    const result = await createFeatureRecord(parsed.data);

    // 3. Cache invalidation
    revalidatePath("/feature-name");
    revalidateTag("feature-name-list");

    return result;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to create feature"));
  }
}

export async function updateFeatureAction(
  id: string,
  formData: Partial<FeatureFormData>,
): Promise<{ id: string; name: string }> {
  try {
    // Similar pattern for updates
    const updated = await updateFeatureRecord(id, formData);

    revalidatePath("/feature-name");
    revalidateTag("feature-name-list");

    return updated;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to update feature"));
  }
}

export async function deleteFeatureAction(id: string): Promise<void> {
  try {
    await deleteFeatureRecord(id);

    revalidatePath("/feature-name");
    revalidateTag("feature-name-list");
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to delete feature"));
  }
}
```

### 2. Data Access Pattern

Separate data access from business logic:

```typescript
// app/feature-name/data.ts
import { db } from "@/infrastructure/database";
import { featureTable } from "@/infrastructure/database/schema";

export interface FeatureListItem {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getFeatures(): Promise<FeatureListItem[]> {
  const features = await db.select().from(featureTable);
  return features.map((feature) => ({
    id: feature.id,
    name: feature.name,
    description: feature.description,
    createdAt: feature.createdAt,
    updatedAt: feature.updatedAt,
  }));
}

export async function getFeature(id: string): Promise<FeatureListItem | null> {
  const feature = await db
    .select()
    .from(featureTable)
    .where(eq(featureTable.id, id));
  return feature[0] || null;
}
```

### 3. Client Component Pattern

Use manual state management with optimistic updates:

```typescript
// components/feature-name-client.tsx
"use client";

import { useState, useTransition } from "react";
import { FeatureListItem } from "@/app/feature-name/data";
import {
  createFeatureAction,
  updateFeatureAction,
  deleteFeatureAction,
} from "@/app/feature-name/actions";

interface FeatureClientProps {
  initialFeatures: FeatureListItem[];
}

export default function FeatureClient({ initialFeatures }: FeatureClientProps) {
  // State management
  const [features, setFeatures] = useState<FeatureListItem[]>(initialFeatures);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureListItem | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic updates
  const addFeature = (feature: FeatureListItem) =>
    setFeatures(prev => [...prev, feature]);

  const updateFeature = (feature: FeatureListItem) =>
    setFeatures(prev => prev.map(f => f.id === feature.id ? feature : f));

  const removeFeature = (id: string) =>
    setFeatures(prev => prev.filter(f => f.id !== id));

  // Handlers
  const handleCreate = async (formData: FeatureFormData) => {
    startTransition(async () => {
      try {
        const result = await createFeatureAction(formData);
        addFeature({
          id: result.id,
          name: result.name,
          description: formData.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setIsFormOpen(false);
      } catch (error) {
        console.error("Failed to create feature:", error);
        // Handle error (show toast, etc.)
      }
    });
  };

  const handleUpdate = async (id: string, formData: Partial<FeatureFormData>) => {
    startTransition(async () => {
      try {
        const result = await updateFeatureAction(id, formData);
        updateFeature({
          ...editingFeature!,
          name: result.name,
          updatedAt: new Date(),
        });
        setEditingFeature(null);
      } catch (error) {
        console.error("Failed to update feature:", error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteFeatureAction(id);
        removeFeature(id);
      } catch (error) {
        console.error("Failed to delete feature:", error);
      }
    });
  };

  return (
    <div>
      {/* Feature UI */}
    </div>
  );
}
```

### 4. Form Pattern

Use controlled components with validation:

```typescript
// components/feature-name-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeatureFormData } from "@/app/feature-name/schemas/feature-name";

interface FeatureFormProps {
  initialData?: Partial<FeatureFormData>;
  onSubmit: (data: FeatureFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function FeatureForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}: FeatureFormProps) {
  const [formData, setFormData] = useState<FeatureFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      await onSubmit(formData);
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ form: error.message });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="text"
          placeholder="Feature name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          disabled={isSubmitting}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <Input
          type="text"
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          disabled={isSubmitting}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
      </div>

      {errors.form && (
        <p className="text-sm text-red-500">{errors.form}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

### 5. Schema Pattern

Use Zod for validation:

```typescript
// app/feature-name/schemas/feature-name.ts
import { z } from "zod";

export const featureSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long"),
});

export type FeatureFormData = z.infer<typeof featureSchema>;
```

## State Management Patterns

### 1. Local State

Use for component-specific state:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
```

### 2. URL State

Use nuqs for shareable state:

```typescript
import { useQueryState } from "nuqs";

const [search, setSearch] = useQueryState("search", { defaultValue: "" });
const [page, setPage] = useQueryState("page", { defaultValue: "1" });
```

### 3. Server State

Use Server Actions for server data:

```typescript
// Fetch data in Server Component
const features = await getFeatures();

// Mutations in client components
const result = await createFeatureAction(formData);
```

## Error Handling

### 1. Server Action Errors

```typescript
export async function createFeatureAction(data: FeatureFormData) {
  try {
    // Business logic
    return result;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to create feature"));
  }
}
```

### 2. Client Error Handling

```typescript
const handleSubmit = async (data: FeatureFormData) => {
  try {
    await createFeatureAction(data);
    // Success handling
  } catch (error) {
    setError(error.message);
    // Error UI updates
  }
};
```

## Testing Patterns

### 1. Server Action Tests

```typescript
// app/feature-name/__tests__/actions.test.ts
import { createFeatureAction } from "../actions";

describe("createFeatureAction", () => {
  it("creates a feature successfully", async () => {
    const formData = { name: "Test Feature", description: "Test Description" };
    const result = await createFeatureAction(formData);

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Test Feature");
  });
});
```

### 2. Component Tests

```typescript
// app/feature-name/__tests__/components.test.tsx
import { render, screen } from "@testing-library/react";
import FeatureClient from "../components/feature-client";

describe("FeatureClient", () => {
  it("renders feature list", () => {
    const features = [{ id: "1", name: "Test", description: "Test" }];
    render(<FeatureClient initialFeatures={features} />);

    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

## Best Practices

### 1. Keep Components Small

- Aim for <300 lines per component
- Extract logic into custom hooks
- Split complex components into smaller pieces

### 2. Use TypeScript Strictly

- Define interfaces for all props and data
- Use Zod for runtime validation
- Avoid `any` types

### 3. Handle Loading States

```typescript
const [isPending, startTransition] = useTransition();

// Show loading state
{isPending && <LoadingSpinner />}
```

### 4. Implement Optimistic Updates

```typescript
// Update UI immediately, handle errors gracefully
const handleDelete = async (id: string) => {
  // Optimistic update
  removeFeature(id);

  try {
    await deleteFeatureAction(id);
  } catch (error) {
    // Revert on error
    addFeature(deletedFeature);
    showError(error.message);
  }
};
```

### 5. Use Consistent Naming

- `FeatureClient` for main client components
- `FeatureForm` for form components
- `FeatureList` for list components
- `useFeatureName` for custom hooks
- `createFeatureAction` for server actions
