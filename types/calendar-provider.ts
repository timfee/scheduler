// types/calendar-provider.ts
import {
  type CalendarEvent,
  type CalendarEventInput,
} from "@/schemas/calendar-event";

import { type CalendarCapability, type ProviderName } from "./constants";

export interface ConflictCalendar {
  listBusyTimes(opts: {
    from: string;
    to: string;
  }): Promise<Array<{ startUtc: string; endUtc: string }>>;
}

export interface BookingCalendar {
  createAppointment(input: CalendarEventInput): Promise<CalendarEvent>;
  cancelAppointment(id: string): Promise<void>;
}

export interface CalendarProviderMetadata {
  id: string;
  providerName: ProviderName;
  displayName: string;
  calendarId: string;
  capabilities: CalendarCapability[];
}

export type CalendarIntegration = CalendarProviderMetadata &
  Partial<ConflictCalendar> &
  Partial<BookingCalendar>;
