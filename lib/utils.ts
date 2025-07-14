import { formatDateForDisplay } from "@/lib/utils/date-range";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Date object to YYYY-MM-DD format
 * @deprecated Use formatDateForDisplay from ./utils/date-range instead
 */
export function formatDateForBooking(date: Date): string {
  return formatDateForDisplay(date);
}
