import { jest } from '@jest/globals';
import { sql } from 'drizzle-orm';
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '../infrastructure/database/schema';
import { connectionVariants } from '@test/factories';
import '@test/setup/jest.setup';

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

beforeAll(async () => {
  Object.assign(process.env, { NODE_ENV: "development" });
  process.env.ENCRYPTION_KEY = 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148';
  process.env.SQLITE_PATH = ':memory:';
  
  const dbModule = await import('../infrastructure/database');
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
});

describe('Cache Invalidation', () => {
  beforeEach(() => {
    db.run(sql`DELETE FROM calendar_integrations`);
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
  });

  it('should call revalidateTag when creating a connection', async () => {
    const { createConnectionAction } = await import('../app/connections/actions');
    
    const connectionData = connectionVariants.apple();
    const result = await createConnectionAction(connectionData);
    
    expect(result).toBeDefined();
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections');
    expect(mockRevalidateTag).toHaveBeenCalledWith('calendars');
  });

  it('should call revalidateTag when deleting a connection', async () => {
    const { createConnectionAction, deleteConnectionAction } = await import('../app/connections/actions');
    
    // First create a connection
    const connectionData = connectionVariants.apple();
    const created = await createConnectionAction(connectionData);
    
    // Clear the mocks
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
    
    // Delete it
    await deleteConnectionAction(created.id);
    
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections');
    expect(mockRevalidateTag).toHaveBeenCalledWith('calendars');
  });

  it('should call revalidateTag when updating a connection', async () => {
    const { createConnectionAction, updateConnectionAction } = await import('../app/connections/actions');
    
    // First create a connection
    const connectionData = connectionVariants.apple();
    const created = await createConnectionAction(connectionData);
    
    // Clear the mocks
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
    
    // Update it
    await updateConnectionAction(created.id, {
      displayName: 'Updated Calendar',
    });
    
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections');
    expect(mockRevalidateTag).toHaveBeenCalledWith('calendars');
  });

  it('should call revalidateTag when updating calendar order', async () => {
    const { createConnectionAction, updateCalendarOrderAction } = await import('../app/connections/actions');
    
    // First create two connections
    const firstConnection = connectionVariants.apple();
    firstConnection.displayName = 'First Calendar';
    const _first = await createConnectionAction(firstConnection);
    
    const secondConnection = connectionVariants.apple();
    secondConnection.displayName = 'Second Calendar';
    secondConnection.username = 'test2@example.com';
    const second = await createConnectionAction(secondConnection);
    
    // Clear the mocks
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
    
    // Update order
    await updateCalendarOrderAction(second.id, 'up');
    
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections');
    expect(mockRevalidateTag).toHaveBeenCalledWith('calendars');
  });
});