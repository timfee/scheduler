# Calendar Connections

This feature manages calendar integrations for the scheduler application, allowing users to connect various calendar providers (Apple iCloud, Google Calendar, Fastmail, Nextcloud, and generic CalDAV) for conflict checking, availability management, and event booking.

## Features

- **Well-Known Provider Support**: Pre-configured support for major calendar providers
- **Multiple Calendar Support**: Connect multiple calendars from different providers
- **Type-Safe Implementation**: Full TypeScript support with no `any` types
- **Secure Credential Storage**: All credentials are encrypted using AES-256-GCM
- **Flexible Capabilities**: Configure each calendar for different purposes:
  - **Conflict Checking**: Booked time is considered blocked
  - **Availability Checking**: Booked time is available unless explicitly blocked
  - **Booking**: Create new events in the calendar
- **Primary Calendar**: Designate one calendar as the primary for booking new events

## Supported Providers

| Provider        | Authentication                | Server URL                                         | Status       |
| --------------- | ----------------------------- | -------------------------------------------------- | ------------ |
| Apple iCloud    | Basic (App-specific password) | `https://caldav.icloud.com`                        | ✅ Supported |
| Google Calendar | OAuth 2.0                     | `https://apidata.googleusercontent.com/caldav/v2/` | ✅ Supported |
| Fastmail        | Basic                         | `https://caldav.fastmail.com/dav/calendars`        | ✅ Supported |
| Nextcloud       | Basic                         | User-provided                                      | ✅ Supported |
| Generic CalDAV  | Basic                         | User-provided                                      | ✅ Supported |

## Architecture

### Database Schema

Calendar integrations are stored in the `calendar_integrations` table:

```sql
calendar_integrations (
  id TEXT PRIMARY KEY,              -- UUID
  provider TEXT NOT NULL,           -- 'apple', 'google', 'fastmail', 'nextcloud', 'caldav'
  display_name TEXT NOT NULL,       -- User-friendly name
  encrypted_config TEXT NOT NULL,   -- Encrypted JSON configuration
  is_primary INTEGER DEFAULT 0,     -- Boolean flag for primary calendar
  created_at INTEGER NOT NULL,      -- Timestamp
  updated_at INTEGER NOT NULL       -- Timestamp
)
```

### Security

- Credentials are encrypted using AES-256-GCM with a 64-character hex key
- Each encrypted value includes an IV, auth tag, and encrypted data
- The encryption key must be set in the `ENCRYPTION_KEY` environment variable
- Sensitive data is never exposed to the client
- Type-safe boundaries between server and client code

### Type System

The implementation uses discriminated unions for configuration:

```typescript
type CalendarIntegrationConfig = BasicAuthConfig | OAuthConfig;

interface BasicAuthConfig {
  authMethod: "Basic";
  username: string;
  password: string;
  serverUrl: string;
  calendarUrl?: string;
  capabilities: string[];
}

interface OAuthConfig {
  authMethod: "Oauth";
  username: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  serverUrl: string;
  calendarUrl?: string;
  capabilities: string[];
}
```

## Provider Setup Guide

### Apple iCloud

1. Generate an app-specific password:
   - Go to [appleid.apple.com](https://appleid.apple.com)
   - Sign in and navigate to "Sign-In and Security"
   - Select "App-Specific Passwords"
   - Generate a new password for "Scheduler"

2. In the app:
   - Select "Apple iCloud" as the provider
   - Enter your Apple ID as the username
   - Enter the app-specific password
   - No server URL needed (uses well-known URL)

### Google Calendar

1. Set up OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Calendar API
   - Create OAuth 2.0 credentials
   - Add `https://www.googleapis.com/auth/calendar` to scopes
   - Obtain refresh token using OAuth flow

2. In the app:
   - Select "Google Calendar" as the provider
   - Enter your email address
   - Enter Client ID, Client Secret, and Refresh Token
   - No server URL needed (uses well-known URL)

### Fastmail

1. Generate an app password:
   - Log into Fastmail
   - Go to Settings → Privacy & Security → Integrations
   - Create a new app password

2. In the app:
   - Select "Fastmail" as the provider
   - Enter your Fastmail email as username
   - Enter the app password
   - No server URL needed (uses well-known URL)

### Nextcloud

1. In the app:
   - Select "Nextcloud" as the provider
   - Enter your full Nextcloud server URL (e.g., `https://cloud.example.com`)
   - Enter your Nextcloud username
   - Enter your Nextcloud password (or app password if 2FA is enabled)

### Generic CalDAV

For any CalDAV-compliant server not listed above:

1. In the app:
   - Select "Generic CalDAV" as the provider
   - Enter the full CalDAV server URL
   - Enter your username and password
   - Optionally specify a calendar URL for a specific calendar

## Usage

### Environment Setup

1. Generate a secure encryption key:

   ```bash
   openssl rand -hex 32
   ```

2. Set the environment variable in `.env`:
   ```bash
   ENCRYPTION_KEY=your-64-character-hex-string
   NODE_ENV=development
   ```

### Database Initialization

Run the database initialization script:

```bash
pnpm db:init
```

### Adding a Connection

1. Navigate to `/connections`
2. Click "Add Connection"
3. Select your provider from the dropdown
4. Fill in the required authentication fields
5. Select capabilities:
   - Enable "Conflict Checking" to block busy times
   - Enable "Availability Checking" for availability-based scheduling
   - Enable "Booking" to create events in this calendar
6. Test the connection
7. Save the integration

## Server Actions

All calendar operations are handled through type-safe server actions:

```typescript
// Create a new connection
createConnectionAction(formData: ConnectionFormData)

// Update an existing connection
updateConnectionAction(id: string, formData: Partial<ConnectionFormData>)

// Delete a connection
deleteConnectionAction(id: string)

// List all connections (sanitized)
listConnectionsAction()

// Test calendar credentials
testConnectionAction(provider: ProviderType, config: Partial<ConnectionFormData>)

// Set a calendar as primary
setPrimaryConnectionAction(id: string)
```

## Integration with tsdav

The system uses [tsdav](https://github.com/natelindev/tsdav) for all CalDAV operations:

```typescript
// Creating a DAV client
const client = await createDAVClient({
  serverUrl: config.serverUrl,
  credentials: {
    username: config.username,
    password: config.password,
  },
  authMethod: "Basic",
  defaultAccountType: "caldav",
});

// Fetching calendars
const calendars = await client.fetchCalendars();

// Calendar operations are handled by the CalDAV provider
const provider = createCalDavProvider(client, calendarUrl);
```

## Troubleshooting

### Common Issues

1. **Connection Test Failed**
   - Verify credentials are correct
   - For Apple: Ensure you're using an app-specific password
   - For Google: Ensure OAuth tokens have calendar scope
   - Check network connectivity to the CalDAV server

2. **"No calendars found"**
   - Some providers may require specific calendar paths
   - Try leaving the Calendar URL field empty for auto-discovery
   - Ensure the account has at least one calendar

3. **Encryption Key Error**
   - Ensure `ENCRYPTION_KEY` is exactly 64 hex characters
   - The key must remain constant across deployments
   - Lost keys mean credentials cannot be decrypted

### Provider-Specific Notes

#### Apple iCloud

- Must use app-specific passwords (regular passwords won't work)
- Two-factor authentication must be enabled on your Apple ID

#### Google Calendar

- Requires OAuth 2.0 setup in Google Cloud Console
- Application may need to be verified for production use
- Refresh tokens don't expire unless explicitly revoked

#### Nextcloud

- Server URL should not include `/remote.php/dav/` (added automatically)
- If using 2FA, generate an app password in Personal Settings

## Future Enhancements

- [ ] OAuth flow UI for Google Calendar
- [ ] Microsoft Exchange/Outlook support
- [ ] Calendar color preferences
- [ ] Multi-calendar selection per integration
- [ ] Sync status indicators
- [ ] Rate limiting and retry logic
- [ ] Import/export configurations
