import { jest } from '@jest/globals';

const inserted: any[] = [];

const mockDb = {
  update: jest.fn(() => mockDb),
  set: jest.fn(() => mockDb),
  where: jest.fn(() => mockDb),
  insert: jest.fn(() => ({
    values: (val: any) => ({
      returning: () => {
        inserted.push(val);
        return Promise.resolve([val]);
      },
    }),
  })),
  delete: jest.fn(),
  select: jest.fn(() => ({ from: jest.fn(() => inserted) })),
};

jest.unstable_mockModule('@/lib/db', () => ({ db: mockDb }));

describe('createCalendarIntegration', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    inserted.length = 0;
    jest.resetModules();
  });

  test('stores encrypted config and returns created row', async () => {
    const { createCalendarIntegration } = await import('@/lib/db/integrations');

    const result = await createCalendarIntegration({
      provider: 'caldav',
      displayName: 'Test',
      config: {
        authMethod: 'Basic',
        username: 'u',
        password: 'p',
        serverUrl: 'http://example.com',
        capabilities: [],
      },
      isPrimary: true,
    });

    expect(result.displayName).toBe('Test');
    expect(inserted[0].encryptedConfig).toEqual(expect.any(String));
  });
});
