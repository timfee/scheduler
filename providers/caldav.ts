import "server-only";

import {
  DAVClient,
  fetchCalendarObjects,
  createCalendarObject,
  deleteCalendarObject,
} from "tsdav";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import { BookingCalendar, ConflictCalendar } from "@/types/calendar-provider";

export class CalDavUnifiedProvider
  implements ConflictCalendar, BookingCalendar
{
  constructor(
    private readonly client: DAVClient,
    private readonly calendarUrl: string,
  ) {}

  /** Fetch busy time ranges */
  async listBusyTimes(opts: { from: string; to: string }) {
    const objects = await fetchCalendarObjects({
      calendar: { url: this.calendarUrl },
      client: this.client,
      filters: { start: new Date(opts.from), end: new Date(opts.to) },
    });

    return objects.map((obj) => {
      const ve = obj.data.vevent;
      return {
        startUtc: DateTime.fromISO(ve.dtstart.value, { zone: "utc" }).toISO(),
        endUtc: DateTime.fromISO(ve.dtend.value, { zone: "utc" }).toISO(),
      };
    });
  }

  /** Create an event */
  async createAppointment(raw: unknown) {
    const input = CalendarEventInputSchema.parse(raw);
    const uid = uuid();
    const dtstamp = new Date().toISOString();

    const vevent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `SUMMARY:${input.title}`,
      `DESCRIPTION:${input.description ?? ""}`,
      `LOCATION:${input.location ?? ""}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${input.startUtc.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}`,
      `DTEND:${input.endUtc.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    await createCalendarObject({
      calendar: { url: this.calendarUrl },
      client: this.client,
      filename: `${uid}.ics`, // As per tsdav docs; UID must match
      iCalString: vevent,
    });

    const result = {
      ...input,
      id: uid,
      createdUtc: dtstamp,
      updatedUtc: dtstamp,
      ownerTimeZone: DEFAULT_TIMEZONE,
      metadata: {},
    };
    return CalendarEventSchema.parse(result);
  }

  /** Cancel an event by UID */
  async cancelAppointment(uid: string) {
    if (!uid) throw new Error("UID required for deletion");
    await deleteCalendarObject({
      calendarObject: { url: `${this.calendarUrl}/${uid}.ics` },
      client: this.client,
    });
  }
}
