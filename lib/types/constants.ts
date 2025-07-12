export const defaultTimeZone = "UTC" as const;

export const ICAL_PROD_ID = {
  company: "example.com",
  product: "scheduler",
} as const;

// UPDATED: New capability model
export const CALENDAR_CAPABILITY = {
  BOOKING: "booking", // Can create events in this calendar
  BLOCKING_AVAILABLE: "availability", // Busy times are actually available
  BLOCKING_BUSY: "blocking_busy", // Busy times block availability
} as const;
export type CalendarCapability =
  (typeof CALENDAR_CAPABILITY)[keyof typeof CALENDAR_CAPABILITY];
