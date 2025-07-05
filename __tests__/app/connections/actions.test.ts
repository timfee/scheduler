import { jest } from '@jest/globals';

const revalidatePath = jest.fn();

// Mock next/cache
jest.unstable_mockModule('next/cache', () => ({ revalidatePath }));

// Mock database integration helpers
const integrationMocks = {
  createCalendarIntegration: jest.fn(),
  updateCalendarIntegration: jest.fn(),
  deleteCalendarIntegration: jest.fn(),
  getCalendarIntegration: jest.fn(),
  listCalendarIntegrations: jest.fn(),
  testCalendarConnection: jest.fn(),
};

jest.unstable_mockModule('@/lib/db/integrations', () => integrationMocks);

describe('connection actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    jest.resetModules();
  });

  test('createConnectionAction succeeds with basic auth', async () => {
    const { createConnectionAction } = await import('@/app/connections/actions');
    integrationMocks.testCalendarConnection.mockResolvedValue({ success: true });
    integrationMocks.createCalendarIntegration.mockResolvedValue({ id: '1', displayName: 'Cal' });

    const result = await createConnectionAction({
      provider: 'caldav',
      displayName: 'Cal',
      authMethod: 'Basic',
      username: 'u',
      password: 'p',
      serverUrl: 'http://example.com',
      capabilities: [],
    });
    expect(result.success).toBe(true);
    expect(integrationMocks.createCalendarIntegration).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/connections');
  });

  test('updateConnectionAction returns error when missing', async () => {
    const { updateConnectionAction } = await import('@/app/connections/actions');
    integrationMocks.getCalendarIntegration.mockResolvedValue(null);

    const result = await updateConnectionAction('1', { displayName: 'x' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Connection not found/);
  });
});
