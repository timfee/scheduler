# Feature Template

Use this template when creating new features for the Scheduler application.

## Feature Structure

Create the following structure for your new feature:

```
app/
├── [feature-name]/
│   ├── README.md
│   ├── actions.ts
│   ├── data.ts
│   ├── page.tsx
│   ├── layout.tsx (optional)
│   ├── schemas/
│   │   └── [feature-name].ts
│   ├── hooks/
│   │   └── use-[feature-name].ts
│   ├── components/              # Feature-specific components (local)
│   │   ├── [feature-name]-client.tsx
│   │   └── [feature-name]-form.tsx
│   └── __tests__/
│       ├── actions.test.ts
│       ├── data.test.ts
│       └── components.test.tsx

components/                      # Shared/reusable components (global)
├── [feature-name]-client.tsx    # Main client component (shared)
├── [feature-name]-form.tsx      # Form component (shared)
└── [feature-name]-list.tsx      # List component (shared)
```

**Component Directory Guidelines:**
- Use `app/[feature-name]/components/` for components that are specific to that feature and won't be reused elsewhere
- Use `components/` for components that might be shared across multiple features or used in different contexts
- Main feature components (Client, Form, List) are typically placed in the global `components/` directory for easier importing

## 1. Feature README Template

```markdown
# [Feature Name]

## Overview
Brief description of what this feature does and why it exists.

## User Stories
- As a [user type], I want [functionality] so that [benefit]
- As a [user type], I want [functionality] so that [benefit]

## Technical Implementation
- Server Actions: [list main actions]
- Components: [list main components]
- Database: [list tables/schemas used]

## API Surface
### Server Actions
- `create[Feature]Action(data: [Feature]FormData): Promise<[Feature]>`
- `update[Feature]Action(id: string, data: Partial<[Feature]FormData>): Promise<[Feature]>`
- `delete[Feature]Action(id: string): Promise<void>`
- `list[Feature]sAction(): Promise<[Feature][]>`

### Components
- `[Feature]Client`: Main client component
- `[Feature]Form`: Form component
- `[Feature]List`: List component

## Testing
- Unit tests for server actions
- Integration tests for component interactions
- End-to-end tests for user workflows

## Future Considerations
- Potential improvements
- Known limitations
- Scaling considerations
```

## 2. Schema Template

```typescript
// app/[feature-name]/schemas/[feature-name].ts
import { z } from "zod";

export const [feature]Schema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  // Add other fields as needed
});

export type [Feature]FormData = z.infer<typeof [feature]Schema>;

export const [feature]UpdateSchema = [feature]Schema.partial();
export type [Feature]UpdateData = z.infer<typeof [feature]UpdateSchema>;
```

## 3. Server Actions Template

```typescript
// app/[feature-name]/actions.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { mapErrorToUserMessage } from "@/lib/errors";
import { [feature]Schema, type [Feature]FormData } from "./schemas/[feature-name]";
import { 
  create[Feature]Record,
  update[Feature]Record,
  delete[Feature]Record,
  get[Feature]Record,
} from "./data";

export async function create[Feature]Action(
  formData: [Feature]FormData,
): Promise<{ id: string; name: string }> {
  try {
    // 1. Validate input
    const parsed = [feature]Schema.safeParse(formData);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message);
    }

    // 2. Business logic
    const result = await create[Feature]Record(parsed.data);

    // 3. Cache invalidation
    revalidatePath("/[feature-name]");
    revalidateTag("[feature-name]-list");

    return {
      id: result.id,
      name: result.name,
    };
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to create [feature]"));
  }
}

export async function update[Feature]Action(
  id: string,
  formData: Partial<[Feature]FormData>,
): Promise<{ id: string; name: string }> {
  try {
    const existing = await get[Feature]Record(id);
    if (!existing) {
      throw new Error("[Feature] not found");
    }

    const updated = await update[Feature]Record(id, formData);
    
    revalidatePath("/[feature-name]");
    revalidateTag("[feature-name]-list");
    
    return {
      id: updated.id,
      name: updated.name,
    };
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to update [feature]"));
  }
}

export async function delete[Feature]Action(id: string): Promise<void> {
  try {
    const deleted = await delete[Feature]Record(id);
    if (!deleted) {
      throw new Error("[Feature] not found");
    }
    
    revalidatePath("/[feature-name]");
    revalidateTag("[feature-name]-list");
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to delete [feature]"));
  }
}

export async function list[Feature]sAction(): Promise<[Feature]ListItem[]> {
  try {
    const data = await get[Feature]Records();
    return data;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to list [feature]s"));
  }
}
```

## 4. Data Access Template

```typescript
// app/[feature-name]/data.ts
import { db } from "@/infrastructure/database";
import { [feature]Table } from "@/infrastructure/database/schema";
import { eq } from "drizzle-orm";

export interface [Feature]ListItem {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function get[Feature]Records(): Promise<[Feature]ListItem[]> {
  const records = await db.select().from([feature]Table).orderBy([feature]Table.createdAt);
  return records.map(record => ({
    id: record.id,
    name: record.name,
    description: record.description,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));
}

export async function get[Feature]Record(id: string): Promise<[Feature]ListItem | null> {
  const records = await db.select().from([feature]Table).where(eq([feature]Table.id, id));
  const record = records[0];
  
  if (!record) return null;
  
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function create[Feature]Record(data: [Feature]FormData): Promise<[Feature]ListItem> {
  const [record] = await db.insert([feature]Table).values({
    name: data.name,
    description: data.description,
  }).returning();
  
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function update[Feature]Record(
  id: string, 
  data: Partial<[Feature]FormData>
): Promise<[Feature]ListItem> {
  const [record] = await db.update([feature]Table)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq([feature]Table.id, id))
    .returning();
  
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function delete[Feature]Record(id: string): Promise<boolean> {
  const result = await db.delete([feature]Table).where(eq([feature]Table.id, id));
  return result.changes > 0;
}
```

## 5. Main Page Template

```typescript
// app/[feature-name]/page.tsx
import { get[Feature]Records } from "./data";
import [Feature]Client from "@/components/[feature-name]-client";

export default async function [Feature]Page() {
  const [feature]s = await get[Feature]Records();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">[Feature]s</h1>
      </div>
      
      <[Feature]Client initial[Feature]s={[feature]s} />
    </div>
  );
}
```

## 6. Client Component Template

```typescript
// components/[feature-name]-client.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { [Feature]ListItem } from "@/app/[feature-name]/data";
import {
  create[Feature]Action,
  update[Feature]Action,
  delete[Feature]Action,
  type [Feature]FormData,
} from "@/app/[feature-name]/actions";
import [Feature]Form from "./[feature-name]-form";
import [Feature]List from "./[feature-name]-list";

interface [Feature]ClientProps {
  initial[Feature]s: [Feature]ListItem[];
}

export default function [Feature]Client({ initial[Feature]s }: [Feature]ClientProps) {
  // State management
  const [[feature]s, set[Feature]s] = useState<[Feature]ListItem[]>(initial[Feature]s);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing[Feature], setEditing[Feature]] = useState<[Feature]ListItem | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic updates
  const add[Feature] = ([feature]: [Feature]ListItem) =>
    set[Feature]s(prev => [...prev, [feature]]);

  const update[Feature] = ([feature]: [Feature]ListItem) =>
    set[Feature]s(prev => prev.map(f => f.id === [feature].id ? [feature] : f));

  const remove[Feature] = (id: string) =>
    set[Feature]s(prev => prev.filter(f => f.id !== id));

  // Handlers
  const handleCreate = async (formData: [Feature]FormData) => {
    startTransition(async () => {
      try {
        const result = await create[Feature]Action(formData);
        add[Feature]({
          id: result.id,
          name: result.name,
          description: formData.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setIsFormOpen(false);
      } catch (error) {
        console.error("Failed to create [feature]:", error);
        // Handle error (show toast, etc.)
      }
    });
  };

  const handleUpdate = async (id: string, formData: Partial<[Feature]FormData>) => {
    startTransition(async () => {
      try {
        const result = await update[Feature]Action(id, formData);
        update[Feature]({
          ...editing[Feature]!,
          name: result.name,
          updatedAt: new Date(),
        });
        setEditing[Feature](null);
      } catch (error) {
        console.error("Failed to update [feature]:", error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this [feature]?")) return;
    
    startTransition(async () => {
      try {
        await delete[Feature]Action(id);
        remove[Feature](id);
      } catch (error) {
        console.error("Failed to delete [feature]:", error);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Manage [Feature]s</h2>
        <Button onClick={() => setIsFormOpen(true)} disabled={isPending}>
          Add [Feature]
        </Button>
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Add New [Feature]</CardTitle>
          </CardHeader>
          <CardContent>
            <[Feature]Form
              onSubmit={handleCreate}
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={isPending}
            />
          </CardContent>
        </Card>
      )}

      {editing[Feature] && (
        <Card>
          <CardHeader>
            <CardTitle>Edit [Feature]</CardTitle>
          </CardHeader>
          <CardContent>
            <[Feature]Form
              initialData={editing[Feature]}
              onSubmit={(data) => handleUpdate(editing[Feature]!.id, data)}
              onCancel={() => setEditing[Feature](null)}
              isSubmitting={isPending}
            />
          </CardContent>
        </Card>
      )}

      <[Feature]List
        [feature]s={[feature]s}
        onEdit={setEditing[Feature]}
        onDelete={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
```

## 7. Form Component Template

```typescript
// components/[feature-name]-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { [Feature]FormData } from "@/app/[feature-name]/schemas/[feature-name]";

interface [Feature]FormProps {
  initialData?: Partial<[Feature]FormData>;
  onSubmit: (data: [Feature]FormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function [Feature]Form({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting 
}: [Feature]FormProps) {
  const [formData, setFormData] = useState<[Feature]FormData>({
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
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          disabled={isSubmitting}
          placeholder="Enter [feature] name"
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          type="text"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          disabled={isSubmitting}
          placeholder="Enter description"
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

## 8. List Component Template

```typescript
// components/[feature-name]-list.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { [Feature]ListItem } from "@/app/[feature-name]/data";
import { Edit, Trash2 } from "lucide-react";

interface [Feature]ListProps {
  [feature]s: [Feature]ListItem[];
  onEdit: ([feature]: [Feature]ListItem) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

export default function [Feature]List({ 
  [feature]s, 
  onEdit, 
  onDelete, 
  isPending 
}: [Feature]ListProps) {
  if ([feature]s.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No [feature]s found. Add one to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {[feature]s.map(([feature]) => (
        <Card key={[feature].id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{[feature].name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {[feature].description}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit([feature])}
                  disabled={isPending}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete([feature].id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
```

## 9. Test Templates

### Server Actions Test
```typescript
// app/[feature-name]/__tests__/actions.test.ts
import { create[Feature]Action, update[Feature]Action, delete[Feature]Action } from "../actions";
import { [Feature]FormData } from "../schemas/[feature-name]";

describe("[Feature] Actions", () => {
  describe("create[Feature]Action", () => {
    it("creates a [feature] successfully", async () => {
      const formData: [Feature]FormData = {
        name: "Test [Feature]",
        description: "Test Description",
      };

      const result = await create[Feature]Action(formData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe("Test [Feature]");
    });

    it("validates input data", async () => {
      const formData: [Feature]FormData = {
        name: "",
        description: "Test Description",
      };

      await expect(create[Feature]Action(formData)).rejects.toThrow();
    });
  });

  describe("update[Feature]Action", () => {
    it("updates a [feature] successfully", async () => {
      // Create a [feature] first
      const createData: [Feature]FormData = {
        name: "Original Name",
        description: "Original Description",
      };
      const created = await create[Feature]Action(createData);

      // Update the [feature]
      const updateData = { name: "Updated Name" };
      const result = await update[Feature]Action(created.id, updateData);

      expect(result.id).toBe(created.id);
      expect(result.name).toBe("Updated Name");
    });
  });

  describe("delete[Feature]Action", () => {
    it("deletes a [feature] successfully", async () => {
      // Create a [feature] first
      const createData: [Feature]FormData = {
        name: "To Delete",
        description: "Will be deleted",
      };
      const created = await create[Feature]Action(createData);

      // Delete the [feature]
      await expect(delete[Feature]Action(created.id)).resolves.not.toThrow();
    });
  });
});
```

### Component Test
```typescript
// app/[feature-name]/__tests__/components.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import [Feature]Client from "@/components/[feature-name]-client";
import { [Feature]ListItem } from "../data";

const mockData: [Feature]ListItem[] = [
  {
    id: "1",
    name: "Test [Feature]",
    description: "Test Description",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("[Feature]Client", () => {
  it("renders [feature] list", () => {
    render(<[Feature]Client initial[Feature]s={mockData} />);
    
    expect(screen.getByText("Test [Feature]")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("opens form when add button is clicked", () => {
    render(<[Feature]Client initial[Feature]s={[]} />);
    
    const addButton = screen.getByText("Add [Feature]");
    fireEvent.click(addButton);
    
    expect(screen.getByText("Add New [Feature]")).toBeInTheDocument();
  });

  it("shows edit form when edit button is clicked", () => {
    render(<[Feature]Client initial[Feature]s={mockData} />);
    
    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(screen.getByText("Edit [Feature]")).toBeInTheDocument();
  });
});
```

## Usage Instructions

1. **Replace placeholders**: Replace all `[feature-name]`, `[Feature]`, and `[feature]` with your actual feature names
2. **Customize fields**: Modify the schema and form fields to match your feature requirements
3. **Update database**: Create the appropriate database table in the schema
4. **Add navigation**: Update the navigation to include your new feature
5. **Write tests**: Implement comprehensive tests for your feature
6. **Document**: Update the feature's README with specific implementation details

## Example Replacements

For a "tasks" feature:
- `[feature-name]` → `tasks`
- `[Feature]` → `Task`
- `[feature]` → `task`

This would create:
- `app/tasks/` directory
- `TaskClient` component
- `createTaskAction` function
- `taskSchema` validation
- etc.