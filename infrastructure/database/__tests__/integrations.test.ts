// Use Jest globals for lifecycle hooks and import `jest` for mocking
import { jest } from '@jest/globals';
import { createTestDb, cleanupTestDb } from './helpers/db';
import { calendarIntegrations } from '@/lib/schemas/database';
import { type CalendarCapability } from '@/lib/types/constants';
import {
  type OAuthConfig,
  type createCalendarIntegration as createCal,
  type updateCalendarIntegration as updateCal,
  type listCalendarIntegrations as listCals,
  type getCalendarIntegration as getCal,
  type getBookingCalendar as getBookingCal,
  type getCalendarIntegrationsByCapability as getByCap,
  type deleteCalendarIntegration as deleteCal,
} from '../integrations';

let createCalendarIntegration: typeof createCal;
let updateCalendarIntegration: typeof updateCal;
let listCalendarIntegrations: typeof listCals;
let getCalendarIntegration: typeof getCal;
let getBookingCalendar: typeof getBookingCal;
let getCalendarIntegrationsByCapability: typeof getByCap;
let deleteCalendarIntegration: typeof deleteCal;
let db: ReturnType<typeof createTestDb>['db'];
let sqlite: ReturnType<typeof createTestDb>['sqlite'];

beforeAll(async () => {
  Object.assign(process.env, { 
    NODE_ENV: "development",
    ENCRYPTION_KEY: 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148',
    SQLITE_PATH: ':memory:',
    WEBHOOK_SECRET: 'test-webhook-secret-key-that-is-long-enough',
  });

  const testDb = createTestDb();
  db = testDb.db;
  sqlite = testDb.sqlite;

  // Provide the test database to integration helpers for ESM modules
  jest.unstable_mockModule(
    '@/infrastructure/database',
    () => ({ db }),
  );

  const integrations = await import('@/infrastructure/database/integrations');
  createCalendarIntegration = integrations.createCalendarIntegration;
  updateCalendarIntegration = integrations.updateCalendarIntegration;
  listCalendarIntegrations = integrations.listCalendarIntegrations;
  getCalendarIntegration = integrations.getCalendarIntegration;
  getBookingCalendar = integrations.getBookingCalendar;
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

it('selects booking calendar by display order', async () => {
  const first = await createCalendarIntegration({
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
  const second = await createCalendarIntegration({
    provider: 'caldav',
    displayName: 'B',
    config: {
      authMethod: 'Basic',
      username: 'u',
      password: 'p',
      serverUrl: 'https://cal.example',
      calendarUrl: undefined,
      capabilities: ['booking'],
    },
  });

  const booking = await getBookingCalendar();
  expect(booking?.id).toBe(first.id);
  await updateCalendarIntegration(first.id, { displayOrder: 3 });
  const after = await getBookingCalendar();
  expect(after?.id).toBe(second.id);
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
