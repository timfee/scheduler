import { describe, expect, it } from "@jest/globals";
import { mapErrorToUserMessage, CalendarConnectionError, EncryptionError } from '../errors';

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
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Test error message');
    expect(mapErrorToUserMessage(error)).toBe('Test error message');
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should return consistent message for Error instances in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new Error('Test error message');
    expect(mapErrorToUserMessage(error)).toBe('An unexpected error occurred. Please try again.');
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should return consistent message for non-Error values (final fallback)', () => {
    expect(mapErrorToUserMessage('string error')).toBe('An unexpected error occurred. Please try again.');
    expect(mapErrorToUserMessage(null)).toBe('An unexpected error occurred. Please try again.');
    expect(mapErrorToUserMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
    expect(mapErrorToUserMessage(123)).toBe('An unexpected error occurred. Please try again.');
  });

  it('should use the same message for Error instances and final fallback', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const errorInstanceMessage = mapErrorToUserMessage(new Error('Test error'));
    const finalFallbackMessage = mapErrorToUserMessage('non-error value');
    
    // These should be consistent - this test will fail until we fix the inconsistency
    expect(errorInstanceMessage).toBe(finalFallbackMessage);
    
    process.env.NODE_ENV = originalEnv;
  });
});