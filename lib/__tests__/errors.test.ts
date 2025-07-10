import { mapErrorToUserMessage, CalendarConnectionError, EncryptionError } from '../errors';

describe('mapErrorToUserMessage', () => {
  it('should handle CalendarConnectionError with AUTH_FAILED', () => {
    const error = new CalendarConnectionError('Auth failed', 'AUTH_FAILED');
    const result = mapErrorToUserMessage(error);
    expect(result).toBe('Invalid credentials. Please check your username and password.');
  });

  it('should handle EncryptionError with DECRYPT_FAILED', () => {
    const error = new EncryptionError('Decrypt failed', 'DECRYPT_FAILED');
    const result = mapErrorToUserMessage(error);
    expect(result).toBe('Unable to decrypt stored credentials.');
  });

  it('should handle generic Error with fallback', () => {
    const error = new Error('Something went wrong');
    const result = mapErrorToUserMessage(error, 'Custom fallback message');
    // In non-dev mode, returns the fallback message
    expect(result).toBe('Custom fallback message');
  });

  it('should handle string error', () => {
    const result = mapErrorToUserMessage('String error message');
    expect(result).toBe('String error message');
  });

  it('should handle unknown error with fallback', () => {
    const result = mapErrorToUserMessage({ weird: 'object' }, 'Fallback message');
    expect(result).toBe('Fallback message');
  });

  it('should handle unknown error without fallback', () => {
    const result = mapErrorToUserMessage({ weird: 'object' });
    expect(result).toBe('Something went wrong. Please try again.');
  });
});