# Scheduler

Scheduler is a Next.js application for managing calendar connections, availability, and bookings. It stores data in a local SQLite database and integrates with CalDAV providers for calendar access.

## Setup

### Quick Start

Simply run the development server, and the setup validation will guide you through any missing requirements:

```bash
pnpm install
pnpm dev
```

The validation script will automatically:

- Check for required environment variables and offer to generate them
- Verify database health and offer to create/recreate it if needed
- Guide you through the setup process with user-friendly prompts

### Manual Setup

If you prefer to set up manually or need to troubleshoot:

### Install dependencies

```bash
pnpm install
```

### Environment variables

Create a `.env.local` file with required environment variables:

```bash
# Generate environment variables with secure defaults
pnpm env:generate

# Copy the generated .env.example to .env.local
cp .env.example .env.local
```

**Required variables:**

- `ENCRYPTION_KEY`: 64-character hex string for encrypting sensitive data
- `WEBHOOK_SECRET`: 32+ character secret for webhook verification

**Optional variables:**

- `SQLITE_PATH`: Database path (default: `scheduler.db`)
- `NODE_ENV`: Environment mode (default: `development`)
- `GOOGLE_OAUTH_CLIENT_ID`: Google OAuth client ID for calendar integration
- `GOOGLE_OAUTH_CLIENT_SECRET`: Google OAuth client secret for calendar integration

📖 **See [Environment Variables Documentation](./docs/environment-variables.md) for detailed setup instructions.**

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

| Command                    | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| `pnpm dev`                 | Start the development server with setup validation    |
| `pnpm dev:skip-validation` | Start the development server without setup validation |
| `pnpm build`               | Build the application                                 |
| `pnpm start`               | Run the production server                             |
| `pnpm db:init`             | Initialize the SQLite database                        |
| `pnpm db:generate`         | Generate database types                               |
| `pnpm db:push`             | Apply SQLite migrations                               |
| `pnpm env:generate`        | Generate secure environment variables                 |
| `pnpm validate-setup`      | Run setup validation without starting the server      |
| `pnpm lint`                | Run ESLint                                            |
| `pnpm test`                | Execute tests                                         |
| `pnpm format`              | Format code with Prettier                             |

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
- **[Environment Variables](./docs/environment-variables.md)**: Environment setup and configuration guide

### Key Architectural Patterns

- **Manual State Management**: Using React hooks instead of state management libraries
- **Server Actions**: Direct server-side operations without API routes
- **Feature-based Organization**: Code organized by business domain
- **Minimal Dependencies**: Careful evaluation of new dependencies
- **In-memory Solutions**: Simple caching and rate limiting without external services

## Error handling

Errors related to calendar connections or encryption extend `CalendarConnectionError` or `EncryptionError`. These classes include a `code` field to allow mapping to descriptive messages. When an action fails, the error is caught and converted to a message for the UI using `mapErrorToUserMessage`.

## Architecture

The application follows a consistent feature-based organization pattern. Each feature has clear separation between server and client code:

- **Server code** (`_server/`): Actions, data fetching, server-only utilities
- **Client code** (`_components/`, `_hooks/`): Interactive components and client-side state
- **Schemas** (`/lib/schemas/`): Centralized data validation and types

📖 **See [Feature Organization Documentation](./docs/architecture/feature-organization.md) for detailed architecture guidelines.**

## Code Quality

This project enforces strict code quality standards that must be met before any commit:

- **TypeScript compilation**: All code must compile without errors
- **ESLint**: All linting rules must pass (includes custom performance and architectural rules)
- **Tests**: All tests must pass (281 tests currently)
- **Formatting**: Code must be formatted consistently with Prettier

### Pre-commit Checks

A pre-commit hook automatically runs all quality checks. To run them manually:

```bash
pnpm pre-commit
```

📖 **See [Code Quality Documentation](./docs/CODE_QUALITY.md) for detailed requirements and workflow.**
