# Environment Variables

This document describes the environment variables required for the scheduler application and how to set them up for different environments.

## Required Environment Variables

### Production/Development

- **`ENCRYPTION_KEY`** (required): A 64-character hex string used for encrypting sensitive data
  - Format: Must match regex `/^[0-9A-Fa-f]{64}$/`
  - Example: `C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148`
  - Generate with: `openssl rand -hex 32`

- **`SQLITE_PATH`** (optional): Path to SQLite database file
  - Default: `scheduler.db`
  - For tests: `:memory:`

- **`WEBHOOK_SECRET`** (required): Secret key for webhook signature verification
  - Minimum length: 32 characters
  - Example: `test-webhook-secret-key-that-is-long-enough`
  - Generate with: `openssl rand -base64 32`

- **`NODE_ENV`** (optional): Application environment
  - Values: `development`, `production`, `test`
  - Default: `development`

### Optional OAuth Variables

- **`GOOGLE_OAUTH_CLIENT_ID`** (optional): Google OAuth client ID for calendar integration
- **`GOOGLE_OAUTH_CLIENT_SECRET`** (optional): Google OAuth client secret for calendar integration

## Setting Up Environment Variables

### Local Development

Create a `.env.local` file in the root directory:

```bash
ENCRYPTION_KEY=C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148
SQLITE_PATH=scheduler.db
WEBHOOK_SECRET=your-webhook-secret-here
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
```

### GitHub Actions (CI/CD)

The CI workflow uses the following environment variables:

1. **Repository Secrets** (recommended for production):
   - `ENCRYPTION_KEY`: Production encryption key
   - `WEBHOOK_SECRET`: Production webhook secret
   - `GOOGLE_OAUTH_CLIENT_ID`: Google OAuth client ID
   - `GOOGLE_OAUTH_CLIENT_SECRET`: Google OAuth client secret

2. **Default Test Values** (used when secrets are not available):
   - `ENCRYPTION_KEY`: `C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148`
   - `SQLITE_PATH`: `:memory:`
   - `WEBHOOK_SECRET`: `test-webhook-secret-key-that-is-long-enough`
   - `NODE_ENV`: `test`

### Setting GitHub Repository Secrets

To set up GitHub repository secrets:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:
   - `ENCRYPTION_KEY`: Your production encryption key (64-character hex string)
   - `WEBHOOK_SECRET`: Your production webhook secret (32+ characters)
   - `GOOGLE_OAUTH_CLIENT_ID`: Your Google OAuth client ID (if using Google integration)
   - `GOOGLE_OAUTH_CLIENT_SECRET`: Your Google OAuth client secret (if using Google integration)

## Testing

The test environment automatically sets up the required environment variables:

- Uses in-memory SQLite database (`:memory:`)
- Uses test encryption key and webhook secret
- Tests will fail if required environment variables are not properly configured

## Environment Validation

The application uses a consolidated environment validation system in `env.config.ts` that:

- Validates all environment variables on startup
- Provides clear error messages for missing or invalid values
- Supports both server-side and client-side environment variables
- Integrates with the Next.js build system

## Migration from Duplicate Configuration

Previous versions had duplicate environment validation in:

- `env.config.ts` (using `envin` library)
- `lib/utils/env.ts` (using direct `zod` validation)

This has been consolidated into a single `env.config.ts` file to eliminate duplication and conflicts.
