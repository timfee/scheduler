import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock the dependencies
jest.unstable_mockModule('next/cache', () => ({
  unstable_cache: jest.fn(),
}));

jest.unstable_mockModule('@/infrastructure/database/integrations', () => ({
  getBookingCalendar: jest.fn(),
  createDAVClientFromIntegration: jest.fn(),
}));

jest.unstable_mockModule('@/infrastructure/providers/caldav', () => ({
  createCalDavProvider: jest.fn(),
}));

jest.unstable_mockModule('@/lib/errors', () => ({
  mapErrorToUserMessage: jest.fn(),
}));

describe('busy-times service', () => {
  let listBusyTimesAction: (from: string, to: string) => Promise<any>;
  let unstable_cache: jest.MockedFunction<any>;
  let getBookingCalendar: jest.MockedFunction<any>;
  let createDAVClientFromIntegration: jest.MockedFunction<any>;
  let createCalDavProvider: jest.MockedFunction<any>;
  let mapErrorToUserMessage: jest.MockedFunction<any>;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Import the mocked dependencies
    const nextCacheModule = await import('next/cache');
    const integrationsModule = await import('@/infrastructure/database/integrations');
    const caldavModule = await import('@/infrastructure/providers/caldav');
    const errorsModule = await import('@/lib/errors');
    
    unstable_cache = nextCacheModule.unstable_cache as jest.MockedFunction<any>;
    getBookingCalendar = integrationsModule.getBookingCalendar as jest.MockedFunction<any>;
    createDAVClientFromIntegration = integrationsModule.createDAVClientFromIntegration as jest.MockedFunction<any>;
    createCalDavProvider = caldavModule.createCalDavProvider as jest.MockedFunction<any>;
    mapErrorToUserMessage = errorsModule.mapErrorToUserMessage as jest.MockedFunction<any>;
    
    // Import the module under test
    const busyTimesModule = await import('../busy-times');
    listBusyTimesAction = busyTimesModule.listBusyTimesAction;
  });

  describe('listBusyTimesAction', () => {
    it('should use unstable_cache with correct parameters', async () => {
      const mockCachedFunction = jest.fn().mockResolvedValue([]);
      unstable_cache.mockReturnValue(mockCachedFunction);

      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-01T23:59:59Z';

      await listBusyTimesAction(from, to);

      expect(unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        [`busy-times-${from}-${to}`],
        { 
          revalidate: 300, // 5 minutes
          tags: ['busy-times']
        }
      );
      expect(mockCachedFunction).toHaveBeenCalledWith();
    });

    it('should return busy times when integration is available', async () => {
      const mockBusyTimes = [
        {
          start: '2024-01-01T10:00:00Z',
          end: '2024-01-01T11:00:00Z',
          title: 'Meeting'
        }
      ];

      const mockIntegration = {
        id: 'integration-1',
        provider: 'caldav',
        config: {
          calendarUrl: 'https://example.com/calendar',
        },
      };

      const mockClient = { /* DAV client */ };
      const mockProvider = {
        listBusyTimes: jest.fn().mockResolvedValue(mockBusyTimes),
      };

      getBookingCalendar.mockResolvedValue(mockIntegration);
      createDAVClientFromIntegration.mockResolvedValue(mockClient);
      createCalDavProvider.mockReturnValue(mockProvider);

      // Mock unstable_cache to call the function directly and return a promise
      unstable_cache.mockImplementation((fn) => () => fn());

      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-01T23:59:59Z';

      const result = await listBusyTimesAction(from, to);

      expect(getBookingCalendar).toHaveBeenCalledWith();
      expect(createDAVClientFromIntegration).toHaveBeenCalledWith(mockIntegration);
      expect(createCalDavProvider).toHaveBeenCalledWith(mockClient, 'https://example.com/calendar');
      expect(mockProvider.listBusyTimes).toHaveBeenCalledWith({ from, to });
      expect(result).toEqual(mockBusyTimes);
    });

    it('should return empty array when no integration is available', async () => {
      getBookingCalendar.mockResolvedValue(null);
      
      // Mock unstable_cache to call the function directly and return a promise
      unstable_cache.mockImplementation((fn) => () => fn());

      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-01T23:59:59Z';

      const result = await listBusyTimesAction(from, to);

      expect(result).toEqual([]);
    });

    it('should handle calendarUrl fallback to empty string', async () => {
      const mockIntegration = {
        id: 'integration-1',
        provider: 'caldav',
        config: {
          // No calendarUrl provided
        },
      };

      const mockClient = { /* DAV client */ };
      const mockProvider = {
        listBusyTimes: jest.fn().mockResolvedValue([]),
      };

      getBookingCalendar.mockResolvedValue(mockIntegration);
      createDAVClientFromIntegration.mockResolvedValue(mockClient);
      createCalDavProvider.mockReturnValue(mockProvider);

      // Mock unstable_cache to call the function directly and return a promise
      unstable_cache.mockImplementation((fn) => () => fn());

      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-01T23:59:59Z';

      await listBusyTimesAction(from, to);

      expect(createCalDavProvider).toHaveBeenCalledWith(mockClient, "");
    });

    it('should handle database errors gracefully', async () => {
      const originalError = new Error('DAV connection failed');

      getBookingCalendar.mockRejectedValue(originalError);
      
      // Mock unstable_cache to call the function directly and return a promise
      unstable_cache.mockImplementation((fn) => () => fn());

      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-01T23:59:59Z';

      // The service should handle errors and provide a meaningful error message
      await expect(listBusyTimesAction(from, to)).rejects.toThrow();
    });

    it('should handle provider errors gracefully', async () => {
      const originalError = new Error('Provider error');

      const mockIntegration = {
        id: 'integration-1',
        provider: 'caldav',
        config: {
          calendarUrl: 'https://example.com/calendar',
        },
      };

      const mockClient = { /* DAV client */ };
      const mockProvider = {
        listBusyTimes: jest.fn().mockRejectedValue(originalError),
      };

      getBookingCalendar.mockResolvedValue(mockIntegration);
      createDAVClientFromIntegration.mockResolvedValue(mockClient);
      createCalDavProvider.mockReturnValue(mockProvider);

      // Mock unstable_cache to call the function directly and return a promise
      unstable_cache.mockImplementation((fn) => () => fn());

      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-01T23:59:59Z';

      // The service should handle errors and provide a meaningful error message
      await expect(listBusyTimesAction(from, to)).rejects.toThrow();
    });

    it('should create different cache keys for different time ranges', async () => {
      const mockCachedFunction = jest.fn().mockResolvedValue([]);
      unstable_cache.mockReturnValue(mockCachedFunction);

      const from1 = '2024-01-01T00:00:00Z';
      const to1 = '2024-01-01T23:59:59Z';
      const from2 = '2024-01-02T00:00:00Z';
      const to2 = '2024-01-02T23:59:59Z';

      await listBusyTimesAction(from1, to1);
      await listBusyTimesAction(from2, to2);

      expect(unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        [`busy-times-${from1}-${to1}`],
        expect.any(Object)
      );
      expect(unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        [`busy-times-${from2}-${to2}`],
        expect.any(Object)
      );
    });
  });
});