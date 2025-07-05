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
