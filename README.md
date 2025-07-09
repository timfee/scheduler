# Scheduler

Scheduler is a Next.js application for managing calendar connections, availability, and bookings. It stores data in a local SQLite database and integrates with CalDAV providers for calendar access.

## Setup

### Install dependencies
```bash
pnpm install
```

### Environment variables
Create a `.env.local` file with at least:
```bash
ENCRYPTION_KEY=<64-character hex string>
NODE_ENV=development
```
The `ENCRYPTION_KEY` secures stored credentials. Google Calendar support requires `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.

### Initialize the database
Run once to create `scheduler.db`:
```bash
pnpm db:init
```

### Development server
```bash
pnpm dev
```
Then open [http://localhost:3000](http://localhost:3000).

## Main commands

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the application |
| `pnpm start` | Run the production server |
| `pnpm db:init` | Initialize the SQLite database |
| `pnpm db:generate` | Generate database types |
| `pnpm db:push` | Apply SQLite migrations |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Execute tests |
| `pnpm format` | Format code with Prettier |

## Architecture

- **app/**: Next.js server and client components, plus API routes.
- **features/**: Domain feature modules with components, actions, and hooks.
- **infrastructure/**: Database access, encryption utilities, and provider integrations.
- **lib/**: Miscellaneous shared helpers and validation.
- **schemas/** and **types/**: Zod schemas and shared TypeScript types.
- **test/** and **__tests__/**: Unit and integration tests.

Server actions now throw `Error` objects on failure. Client components should catch these and display a user-friendly message using helpers from `features/shared/errors.ts`.

## Error handling

Errors related to calendar connections or encryption extend `CalendarConnectionError` or `EncryptionError`. These classes include a `code` field to allow mapping to descriptive messages. When an action fails, the error is caught and converted to a message for the UI using `mapErrorToUserMessage`.

