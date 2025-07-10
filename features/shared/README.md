# Shared Feature

Reusable utilities shared across feature modules.

## Installation

The shared helpers are bundled with the main application, so no extra steps are required. Import modules directly from `@/features/shared`.

## Usage

```ts
import { userMessageFromError } from '@/features/shared/errors';

try {
  // ...
} catch (err) {
  const msg = userMessageFromError(err, 'Something went wrong');
  console.error(msg);
}
```

## Integrating with Features

Other feature modules should rely on these helpers for consistent error handling and any future shared logic. Additional utilities can be added here as the codebase grows.

Currently the folder exposes:

- **errors.ts** – Maps internal errors to user-friendly messages.

More utilities may be added as new features share common code.
