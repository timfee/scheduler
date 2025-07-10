// Shared error message constants
export const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

// Custom error classes for better error handling
export class CalendarConnectionError extends Error {
  constructor(
    message: string,
    public code: 'AUTH_FAILED' | 'NO_CALENDARS' | 'NETWORK_ERROR' | 'INVALID_CONFIG' | 'TIMEOUT'
  ) {
    super(message);
    this.name = 'CalendarConnectionError';
  }
}

export class EncryptionError extends Error {
  constructor(message: string, public code: 'INVALID_KEY' | 'DECRYPT_FAILED' | 'ENCRYPT_FAILED') {
    super(message);
    this.name = 'EncryptionError';
  }
}

// Result type for better error handling
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Helper to create results
export const ok = <T>(data: T): Result<T> => ({ success: true, data });
export const err = <E = Error>(error: E): Result<never, E> => ({ success: false, error });

// Convert errors to user-friendly messages
export function mapErrorToUserMessage(error: unknown): string {
  if (error instanceof CalendarConnectionError) {
    switch (error.code) {
      case 'AUTH_FAILED':
        return 'Invalid credentials. Please check your username and password.';
      case 'NO_CALENDARS':
        return 'No calendars found in this account.';
      case 'NETWORK_ERROR':
        return 'Unable to connect. Please check your internet connection.';
      case 'INVALID_CONFIG':
        return 'Invalid configuration. Please check your settings.';
      case 'TIMEOUT':
        return 'Connection timed out. Please try again.';
    }
  }

  if (error instanceof EncryptionError) {
    switch (error.code) {
      case 'INVALID_KEY':
        return 'Invalid encryption key configuration.';
      case 'DECRYPT_FAILED':
        return 'Unable to decrypt stored credentials.';
      case 'ENCRYPT_FAILED':
        return 'Unable to encrypt credentials.';
    }
  }

  if (error instanceof Error) {
    if (process.env.NODE_ENV === 'development') {
      return error.message;
    }
    return DEFAULT_ERROR_MESSAGE;
  }

  return DEFAULT_ERROR_MESSAGE;
}
