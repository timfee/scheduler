import { Factory } from './base';
import { type ConnectionFormValues } from '@/lib/schemas/connection';
import { type CalendarIntegration } from '@/lib/schemas/database';
import { CALENDAR_CAPABILITY } from '@/lib/types/constants';
import { randomUUID } from 'crypto';

/**
 * Factory for creating connection form data
 */
export const connectionFactory = Factory.define<ConnectionFormValues>(() => ({
  provider: 'caldav',
  displayName: 'Test Connection',
  authMethod: 'Basic',
  username: 'test@example.com',
  password: 'test-password',
  serverUrl: 'https://cal.example.com',
  capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
}));

/**
 * Factory for creating calendar integrations
 */
export const calendarIntegrationFactory = Factory.define<CalendarIntegration>(() => ({
  id: randomUUID(),
  provider: 'caldav',
  displayName: 'Test Integration',
  encryptedConfig: 'encrypted-config-data',
  displayOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

/**
 * Connection factory variants
 */
export const connectionVariants = {
  // Basic auth variants
  caldav: () => connectionFactory.build({
    provider: 'caldav',
    authMethod: 'Basic',
    serverUrl: 'https://cal.example.com',
    capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
  }),
  
  apple: () => connectionFactory.build({
    provider: 'apple',
    authMethod: 'Basic',
    serverUrl: undefined, // Apple has auto-discovery
    capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
  }),
  
  fastmail: () => connectionFactory.build({
    provider: 'fastmail',
    authMethod: 'Basic',
    serverUrl: undefined, // Fastmail has auto-discovery
    capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
  }),
  
  nextcloud: () => connectionFactory.build({
    provider: 'nextcloud',
    authMethod: 'Basic',
    serverUrl: 'https://cloud.example.com',
    capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
  }),
  
  // OAuth variants
  google: () => connectionFactory.build({
    provider: 'google',
    authMethod: 'Oauth',
    username: 'test@example.com',
    password: undefined,
    serverUrl: undefined,
    refreshToken: 'refresh-token',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    capabilities: [CALENDAR_CAPABILITY.BOOKING],
  }),
  
  // Capability variants
  bookingCapable: () => connectionFactory.build({
    capabilities: [CALENDAR_CAPABILITY.BOOKING],
  }),
  
  blockingBusy: () => connectionFactory.build({
    capabilities: [CALENDAR_CAPABILITY.BLOCKING_BUSY],
  }),
  
  blockingAvailable: () => connectionFactory.build({
    capabilities: [CALENDAR_CAPABILITY.BLOCKING_AVAILABLE],
  }),
  
  multiCapability: () => connectionFactory.build({
    capabilities: [CALENDAR_CAPABILITY.BOOKING, CALENDAR_CAPABILITY.BLOCKING_BUSY],
  }),
};

/**
 * Calendar integration factory variants
 */
export const calendarIntegrationVariants = {
  google: () => calendarIntegrationFactory.build({
    provider: 'google',
    displayName: 'Google Calendar',
  }),
  
  apple: () => calendarIntegrationFactory.build({
    provider: 'apple',
    displayName: 'iCloud Calendar',
  }),
  
  caldav: () => calendarIntegrationFactory.build({
    provider: 'caldav',
    displayName: 'CalDAV Server',
  }),
  
  withDisplayOrder: (displayOrder: number) => 
    calendarIntegrationFactory.build({ displayOrder }),
};