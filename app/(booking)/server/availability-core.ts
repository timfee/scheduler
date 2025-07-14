import { addMinutes, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export interface BusyTime {
  startUtc: string;
  endUtc: string;
}

export interface BusinessHours {
  start: string; // HH:mm format
  end: string; // HH:mm format
  timeZone?: string;
}

export interface AvailabilityOptions {
  selectedDate: string; // YYYY-MM-DD format
  durationMinutes: number;
  businessHours: BusinessHours;
  busyTimes: BusyTime[];
}

/**
 * Calculate available booking slots for a given date and duration
 */
export function calculateAvailableSlots(
  options: AvailabilityOptions,
): string[] {
  const { selectedDate, durationMinutes, businessHours, busyTimes } = options;

  // Get the timezone from business hours, default to UTC
  const businessTimeZone = businessHours.timeZone ?? "UTC";

  // Create business hours in the specified timezone, then convert to UTC for calculation
  const businessStartUtc = fromZonedTime(
    `${selectedDate}T${businessHours.start}:00`,
    businessTimeZone,
  );
  const businessEndUtc = fromZonedTime(
    `${selectedDate}T${businessHours.end}:00`,
    businessTimeZone,
  );

  const availableSlots: string[] = [];

  // Generate all possible slots
  for (
    let slotStartUtc = businessStartUtc;
    slotStartUtc < businessEndUtc;
    slotStartUtc = addMinutes(slotStartUtc, durationMinutes)
  ) {
    const slotEndUtc = addMinutes(slotStartUtc, durationMinutes);

    // Don't create slots that extend beyond business hours
    if (slotEndUtc > businessEndUtc) {
      break;
    }

    // Convert slot times to UTC strings for comparison with busy times
    const slotStartUtcString = slotStartUtc
      .toISOString()
      .replace(/\.000Z$/, "Z");
    const slotEndUtcString = slotEndUtc.toISOString().replace(/\.000Z$/, "Z");

    // Check if slot overlaps with any busy time
    const hasOverlap = busyTimes.some((busy) => {
      const busyStartUtc = busy.startUtc;
      const busyEndUtc = busy.endUtc;

      // Check for overlap: slot starts before busy ends AND slot ends after busy starts
      return slotStartUtcString < busyEndUtc && slotEndUtcString > busyStartUtc;
    });

    if (!hasOverlap) {
      // Display time in business timezone for user readability
      const slotDisplayTime = toZonedTime(slotStartUtc, businessTimeZone);
      availableSlots.push(format(slotDisplayTime, "HH:mm"));
    }
  }

  return availableSlots;
}
