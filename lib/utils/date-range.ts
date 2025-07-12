import { addDays, format, startOfDay } from "date-fns";

/**
 * Formats a date to ISO string with timezone for API calls
 * @param date - The date to format
 * @returns ISO string in format: "yyyy-MM-dd'T'HH:mm:ssXXX"
 */
export function formatDateForApi(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Formats a date to ISO date string for display
 * @param date - The date to format
 * @returns ISO date string in format: "yyyy-MM-dd"
 */
export function formatDateForDisplay(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Creates a date range from today for a specified number of days
 * @param days - Number of days from today (default: 7)
 * @returns Object with formatted 'from' and 'to' dates
 */
export function createDateRange(days = 7): { from: string; to: string } {
  const from = startOfDay(new Date());
  const to = addDays(from, days);

  return {
    from: formatDateForApi(from),
    to: formatDateForApi(to),
  };
}

/**
 * Creates a date range from today for a specified number of days
 * @param days - Number of days from today (default: 7)
 * @returns Object with Date objects for 'from' and 'to'
 */
export function createDateRangeObjects(days = 7): { from: Date; to: Date } {
  const from = startOfDay(new Date());
  const to = addDays(from, days);

  return { from, to };
}