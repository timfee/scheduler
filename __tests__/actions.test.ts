import { describe, beforeAll, beforeEach, it, expect, jest } from '@jest/globals';
import { CAPABILITY } from '../types/constants';
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('tsdav', () => ({
  createDAVClient: jest.fn().mockResolvedValue({
    fetchCalendars: jest.fn().mockResolvedValue([{}]),
  }),
}));

let actions: typeof import('../app/connections/actions');
let integrations: typeof import('../lib/db/integrations');
let db: BetterSQLite3Database<typeof schema>;
// Reuse the `sql` tagged template from drizzle for manual queries

beforeAll(async () => {
  process.env.NODE_ENV = "development";
  process.env.ENCRYPTION_KEY = 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148';
  process.env.SQLITE_PATH = ':memory:';

  const dbModule = await import('../lib/db');
  db = dbModule.db;
  db.run(sql`
    CREATE TABLE IF NOT EXISTS calendar_integrations (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      display_name TEXT NOT NULL,
      encrypted_config TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  integrations = await import('../lib/db/integrations');
  actions = await import('../app/connections/actions');
});

beforeEach(() => {
  jest.restoreAllMocks();
  db.run(sql`DELETE FROM calendar_integrations`);
});

describe('createConnectionAction validation', () => {
  it('requires username and password for Basic auth', async () => {
    const result = await actions.createConnectionAction({
      provider: 'caldav',
      displayName: 'Test',
      authMethod: 'Basic',
      username: '',
      password: '',
      serverUrl: 'https://x',
      capabilities: [CAPABILITY.CONFLICT],
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch('Username is required');
  });

  it('requires server URL for caldav provider', async () => {
    const result = await actions.createConnectionAction({
      provider: 'caldav',
      displayName: 'Test',
      authMethod: 'Basic',
      username: 'u',
      password: 'p',
      capabilities: [CAPABILITY.CONFLICT],
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch('Server URL is required');
  });

  it('requires OAuth fields', async () => {
    const result = await actions.createConnectionAction({
      provider: 'google',
      displayName: 'G',
      authMethod: 'Oauth',
      username: 'u',
      refreshToken: '',
      clientId: '',
      clientSecret: '',
      tokenUrl: '',
      capabilities: [CAPABILITY.CONFLICT],
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch('All OAuth fields are required');
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
      capabilities: [CAPABILITY.CONFLICT],
    });
    expect(res.success).toBe(true);
    const created = await integrations.listCalendarIntegrations();
    expect(created).toHaveLength(1);
  });
});

describe('updateConnectionAction', () => {
  it('returns error when connection not found', async () => {
    const result = await actions.updateConnectionAction('missing', {});
    expect(result.success).toBe(false);
    expect(result.error).toMatch('Connection not found');
  });
});

describe('testConnectionAction validation', () => {
  it('validates Basic auth', async () => {
    const res = await actions.testConnectionAction('caldav', {
      authMethod: 'Basic',
      username: '',
      password: '',
      capabilities: [CAPABILITY.CONFLICT],
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch('Username is required');
  });

  it('validates OAuth auth', async () => {
    const res = await actions.testConnectionAction('google', {
      authMethod: 'Oauth',
      username: 'u',
      refreshToken: '',
      clientId: '',
      clientSecret: '',
      tokenUrl: '',
      capabilities: [CAPABILITY.CONFLICT],
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch('All OAuth fields are required');
  });
});
