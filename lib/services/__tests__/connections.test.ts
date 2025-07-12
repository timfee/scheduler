import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { type ConnectionListItem } from '../connections';

// Mock the dependencies
jest.unstable_mockModule('@/lib/database/integrations', () => ({
  listCalendarIntegrations: jest.fn(),
  isProviderType: jest.fn(),
}));

describe('connections service', () => {
  let getConnections: () => Promise<ConnectionListItem[]>;
  let listCalendarIntegrations: jest.MockedFunction<any>;
  let isProviderType: jest.MockedFunction<any>;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Import the mocked dependencies
    const integrationsModule = await import('@/lib/database/integrations');
    listCalendarIntegrations = integrationsModule.listCalendarIntegrations as jest.MockedFunction<any>;
    isProviderType = integrationsModule.isProviderType as jest.MockedFunction<any>;
    
    // Import the module under test
    const connectionsModule = await import('../connections');
    getConnections = connectionsModule.getConnections;
  });

  describe('getConnections', () => {
    it('should map integration data to ConnectionListItem format', async () => {
      const mockIntegrations = [
        {
          id: 'integration-1',
          provider: 'caldav',
          displayName: 'My Calendar',
          config: {
            capabilities: ['booking', 'conflict'],
          },
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
        {
          id: 'integration-2', 
          provider: 'google',
          displayName: 'Google Calendar',
          config: {
            capabilities: ['booking', 'conflict', 'availability'],
          },
          createdAt: new Date('2024-01-03T00:00:00Z'),
          updatedAt: new Date('2024-01-04T00:00:00Z'),
        },
      ];

      listCalendarIntegrations.mockResolvedValue(mockIntegrations);
      isProviderType.mockImplementation((provider: string) => provider === 'caldav' || provider === 'google');

      const result = await getConnections();

      expect(result).toEqual([
        {
          id: 'integration-1',
          provider: 'caldav',
          displayName: 'My Calendar',
          capabilities: ['booking', 'conflict'],
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
        {
          id: 'integration-2',
          provider: 'google',
          displayName: 'Google Calendar',
          capabilities: ['booking', 'conflict', 'availability'],
          createdAt: new Date('2024-01-03T00:00:00Z'),
          updatedAt: new Date('2024-01-04T00:00:00Z'),
        },
      ]);
    });

    it('should fallback to "caldav" provider for invalid provider types', async () => {
      const mockIntegrations = [
        {
          id: 'integration-1',
          provider: 'invalid-provider',
          displayName: 'Unknown Provider',
          config: {
            capabilities: ['booking'],
          },
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
      ];

      listCalendarIntegrations.mockResolvedValue(mockIntegrations);
      isProviderType.mockReturnValue(false); // Invalid provider type

      const result = await getConnections();

      expect(result).toEqual([
        {
          id: 'integration-1',
          provider: 'caldav', // Should fallback to 'caldav'
          displayName: 'Unknown Provider',
          capabilities: ['booking'],
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
      ]);
    });

    it('should handle empty integration list', async () => {
      listCalendarIntegrations.mockResolvedValue([]);

      const result = await getConnections();

      expect(result).toEqual([]);
    });

    it('should handle mixed valid and invalid provider types', async () => {
      const mockIntegrations = [
        {
          id: 'integration-1',
          provider: 'google',
          displayName: 'Google Calendar',
          config: { capabilities: ['booking'] },
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
        {
          id: 'integration-2',
          provider: 'unknown',
          displayName: 'Unknown Calendar',
          config: { capabilities: ['conflict'] },
          createdAt: new Date('2024-01-03T00:00:00Z'),
          updatedAt: new Date('2024-01-04T00:00:00Z'),
        },
      ];

      listCalendarIntegrations.mockResolvedValue(mockIntegrations);
      isProviderType.mockImplementation((provider: string) => provider === 'google');

      const result = await getConnections();

      expect(result).toEqual([
        {
          id: 'integration-1',
          provider: 'google',
          displayName: 'Google Calendar',
          capabilities: ['booking'],
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
        {
          id: 'integration-2',
          provider: 'caldav', // Should fallback to 'caldav'
          displayName: 'Unknown Calendar',
          capabilities: ['conflict'],
          createdAt: new Date('2024-01-03T00:00:00Z'),
          updatedAt: new Date('2024-01-04T00:00:00Z'),
        },
      ]);
    });
  });
});