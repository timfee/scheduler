/* eslint-disable @typescript-eslint/no-var-requires */
// Use Jest globals for lifecycle hooks and import `jest` for mocking
import { jest } from '@jest/globals';
import { createTestDb, cleanupTestDb } from './helpers/db';
import { calendarIntegrations } from '@/lib/db/schema';
import { type CalendarCapability } from '../types/constants';
import { type OAuthConfig } from '../lib/db/integrations';

let createCalendarIntegration: typeof import('../lib/db/integrations').createCalendarIntegration;
let updateCalendarIntegration: typeof import('../lib/db/integrations').updateCalendarIntegration;
let listCalendarIntegrations: typeof import('../lib/db/integrations').listCalendarIntegrations;
let getCalendarIntegration: typeof import('../lib/db/integrations').getCalendarIntegration;
let getPrimaryCalendarIntegration: typeof import('../lib/db/integrations').getPrimaryCalendarIntegration;
let getCalendarIntegrationsByCapability: typeof import('../lib/db/integrations').getCalendarIntegrationsByCapability;
let deleteCalendarIntegration: typeof import('../lib/db/integrations').deleteCalendarIntegration;
let db: ReturnType<typeof createTestDb>['db'];
let sqlite: ReturnType<typeof createTestDb>['sqlite'];

beforeAll(async () => {
  Object.assign(process.env, { NODE_ENV: "development" });
  process.env.ENCRYPTION_KEY = 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148';
  process.env.SQLITE_PATH = ':memory:';

  const testDb = createTestDb();
  db = testDb.db;
  sqlite = testDb.sqlite;

  // Provide the test database to integration helpers for ESM modules
  (jest as unknown as { unstable_mockModule: (p: string, f: () => unknown) => void }).unstable_mockModule(
    '../lib/db',
    () => ({ db }),
  );

  const integrations = await import('../lib/db/integrations');
  createCalendarIntegration = integrations.createCalendarIntegration;
  updateCalendarIntegration = integrations.updateCalendarIntegration;
  listCalendarIntegrations = integrations.listCalendarIntegrations;
  getCalendarIntegration = integrations.getCalendarIntegration;
  getPrimaryCalendarIntegration = integrations.getPrimaryCalendarIntegration;
  getCalendarIntegrationsByCapability = integrations.getCalendarIntegrationsByCapability;
  deleteCalendarIntegration = integrations.deleteCalendarIntegration;
});

afterAll(() => {
  cleanupTestDb(sqlite);
  jest.resetModules();
});

beforeEach(() => {
  jest.restoreAllMocks();
  // Reset table for each test
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  db.delete(calendarIntegrations).run();
});

it('creates and retrieves integration with decrypted config', async () => {
  const config: {
    authMethod: 'Oauth';
    username: string;
    refreshToken: string;
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    serverUrl: string;
    calendarUrl: string | undefined;
    capabilities: CalendarCapability[];
  } = {
    authMethod: 'Oauth',
    username: 'user',
    refreshToken: 'r1',
    clientId: 'c1',
    clientSecret: 's1',
    tokenUrl: 'https://token',
    serverUrl: '',
    calendarUrl: undefined,
    capabilities: [],
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
  const initialConfig = {
    authMethod: 'Oauth' as const,
    username: 'u1',
    refreshToken: 'r1',
    clientId: 'c1',
    clientSecret: 's1',
    tokenUrl: 'https://token',
    serverUrl: '',
    calendarUrl: undefined,
    capabilities: [] as CalendarCapability[],
  };
  const integration = await createCalendarIntegration({
    provider: 'google',
    displayName: 'Google',
    config: initialConfig,
  });

  await updateCalendarIntegration(integration.id, {
    displayName: 'Updated',
    config: { ...initialConfig, refreshToken: 'r2' },
  });

  const updated = await getCalendarIntegration(integration.id);
  expect(updated?.displayName).toBe('Updated');
  expect((updated?.config as OAuthConfig).refreshToken).toBe('r2');
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
  await createCalendarIntegration({
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
