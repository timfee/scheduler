import { describe, expect, it } from "@jest/globals";
import { mapErrorToUserMessage, CalendarConnectionError, EncryptionError, DEFAULT_ERROR_MESSAGE } from '../errors';

describe('mapErrorToUserMessage', () => {
  it('should return specific message for CalendarConnectionError', () => {
    const error = new CalendarConnectionError('Auth failed', 'AUTH_FAILED');
    expect(mapErrorToUserMessage(error)).toBe('Invalid credentials. Please check your username and password.');
  });

  it('should return specific message for EncryptionError', () => {
    const error = new EncryptionError('Decrypt failed', 'DECRYPT_FAILED');
    expect(mapErrorToUserMessage(error)).toBe('Unable to decrypt stored credentials.');
  });

  it('should return consistent message for Error instances in development', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });
    
    const error = new Error('Test error message');
    expect(mapErrorToUserMessage(error)).toBe('Test error message');
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    });
  });

  it('should return consistent message for Error instances in production', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
      configurable: true,
    });
    
    const error = new Error('Test error message');
    expect(mapErrorToUserMessage(error)).toBe(DEFAULT_ERROR_MESSAGE);
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    });
  });

  it('should return consistent message for non-Error values (final fallback)', () => {
    expect(mapErrorToUserMessage('string error')).toBe(DEFAULT_ERROR_MESSAGE);
    expect(mapErrorToUserMessage(null)).toBe(DEFAULT_ERROR_MESSAGE);
    expect(mapErrorToUserMessage(undefined)).toBe(DEFAULT_ERROR_MESSAGE);
    expect(mapErrorToUserMessage(123)).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('should use the same message for Error instances and final fallback', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
      configurable: true,
    });
    
    const errorInstanceMessage = mapErrorToUserMessage(new Error('Test error'));
    const finalFallbackMessage = mapErrorToUserMessage('non-error value');
    
    // These should be consistent - this test will fail until we fix the inconsistency
    expect(errorInstanceMessage).toBe(finalFallbackMessage);
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    });
  });
});