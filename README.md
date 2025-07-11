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

- **app/**: Next.js server and client components, organized by feature domains.
- **components/**: Shared UI components and feature-specific client components.
- **infrastructure/**: Database access, encryption utilities, and provider integrations.
- **lib/**: Miscellaneous shared helpers and validation.
- **docs/architecture/**: Architecture Decision Records (ADRs) and development guidelines.

Server actions now throw `Error` objects on failure. Client components should catch these and display a user-friendly message using helpers from `lib/errors.ts`.

### Architecture Documentation

For detailed information about architectural decisions, patterns, and development guidelines, see:

- **[Architecture Overview](./docs/architecture/README.md)**: Complete guide to the application architecture
- **[Architecture Decision Records](./docs/architecture/)**: Documented decisions about state management, server actions, dependencies, and more
- **[Development Guidelines](./docs/architecture/development-guidelines.md)**: Guidelines for maintaining simplicity and consistency
- **[Feature Development](./docs/architecture/feature-development-guidelines.md)**: Patterns for developing new features
- **[Feature Template](./docs/architecture/templates/feature-template.md)**: Template for creating new features

### Key Architectural Patterns

- **Manual State Management**: Using React hooks instead of state management libraries
- **Server Actions**: Direct server-side operations without API routes
- **Feature-based Organization**: Code organized by business domain
- **Minimal Dependencies**: Careful evaluation of new dependencies
- **In-memory Solutions**: Simple caching and rate limiting without external services

## Error handling

Errors related to calendar connections or encryption extend `CalendarConnectionError` or `EncryptionError`. These classes include a `code` field to allow mapping to descriptive messages. When an action fails, the error is caught and converted to a message for the UI using `mapErrorToUserMessage`.

