// Use Jest globals for lifecycle methods; import `jest` explicitly for mocking.
import { jest } from '@jest/globals';
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import type * as schema from '../../../infrastructure/database/schema';
import { CALENDAR_CAPABILITY } from '../../../types/constants';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));
jest.mock('tsdav', () => ({
  createDAVClient: jest.fn(async () => ({
    fetchCalendars: jest.fn<() => Promise<{ url: string }[]>>().mockResolvedValue([
      { url: 'https://calendar.local/cal1' },
    ]),
  })),
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let actions: typeof import('./actions');
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let integrations: typeof import('../../../infrastructure/database/integrations');
let db: BetterSQLite3Database<typeof schema>;
// Reuse the `sql` tagged template from drizzle for manual queries

beforeAll(async () => {
  Object.assign(process.env, { NODE_ENV: "development" });
  process.env.ENCRYPTION_KEY = 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148';
  process.env.SQLITE_PATH = ':memory:';

  const dbModule = await import('../../../infrastructure/database');
  db = dbModule.db;
  db.run(sql`
    CREATE TABLE IF NOT EXISTS calendar_integrations (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      display_name TEXT NOT NULL,
      encrypted_config TEXT NOT NULL,
      display_order INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  integrations = await import('../../../infrastructure/database/integrations');
  actions = await import('./actions');
});

beforeEach(() => {
  jest.restoreAllMocks();
  db.run(sql`DELETE FROM calendar_integrations`);
});

describe('createConnectionAction validation', () => {
  it('requires username and password for Basic auth', async () => {
    await expect(
      actions.createConnectionAction({
        provider: 'caldav',
        displayName: 'Test',
        authMethod: 'Basic',
        username: '',
        password: '',
        serverUrl: 'https://x',
        capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
      })
    ).rejects.toThrow('Username is required');
  });

  it('requires server URL for caldav provider', async () => {
    await expect(
      actions.createConnectionAction({
        provider: 'caldav',
        displayName: 'Test',
        authMethod: 'Basic',
        username: 'u',
        password: 'p',
        capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
      })
    ).rejects.toThrow('Server URL is required');
  });

  it('requires OAuth fields', async () => {
    await expect(
      actions.createConnectionAction({
        provider: 'google',
        displayName: 'G',
        authMethod: 'Oauth',
        username: 'u',
        refreshToken: '',
        clientId: '',
        clientSecret: '',
        tokenUrl: '',
        capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
      })
    ).rejects.toThrow('All OAuth fields are required');
  });

  it('creates connection when test succeeds', async () => {
    const res = await actions.createConnectionAction({
      provider: 'google',
      displayName: 'ok',
      authMethod: 'Oauth',
      username: 'u',
      refreshToken: 'r',
      clientId: 'c',
      clientSecret: 's',
      tokenUrl: 'https://token',
      capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
    });
    expect(res).toBeDefined();
    const created = await integrations.listCalendarIntegrations();
    expect(created).toHaveLength(1);
  });

  it('auto-discovers config for well-known providers', async () => {
    const res = await actions.createConnectionAction({
      provider: 'apple',
      displayName: 'iCloud',
      authMethod: 'Basic',
      username: 'user',
      password: 'pass',
      capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
    });
    expect(res).toBeDefined();
    const [integration] = await integrations.listCalendarIntegrations();
    expect(integration).toBeDefined();
    expect(integration!.config.serverUrl).toBe('https://caldav.icloud.com');
    expect(integration!.config.calendarUrl).toBeUndefined();
  });
});

describe('updateConnectionAction', () => {
  it('returns error when connection not found', async () => {
    await expect(actions.updateConnectionAction('missing', {})).rejects.toThrow(
      'Connection not found',
    );
  });
});

describe('testConnectionAction validation', () => {
  it('validates Basic auth', async () => {
    await expect(
      actions.testConnectionAction('caldav', {
        authMethod: 'Basic',
        username: '',
        password: '',
        capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
      })
    ).rejects.toThrow('Username is required');
  });

  it('validates OAuth auth', async () => {
    await expect(
      actions.testConnectionAction('google', {
        authMethod: 'Oauth',
        username: 'u',
        refreshToken: '',
        clientId: '',
        clientSecret: '',
        tokenUrl: '',
        capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
      })
    ).rejects.toThrow('All OAuth fields are required');
  });

  it('auto-discovers URLs for test action', async () => {
    await expect(
      actions.testConnectionAction('apple', {
        authMethod: 'Basic',
        username: 'u',
        password: 'p',
        capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
      })
    ).resolves.toBeUndefined();
  });
});

describe('connection calendar helpers', () => {
  it('lists calendars for an existing connection', async () => {
    const created = await actions.createConnectionAction({
      provider: 'apple',
      displayName: 'Apple',
      authMethod: 'Basic',
      username: 'u',
      password: 'p',
      capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
    });
    const list = await actions.listCalendarsForConnectionAction(created.id);
    expect(list).toEqual([
      { url: 'https://calendar.local/cal1', displayName: 'https://calendar.local/cal1' },
    ]);
  });

  it('gets connection details', async () => {
    const created = await actions.createConnectionAction({
      provider: 'apple',
      displayName: 'Apple',
      authMethod: 'Basic',
      username: 'u',
      password: 'p',
      capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
    });
    const details = await actions.getConnectionDetailsAction(created.id);
    expect(details.calendarUrl).toBeUndefined();
  });
});

describe('updateCalendarOrderAction', () => {
  it('reorders connections', async () => {
    const first = await actions.createConnectionAction({
      provider: 'apple',
      displayName: 'First',
      authMethod: 'Basic',
      username: 'u',
      password: 'p',
      capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
    });
    const second = await actions.createConnectionAction({
      provider: 'apple',
      displayName: 'Second',
      authMethod: 'Basic',
      username: 'u',
      password: 'p',
      capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
    });

    await actions.updateCalendarOrderAction(second.id, 'up');
    const list = await actions.listConnectionsAction();
    expect(list[0]).toBeDefined();
    expect(list[1]).toBeDefined();
    expect(list[0]!.id).toBe(second.id);
    expect(list[1]!.id).toBe(first.id);
  });
});
