import { describe, beforeAll, beforeEach, it, expect } from '@jest/globals';

let createCalendarIntegration: typeof import('../lib/db/integrations').createCalendarIntegration;
let updateCalendarIntegration: typeof import('../lib/db/integrations').updateCalendarIntegration;
let listCalendarIntegrations: typeof import('../lib/db/integrations').listCalendarIntegrations;
let getCalendarIntegration: typeof import('../lib/db/integrations').getCalendarIntegration;
let getPrimaryCalendarIntegration: typeof import('../lib/db/integrations').getPrimaryCalendarIntegration;
let getCalendarIntegrationsByCapability: typeof import('../lib/db/integrations').getCalendarIntegrationsByCapability;
let deleteCalendarIntegration: typeof import('../lib/db/integrations').deleteCalendarIntegration;
let db: any;
let sql: any;

beforeAll(async () => {
  process.env.NODE_ENV = "development";
  process.env.ENCRYPTION_KEY = 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148';
  process.env.SQLITE_PATH = ':memory:';

  const dbModule = await import('../lib/db');
  db = (dbModule as any).db;
  sql = (await import('drizzle-orm')).sql;
  await db.run(sql`
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

  const integrations = await import('../lib/db/integrations');
  createCalendarIntegration = integrations.createCalendarIntegration;
  updateCalendarIntegration = integrations.updateCalendarIntegration;
  listCalendarIntegrations = integrations.listCalendarIntegrations;
  getCalendarIntegration = integrations.getCalendarIntegration;
  getPrimaryCalendarIntegration = integrations.getPrimaryCalendarIntegration;
  getCalendarIntegrationsByCapability = integrations.getCalendarIntegrationsByCapability;
  deleteCalendarIntegration = integrations.deleteCalendarIntegration;
});

beforeEach(async () => {
  await db.run(sql`DELETE FROM calendar_integrations`);
});

it('creates and retrieves integration with decrypted config', async () => {
  const config = {
    authMethod: 'Oauth',
    username: 'user',
    refreshToken: 'r1',
    clientId: 'c1',
    clientSecret: 's1',
    tokenUrl: 'https://token',
    serverUrl: '',
    calendarUrl: undefined,
    capabilities: [] as any[],
  };
  const integration = await createCalendarIntegration({
    provider: 'google',
    displayName: 'Google Cal',
    config,
    isPrimary: false,
  });

  const fetched = await getCalendarIntegration(integration.id);
  expect(fetched?.config).toEqual({
    ...config,
    serverUrl: 'https://apidata.googleusercontent.com/caldav/v2/',
  });
  expect(fetched?.displayName).toBe('Google Cal');
});

it('updates integration and merges config', async () => {
  const integration = await createCalendarIntegration({
    provider: 'google',
    displayName: 'Google',
    config: {
      authMethod: 'Oauth',
      username: 'u1',
      refreshToken: 'r1',
      clientId: 'c1',
      clientSecret: 's1',
      tokenUrl: 'https://token',
      serverUrl: '',
      calendarUrl: undefined,
      capabilities: [],
    },
  });

  await updateCalendarIntegration(integration.id, {
    displayName: 'Updated',
    config: { refreshToken: 'r2' } as any,
  });

  const updated = await getCalendarIntegration(integration.id);
  expect(updated?.displayName).toBe('Updated');
  expect((updated?.config as any).refreshToken).toBe('r2');
});

it('sets primary integration correctly', async () => {
  const a = await createCalendarIntegration({
    provider: 'google',
    displayName: 'A',
    config: {
      authMethod: 'Oauth',
      username: 'u',
      refreshToken: 'r',
      clientId: 'c',
      clientSecret: 's',
      tokenUrl: 'https://token',
      serverUrl: '',
      calendarUrl: undefined,
      capabilities: [],
    },
  });
  const b = await createCalendarIntegration({
    provider: 'caldav',
    displayName: 'B',
    config: {
      authMethod: 'Basic',
      username: 'u',
      password: 'p',
      serverUrl: 'https://cal.example',
      calendarUrl: undefined,
      capabilities: [],
    },
  });

  await updateCalendarIntegration(b.id, { isPrimary: true });

  const primary = await getPrimaryCalendarIntegration();
  expect(primary?.id).toBe(b.id);
  const first = await getCalendarIntegration(a.id);
  expect(first?.isPrimary).toBe(false);
});

it('deletes integration', async () => {
  const integration = await createCalendarIntegration({
    provider: 'caldav',
    displayName: 'To Delete',
    config: {
      authMethod: 'Basic',
      username: 'u',
      password: 'p',
      serverUrl: 'https://cal.example',
      calendarUrl: undefined,
      capabilities: [],
    },
  });

  const deleted = await deleteCalendarIntegration(integration.id);
  expect(deleted).toBe(true);
  const fetched = await getCalendarIntegration(integration.id);
  expect(fetched).toBeNull();
});

it('filters by capability', async () => {
  const a = await createCalendarIntegration({
    provider: 'google',
    displayName: 'A',
    config: {
      authMethod: 'Oauth',
      username: 'u',
      refreshToken: 'r',
      clientId: 'c',
      clientSecret: 's',
      tokenUrl: 'https://token',
      serverUrl: '',
      calendarUrl: undefined,
      capabilities: ['booking'],
    },
  });
  const b = await createCalendarIntegration({
    provider: 'caldav',
    displayName: 'B',
    config: {
      authMethod: 'Basic',
      username: 'u',
      password: 'p',
      serverUrl: 'https://cal.example',
      calendarUrl: undefined,
      capabilities: ['availability'],
    },
  });

  const avail = await getCalendarIntegrationsByCapability('availability');
  expect(avail.map((i) => i.id)).toEqual([b.id]);

  const list = await listCalendarIntegrations();
  expect(list).toHaveLength(2);
});
