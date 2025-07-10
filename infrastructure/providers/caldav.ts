import {
  CalendarEventInputSchema,
  CalendarEventSchema,
  type CalendarEvent,
  type CalendarEventInput,
} from "@/lib/schemas/calendar-event";
import { DEFAULT_TIMEZONE, ICAL_PROD_ID } from "@/lib/types/constants";
import { formatISO, parseISO } from "date-fns";
import { type createDAVClient } from "tsdav";
import ical from "ical-generator";
import { v4 as uuid } from "uuid";

// Helper functions for type-safe calendar data extraction
function isValidDateProperty(prop: unknown): prop is { value: string } {
  return (
    prop !== null &&
    typeof prop === "object" &&
    "value" in prop &&
    typeof prop.value === "string"
  );
}

function parseVEventDates(vevent: Record<string, unknown>) {
  const { dtstart, dtend } = vevent;

  if (!isValidDateProperty(dtstart) || !isValidDateProperty(dtend)) {
    return null;
  }

  try {
    // Parse ISO dates - they should already be in UTC from CalDAV
    const startDate = parseISO(dtstart.value);
    const endDate = parseISO(dtend.value);

    // Validate that dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null;
    }

    // Format back to ISO strings with UTC timezone
    const startUtc = formatISO(startDate);
    const endUtc = formatISO(endDate);

    return { startUtc, endUtc };
  } catch {
    return null;
  }
}

// Factory function to create provider-specific functions
export function createCalDavProvider(
  client: Awaited<ReturnType<typeof createDAVClient>>,
  calendarUrl: string,
) {
  /**
   * Fetch busy time ranges from the calendar
   */
  async function listBusyTimes(
    opts: { from: string; to: string },
  ): Promise<{ startUtc: string; endUtc: string }[]> {
    const objects = await client.fetchCalendarObjects({
      calendar: { url: calendarUrl },
      timeRange: {
        start: new Date(opts.from).toISOString(),
        end: new Date(opts.to).toISOString(),
      },
    });

    return objects
      .map((obj) => {
        if (!obj.data || typeof obj.data !== "object") return null;
        const data = obj.data as Record<string, unknown>;
        const vevent = data.vevent as Record<string, unknown> | undefined;
        return vevent ? parseVEventDates(vevent) : null;
      })
      .filter((v): v is { startUtc: string; endUtc: string } => Boolean(v));
  }

  /**
   * Create a calendar event
   */
  async function createAppointment(
    input: CalendarEventInput,
  ): Promise<CalendarEvent> {
    const validatedInput = CalendarEventInputSchema.parse(input);
    const uid = uuid();
    const dtstamp = new Date();
    const dtstampIso = dtstamp.toISOString();

    const calendar = ical({ prodId: ICAL_PROD_ID });
    calendar.createEvent({
      id: uid,
      summary: validatedInput.title,
      description: validatedInput.description ?? "",
      location: validatedInput.location ?? "",
      start: new Date(validatedInput.startUtc),
      end: new Date(validatedInput.endUtc),
      created: dtstamp,
      stamp: dtstamp,
    });

    const vevent = calendar.toString();

    await client.createCalendarObject({
      calendar: { url: calendarUrl },
      filename: `${uid}.ics`,
      iCalString: vevent,
    });

    const result: CalendarEvent = {
      ...validatedInput,
      id: uid,
      createdUtc: dtstampIso,
      updatedUtc: dtstampIso,
      ownerTimeZone: validatedInput.ownerTimeZone ?? DEFAULT_TIMEZONE,
      metadata: {},
    };

    return CalendarEventSchema.parse(result);
  }

  /**
   * Cancel a calendar event by UID
   */
  async function cancelAppointment(uid: string): Promise<void> {
    if (!uid) {
      throw new Error("UID is required for deletion");
    }

    await client.deleteCalendarObject({
      calendarObject: {
        url: `${calendarUrl}/${uid}.ics`,
        etag: "", // You may need to fetch the object first to get the etag
      },
    });
  }

  return {
    listBusyTimes,
    createAppointment,
    cancelAppointment,
  };
}

// Type for the returned provider
export type CalDavProvider = ReturnType<typeof createCalDavProvider>;
