/**
 * Validation utilities for appointment types
 */

/**
 * Validates appointment type name
 * @param name - The name to validate
 * @throws Error if name is invalid
 */
export function validateAppointmentTypeName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error("Name is required");
  }
}

/**
 * Validates appointment type duration
 * @param durationMinutes - The duration in minutes to validate
 * @throws Error if duration is invalid
 */
export function validateAppointmentTypeDuration(durationMinutes: number): void {
  if (durationMinutes < 1 || durationMinutes > 480) {
    throw new Error("Duration must be between 1 and 480 minutes");
  }
}

/**
 * Validates appointment type ID
 * @param id - The ID to validate
 * @throws Error if ID is invalid
 */
export function validateAppointmentTypeId(id: string): void {
  if (!id || id.trim().length === 0) {
    throw new Error("ID is required");
  }
}