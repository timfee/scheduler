import { jest } from '@jest/globals';
import { sql } from 'drizzle-orm';
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '@/infrastructure/database/schema';
import { connectionVariants } from '@test/factories';
import '@test/setup/jest.setup';
import {
  type createConnectionAction,
  type deleteConnectionAction,
  type updateConnectionAction,
  type updateCalendarOrderAction,
} from '../actions';

// Mock revalidateTag to verify it's called
const mockRevalidateTag = jest.fn();
const mockRevalidatePath = jest.fn();

jest.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: mockRevalidateTag,
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

jest.mock('tsdav', () => ({
  createDAVClient: jest.fn(async () => ({
    fetchCalendars: jest.fn<() => Promise<{ url: string }[]>>().mockResolvedValue([
      { url: 'https://calendar.local/cal1' },
    ]),
  })),
}));

let db: BetterSQLite3Database<typeof schema>;
let createConnectionActionFn: typeof createConnectionAction;
let deleteConnectionActionFn: typeof deleteConnectionAction;
let updateConnectionActionFn: typeof updateConnectionAction;
let updateCalendarOrderActionFn: typeof updateCalendarOrderAction;

beforeAll(async () => {
  Object.assign(process.env, { NODE_ENV: "development" });
  process.env.ENCRYPTION_KEY = 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148';
  process.env.SQLITE_PATH = ':memory:';
  process.env.WEBHOOK_SECRET = 'test-webhook-secret-that-is-32-characters-long';
  
  const dbModule = await import('@/infrastructure/database');
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

  // Import actions after mocks are set up
  const actionsModule = await import('../actions');
  createConnectionActionFn = actionsModule.createConnectionAction;
  deleteConnectionActionFn = actionsModule.deleteConnectionAction;
  updateConnectionActionFn = actionsModule.updateConnectionAction;
  updateCalendarOrderActionFn = actionsModule.updateCalendarOrderAction;
});

describe('Cache Invalidation', () => {
  beforeEach(() => {
    db.run(sql`DELETE FROM calendar_integrations`);
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
  });

  it('should call revalidateTag when creating a connection', async () => {
    const connectionData = connectionVariants.apple();
    const result = await createConnectionActionFn(connectionData);
    
    expect(result).toBeDefined();
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections');
    expect(mockRevalidateTag).toHaveBeenCalledWith('calendars');
  });

  it('should call revalidateTag when deleting a connection', async () => {
    // First create a connection
    const connectionData = connectionVariants.apple();
    const created = await createConnectionActionFn(connectionData);
    
    // Clear the mocks
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
    
    // Delete it
    await deleteConnectionActionFn(created.id);
    
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections');
    expect(mockRevalidateTag).toHaveBeenCalledWith('calendars');
  });

  it('should call revalidateTag when updating a connection', async () => {
    // First create a connection
    const connectionData = connectionVariants.apple();
    const created = await createConnectionActionFn(connectionData);
    
    // Clear the mocks
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
    
    // Update it
    await updateConnectionActionFn(created.id, {
      displayName: 'Updated Calendar',
    });
    
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections');
    expect(mockRevalidateTag).toHaveBeenCalledWith('calendars');
  });

  it('should call revalidateTag when updating calendar order', async () => {
    // First create two connections
    const firstConnection = connectionVariants.apple();
    firstConnection.displayName = 'First Calendar';
    const _first = await createConnectionActionFn(firstConnection);
    
    const secondConnection = connectionVariants.apple();
    secondConnection.displayName = 'Second Calendar';
    secondConnection.username = 'test2@example.com';
    const second = await createConnectionActionFn(secondConnection);
    
    // Clear the mocks
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
    
    // Update order
    await updateCalendarOrderActionFn(second.id, 'up');
    
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections');
    expect(mockRevalidateTag).toHaveBeenCalledWith('calendars');
  });
});