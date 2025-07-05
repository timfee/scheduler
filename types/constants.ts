export const DEFAULT_TIMEZONE = "UTC" as const;

export const ICAL_PROD_ID = {
  company: "example.com",
  product: "scheduler",
} as const;

export const PROVIDER_NAMES = {
  GOOGLE: "google",
  APPLE: "icloud",
  CALDAV: "caldav",
} as const;
export type ProviderName = (typeof PROVIDER_NAMES)[keyof typeof PROVIDER_NAMES];

export const CAPABILITY = {
  CONFLICT: "conflict",
  AVAILABILITY: "availability",
  BOOKING: "booking",
} as const;
export type CalendarCapability = (typeof CAPABILITY)[keyof typeof CAPABILITY];
