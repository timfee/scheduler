"use server";

import { mapErrorToUserMessage } from "@/lib/errors";
import {
  createDAVClientFromIntegration,
  getBookingCalendar,
} from "@/infrastructure/database/integrations";
import { createCalDavProvider } from "@/infrastructure/providers/caldav";
import { DEFAULT_TIMEZONE } from "@/lib/types/constants";

import { getAppointmentType } from "./data";
import { bookingFormSchema, type BookingFormData } from "./schemas/booking";

// Simple in-memory rate limiter keyed by email address
const lastBookingAt = new Map<string, number>();

// In-memory lock to prevent double booking race condition
// Maps time slot keys to promises representing ongoing booking attempts
const bookingLocks = new Map<string, Promise<void>>();

// Cleanup old rate limit entries to prevent memory growth
// Remove entries older than 2 minutes (rate limit is 1 minute)
const CLEANUP_THRESHOLD = 2 * 60 * 1000; // 2 minutes in milliseconds

function cleanupOldEntries() {
  const now = Date.now();
  const cutoff = now - CLEANUP_THRESHOLD;
  
  // Use forEach instead of for...of for better compatibility
  lastBookingAt.forEach((timestamp, email) => {
    if (timestamp < cutoff) {
      lastBookingAt.delete(email);
    }
  });
}

// Generate a unique key for a time slot to prevent concurrent bookings
function getTimeSlotKey(startTime: Date, endTime: Date): string {
  return `${startTime.toISOString()}-${endTime.toISOString()}`;
}

/**
 * Server action to create a booking on the configured calendar.
 *
 * Validates the submitted form data, resolves the appointment type and
 * booking calendar and then creates the event via CalDAV.
 */
export async function createBookingAction(formData: BookingFormData) {
  try {
    const { type, date, time, name, email } = bookingFormSchema.parse(formData);

    // Clean up old entries before rate limit check
    cleanupOldEntries();
    
    const now = Date.now();
    const last = lastBookingAt.get(email) ?? 0;
    if (now - last < 60_000) {
      throw new Error("Too many booking attempts. Please wait a minute.");
    }
    lastBookingAt.set(email, now);

    const apptType = await getAppointmentType(type);
    if (!apptType) {
      throw new Error("Invalid appointment type");
    }

    const start = new Date(`${date}T${time}:00Z`);
    const end = new Date(
      start.getTime() + apptType.durationMinutes * 60 * 1000,
    );

    const integration = await getBookingCalendar();
    if (!integration) {
      throw new Error("No booking calendar configured");
    }

    const client = await createDAVClientFromIntegration(integration);
    const provider = createCalDavProvider(
      client,
      integration.config.calendarUrl ?? "",
    );

    // Create a unique key for this time slot to prevent concurrent bookings
    const timeSlotKey = getTimeSlotKey(start, end);
    
    // Check if there's already a booking attempt in progress for this time slot
    const existingLock = bookingLocks.get(timeSlotKey);
    if (existingLock) {
      // Wait for the existing booking attempt to complete
      await existingLock;
      // After waiting, check if the slot is still available
      const conflicts = await provider.listBusyTimes({
        from: start.toISOString(),
        to: end.toISOString(),
      });
      if (conflicts.length > 0) {
        throw new Error("Selected time is not available");
      }
    }

    // Create a new lock for this booking attempt
    const bookingPromise = (async () => {
      try {
        // Check availability one more time under the lock
        const conflicts = await provider.listBusyTimes({
          from: start.toISOString(),
          to: end.toISOString(),
        });
        if (conflicts.length > 0) {
          throw new Error("Selected time is not available");
        }

        // Create the appointment atomically after confirming availability
        await provider.createAppointment({
          title: `${apptType.name} - ${name}`,
          description: `Scheduled via booking form for ${email}`,
          startUtc: start.toISOString(),
          endUtc: end.toISOString(),
          ownerTimeZone: DEFAULT_TIMEZONE,
          location: "",
        });
      } finally {
        // Clean up the lock when done
        bookingLocks.delete(timeSlotKey);
      }
    })();

    // Store the lock and await the booking
    bookingLocks.set(timeSlotKey, bookingPromise);
    await bookingPromise;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to create booking"));
  }
}

// Export for testing purposes
export function clearRateLimiter() {
  lastBookingAt.clear();
}

// Export for testing purposes
export function clearBookingLocks() {
  bookingLocks.clear();
}
