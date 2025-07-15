/**
 * Centralized error message constants
 *
 * This file contains all user-facing error messages used throughout the application.
 * Centralizing these messages makes them easier to maintain and translate.
 */

export const ERROR_MESSAGES = {
  // General errors
  INVALID_FORM_SUBMISSION: "Invalid form submission",
  MISSING_REQUIRED_BOOKING_INFO: "Missing required booking information",

  // Appointment type errors
  APPOINTMENT_TYPE_NOT_FOUND: "Appointment type not found",
  FAILED_TO_CREATE_APPOINTMENT_TYPE: "Failed to create appointment type",
  FAILED_TO_UPDATE_APPOINTMENT_TYPE: "Failed to update appointment type",
  FAILED_TO_DELETE_APPOINTMENT_TYPE: "Failed to delete appointment type",
  FAILED_TO_TOGGLE_APPOINTMENT_TYPE: "Failed to toggle appointment type",

  // Booking errors
  FAILED_TO_SUBMIT_BOOKING: "Failed to submit booking",

  // Connection errors
  FAILED_TO_CREATE_CONNECTION: "Failed to create connection",
  FAILED_TO_UPDATE_CONNECTION: "Failed to update connection",
  FAILED_TO_DELETE_CONNECTION: "Failed to delete connection",
  FAILED_TO_TEST_CONNECTION: "Failed to test connection",

  // Calendar errors
  FAILED_TO_LOAD_CALENDARS: "Failed to load calendars",
  FAILED_TO_UPDATE_CALENDAR_ORDER: "Failed to update calendar order",

  // Availability errors
  FAILED_TO_SAVE_AVAILABILITY_TEMPLATE: "Failed to save availability template",
  FAILED_TO_LOAD_AVAILABILITY_TEMPLATE: "Failed to load availability template",

  // Generic fallback
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
} as const;

export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
