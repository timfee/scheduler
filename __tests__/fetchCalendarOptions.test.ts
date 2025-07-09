import { jest } from '@jest/globals';
import { createDAVClient } from 'tsdav';

let fetchCalendarOptions: typeof import('@/lib/db/integrations').fetchCalendarOptions;

beforeAll(async () => {
  jest.resetModules();
  Object.assign(process.env, { NODE_ENV: 'development' });
  process.env.ENCRYPTION_KEY =
    'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148';
  process.env.SQLITE_PATH = ':memory:';

  ({ fetchCalendarOptions } = await import('@/lib/db/integrations'));
});

describe('fetchCalendarOptions', () => {
  it('transforms calendars with display names correctly', async () => {
    const client = {
      fetchCalendars: jest.fn<() => Promise<{ url: string; displayName: string }[]>>()
        .mockResolvedValue([
          { url: 'https://a', displayName: 'A' },
          { url: 'https://b', displayName: 'B' },
        ]),
    } as DavClient;

    const result = await fetchCalendarOptions(client);
    expect(result).toEqual([
      { url: 'https://a', displayName: 'A' },
      { url: 'https://b', displayName: 'B' },
    ]);
  });

  it('falls back to url when display name is not a string', async () => {
    const client = {
      fetchCalendars: jest.fn<() => Promise<Array<{ url: string; displayName?: unknown }>>>()
        .mockResolvedValue([
          { url: 'https://a', displayName: null },
          { url: 'https://b' },
        ]),
    } as unknown as Awaited<ReturnType<typeof createDAVClient>>;

    const result = await fetchCalendarOptions(client);
    expect(result).toEqual([
      { url: 'https://a', displayName: 'https://a' },
      { url: 'https://b', displayName: 'https://b' },
    ]);
  });

  it('propagates errors from fetchCalendars', async () => {
    const client = {
      fetchCalendars: jest.fn<() => Promise<unknown[]>>()
        .mockRejectedValue(new Error('boom')),
    } as unknown as Awaited<ReturnType<typeof createDAVClient>>;

    await expect(fetchCalendarOptions(client)).rejects.toThrow('boom');
  });
});
