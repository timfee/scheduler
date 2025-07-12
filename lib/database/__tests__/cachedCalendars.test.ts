import { jest } from '@jest/globals';
import { sql } from 'drizzle-orm';

// Mock the environment config before any imports
jest.mock('@/env.config', () => ({
  default: {
    SQLITE_PATH: ':memory:',
    ENCRYPTION_KEY: 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148',
    WEBHOOK_SECRET: 'test-webhook-secret-key-that-is-long-enough',
    NODE_ENV: 'test',
  },
}));

// Create test database and mock it before all imports
import { createTestDb, cleanupTestDb, createTestIntegration } from './helpers/db';
const testDb = createTestDb();

// Mock the database instance before any other imports
jest.mock('@/lib/database', () => ({
  db: testDb.db,
}));

// Mock next/cache to provide caching behavior
let cached: unknown;
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  unstable_cache: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (cached === undefined) {
        cached = await fn(...args);
      }
      return cached as ReturnType<T>;
    };
  },
}));

// Now import everything else
import { getCachedCalendars } from '../integrations';

let db: ReturnType<typeof createTestDb>['db'];
let sqlite: ReturnType<typeof createTestDb>['sqlite'];

beforeAll(async () => {
  Object.assign(process.env, { 
    NODE_ENV: 'test',
    ENCRYPTION_KEY: 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148',
    SQLITE_PATH: ':memory:',
    WEBHOOK_SECRET: 'test-webhook-secret-key-that-is-long-enough',
  });

  db = testDb.db;
  sqlite = testDb.sqlite;
});

afterAll(() => {
  cleanupTestDb(sqlite);
});

beforeEach(() => {
  jest.restoreAllMocks();
  db.run(sql`DELETE FROM calendar_integrations`);
  cached = undefined; // Reset cache for each test
});

it('caches calendar list between calls', async () => {
  await createTestIntegration(db, { id: 'a', displayName: 'A' });
   
  const first = await getCachedCalendars();
  await createTestIntegration(db, { id: 'b', displayName: 'B' });
   
  const second = await getCachedCalendars();
  expect(first).toEqual(second);
});
