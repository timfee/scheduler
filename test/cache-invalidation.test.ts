import { jest } from '@jest/globals';
import { sql } from 'drizzle-orm';
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '../infrastructure/database/schema';

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
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
    db.run(sql`DELETE FROM calendar_integrations`);
  });

  it('should call revalidateTag when creating a connection', async () => {
    const { createConnectionAction } = await import('../features/connections/actions/actions');
    const { CALENDAR_CAPABILITY } = await import('../types/constants');
    
    const result = await createConnectionAction({
      provider: 'apple',
      displayName: 'Test Calendar',
      authMethod: 'Basic',
      username: 'test@example.com',
      password: 'password123',
      capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
    });
    
    expect(result).toBeDefined();
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections');
    expect(mockRevalidateTag).toHaveBeenCalledWith('calendars');
  });

  it('should call revalidateTag when deleting a connection', async () => {
    const { createConnectionAction, deleteConnectionAction } = await import('../features/connections/actions/actions');
    const { CALENDAR_CAPABILITY } = await import('../types/constants');
    
    // First create a connection
    const created = await createConnectionAction({
      provider: 'apple',
      displayName: 'Test Calendar',
      authMethod: 'Basic',
      username: 'test@example.com',
      password: 'password123',
      capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
    });
    
    // Clear the mocks
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
    
    // Delete it
    await deleteConnectionAction(created.id);
    
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections');
    expect(mockRevalidateTag).toHaveBeenCalledWith('calendars');
  });

  it('should call revalidateTag when updating a connection', async () => {
    const { createConnectionAction, updateConnectionAction } = await import('../features/connections/actions/actions');
    const { CALENDAR_CAPABILITY } = await import('../types/constants');
    
    // First create a connection
    const created = await createConnectionAction({
      provider: 'apple',
      displayName: 'Test Calendar',
      authMethod: 'Basic',
      username: 'test@example.com',
      password: 'password123',
      capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
    });
    
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
    const { createConnectionAction, updateCalendarOrderAction } = await import('../features/connections/actions/actions');
    const { CALENDAR_CAPABILITY } = await import('../types/constants');
    
    // First create two connections
    const first = await createConnectionAction({
      provider: 'apple',
      displayName: 'First Calendar',
      authMethod: 'Basic',
      username: 'test1@example.com',
      password: 'password123',
      capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
    });
    
    const second = await createConnectionAction({
      provider: 'apple',
      displayName: 'Second Calendar',
      authMethod: 'Basic',
      username: 'test2@example.com',
      password: 'password123',
      capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
    });
    
    // Clear the mocks
    mockRevalidateTag.mockClear();
    mockRevalidatePath.mockClear();
    
    // Update order
    await updateCalendarOrderAction(second.id, 'up');
    
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections');
    expect(mockRevalidateTag).toHaveBeenCalledWith('calendars');
  });
});