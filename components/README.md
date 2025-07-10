# Component Organization

This document outlines the standardized component organization for the Scheduler application.

## Directory Structure

### `components/ui/`
Base UI components from shadcn/ui library. These are reusable, low-level components that form the foundation of the design system.

Examples:
- `button.tsx` - Button component
- `card.tsx` - Card component
- `form.tsx` - Form components
- `input.tsx` - Input component

### `components/layout/`
App-wide layout components that define the overall structure and navigation of the application.

Examples:
- `navigation.tsx` - Main navigation component
- `header.tsx` - Page headers
- `footer.tsx` - Page footers

### `components/` (root level)
App-specific components that are used across multiple features but don't fit into the UI or layout categories.

Examples:
- `connection-form.tsx` - Form for creating connections
- `provider-select.tsx` - Provider selection component

### `features/*/components/`
Feature-specific components that are only used within a particular feature. These components should not be imported from outside their feature directory.

## Import Guidelines

### Using Barrel Exports
Import shared components from the main components barrel:

```typescript
import { Navigation, Button, Card } from "@/components";
```

### Direct Imports
For specific UI components, you can also import directly:

```typescript
import { Button } from "@/components/ui/button";
```

### Feature Components
Feature-specific components should be imported directly from their feature directory:

```typescript
import { FeatureSpecificComponent } from "@/features/feature-name/components/component-name";
```

## Rules

1. **No new top-level component directories** - All shared components should go in `ui/`, `layout/`, or the root `components/` directory
2. **Feature isolation** - Feature-specific components should remain in their feature directories
3. **Clear categorization** - Components should be placed in the appropriate category based on their purpose
4. **Consistent imports** - Use barrel exports for shared components when possible

## ESLint Rules

The following ESLint rules help enforce this organization:

- Prevent creation of new top-level component directories outside of `ui/` and `layout/`
- Encourage use of barrel exports for shared components