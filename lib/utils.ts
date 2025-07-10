import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Date object to YYYY-MM-DD format
 */
export function formatDateForBooking(date: Date): string {
  const isoString = date.toISOString();
  const datePart = isoString.split('T')[0];
  if (!datePart) {
    throw new Error('Invalid date format');
  }
  return datePart;
}
