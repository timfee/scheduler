import { jest } from '@jest/globals';
import { sql } from 'drizzle-orm';
import { createTestDb, cleanupTestDb, createTestIntegration } from './helpers/db';
import  { type getCachedCalendars as GetCachedCalendars } from '../integrations';

let getCachedCalendars: typeof GetCachedCalendars;
let db: ReturnType<typeof createTestDb>['db'];
let sqlite: ReturnType<typeof createTestDb>['sqlite'];

beforeAll(async () => {
  jest.resetModules();
  Object.assign(process.env, { NODE_ENV: 'development' });
  process.env.ENCRYPTION_KEY =
    'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148';
  process.env.SQLITE_PATH = ':memory:';

  const testDb = createTestDb();
  db = testDb.db;
  sqlite = testDb.sqlite;

  (jest as unknown as { unstable_mockModule: (p: string, f: () => unknown) => void }).unstable_mockModule(
    '@/infrastructure/database',
    () => ({ db }),
  );


  (jest as unknown as { unstable_mockModule: (p: string, f: () => unknown) => void }).unstable_mockModule(
    'next/cache',
    () => {
      let cached: unknown;
      return {
        revalidatePath: jest.fn(),
        unstable_cache: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T) => {
          return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
            if (cached === undefined) {
              cached = await fn(...args);
            }
            return cached as ReturnType<T>;
          };
        },
      };
    },
  );

  const integrations = await import('../integrations');
  getCachedCalendars = integrations.getCachedCalendars;
});

afterAll(() => {
  cleanupTestDb(sqlite);
  jest.resetModules();
});

beforeEach(() => {
  jest.restoreAllMocks();
  db.run(sql`DELETE FROM calendar_integrations`);
});

it('caches calendar list between calls', async () => {
  await createTestIntegration(db, { id: 'a', displayName: 'A' });
   
  const first = await getCachedCalendars();
  await createTestIntegration(db, { id: 'b', displayName: 'B' });
   
  const second = await getCachedCalendars();
  expect(first).toEqual(second);
});
