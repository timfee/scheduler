"use server";

import { userMessageFromError } from "@/lib/errors";
import {
  createDAVClientFromIntegration,
  getBookingCalendar,
} from "@/infrastructure/database/integrations";
import { createCalDavProvider } from "@/infrastructure/providers/caldav";
import { DEFAULT_TIMEZONE } from "@/lib/types/constants";

import { getAppointmentType } from "./data";
import { bookingFormSchema, type BookingFormData } from "@/lib/schemas/booking";

// Simple in-memory rate limiter keyed by email address
const lastBookingAt = new Map<string, number>();

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

// Export for testing purposes
export function clearRateLimiter() {
  lastBookingAt.clear();
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

    const conflicts = await provider.listBusyTimes({
      from: start.toISOString(),
      to: end.toISOString(),
    });
    if (conflicts.length > 0) {
      throw new Error("Selected time is not available");
    }

    await provider.createAppointment({
      title: `${apptType.name} - ${name}`,
      description: `Scheduled via booking form for ${email}`,
      startUtc: start.toISOString(),
      endUtc: end.toISOString(),
      ownerTimeZone: DEFAULT_TIMEZONE,
      location: "",
    });
  } catch (error) {
    throw new Error(userMessageFromError(error, "Failed to create booking"));
  }
}
