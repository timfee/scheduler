/**
 * Central barrel export for the lib directory.
 * This file consolidates exports from all lib subdirectories to provide
 * a single, convenient entry point for commonly used types, schemas, and utilities.
 */

// Re-export commonly used items from lib subdirectories
export * from './types/constants';
export * from './types/calendar';
export * from './schemas/calendar-event';
export * from './hooks/use-mobile';