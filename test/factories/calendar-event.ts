import { randomUUID } from "crypto";
import {
  type CalendarEvent,
  type CalendarEventInput,
} from "@/lib/schemas/calendar-event";

import { Factory } from "./base";

/**
 * Factory for creating calendar events
 */
export const calendarEventFactory = Factory.define<CalendarEvent>(() => ({
  id: randomUUID(),
  title: "Test Event",
  description: "Test event description",
  location: "Test Location",
  startUtc: "2024-01-01T10:00:00.000Z",
  endUtc: "2024-01-01T10:30:00.000Z",
  createdUtc: "2024-01-01T09:00:00.000Z",
  updatedUtc: "2024-01-01T09:00:00.000Z",
  ownerTimeZone: "UTC",
  metadata: {},
}));

/**
 * Factory for creating calendar event input data
 */
export const calendarEventInputFactory = Factory.define<CalendarEventInput>(
  () => ({
    title: "Test Event",
    description: "Test event description",
    location: "Test Location",
    startUtc: "2024-01-01T10:00:00.000Z",
    endUtc: "2024-01-01T10:30:00.000Z",
    ownerTimeZone: "UTC",
  }),
);

/**
 * Calendar event factory variants
 */
export const calendarEventVariants = {
  intro: () =>
    calendarEventFactory.build({
      title: "Intro Meeting",
      description: "Introduction meeting",
    }),

  followUp: () =>
    calendarEventFactory.build({
      title: "Follow-up Meeting",
      description: "Follow-up discussion",
    }),

  consultation: () =>
    calendarEventFactory.build({
      title: "Consultation",
      description: "Consultation session",
    }),

  withDuration: (durationMinutes: number) => {
    const start = new Date("2024-01-01T10:00:00.000Z");
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    return calendarEventFactory.build({
      startUtc: start.toISOString(),
      endUtc: end.toISOString(),
    });
  },

  withTimeRange: (startUtc: string, endUtc: string) =>
    calendarEventFactory.build({ startUtc, endUtc }),

  withTimezone: (ownerTimeZone: string) =>
    calendarEventFactory.build({ ownerTimeZone }),
};
