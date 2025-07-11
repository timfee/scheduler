/**
 * Application constants to avoid magic strings and repeated values
 */

// Timezone constants
export const TIMEZONES = {
  DEFAULT: 'America/New_York',
} as const;

// Business hours constants
export const BUSINESS_HOURS = {
  DEFAULT_START: '09:00',
  DEFAULT_END: '17:00',
} as const;

// Development server constants
export const DEV_SERVER = {
  HOST: 'localhost',
  PORT: 3000,
  URL: 'http://localhost:3000',
} as const;

// Test environment constants
export const TEST_CONSTANTS = {
  ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  WEBHOOK_SECRET: 'test-webhook-secret-that-is-long-enough-to-meet-requirements',
  SQLITE_PATH: ':memory:',
  NEXTAUTH_SECRET: 'test-secret-for-nextauth',
} as const;

// Duration constants
export const DURATION = {
  DEFAULT_APPOINTMENT_MINUTES: 30,
} as const;

// Error message patterns
export const ERROR_MESSAGES = {
  FAILED_TO_PREFIX: 'Failed to',
  UNABLE_TO_PREFIX: 'Unable to',
} as const;