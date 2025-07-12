"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod/v4";

import {
  addCalendarToIntegration,
  getCalendarsForIntegration,
  removeCalendar,
  updateCalendarCapability,
} from "@/lib/database/integrations";
import { type Calendar } from "@/lib/schemas/database";
import { mapErrorToUserMessage } from "@/lib/errors";
import { CALENDAR_CAPABILITY, type CalendarCapability } from "@/lib/types/constants";

const addCalendarSchema = z.object({
  integrationId: z.string().uuid(),
  calendarUrl: z.string().url(),
  displayName: z.string().min(1),
  capability: z.enum([
    CALENDAR_CAPABILITY.BOOKING,
    CALENDAR_CAPABILITY.BLOCKING_AVAILABLE,
    CALENDAR_CAPABILITY.BLOCKING_BUSY,
  ]),
});

export async function addCalendarAction(
  integrationId: string,
  calendarUrl: string,
  displayName: string,
  capability: CalendarCapability,
): Promise<Calendar> {
  try {
    const parsed = addCalendarSchema.safeParse({
      integrationId,
      calendarUrl,
      displayName,
      capability,
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message);
    }

    const calendar = await addCalendarToIntegration(
      integrationId,
      calendarUrl,
      displayName,
      capability,
    );

    revalidateTag("calendars");
    return calendar;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to add calendar"));
  }
}

export async function updateCalendarCapabilityAction(
  calendarId: string,
  capability: CalendarCapability,
): Promise<Calendar> {
  try {
    const updated = await updateCalendarCapability(calendarId, capability);
    revalidateTag("calendars");
    return updated;
  } catch (error) {
    throw new Error(
      mapErrorToUserMessage(error, "Failed to update calendar capability"),
    );
  }
}

export async function removeCalendarAction(calendarId: string): Promise<void> {
  try {
    const removed = await removeCalendar(calendarId);
    if (!removed) {
      throw new Error("Failed to remove calendar");
    }
    revalidateTag("calendars");
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to remove calendar"));
  }
}

export async function listCalendarsForIntegrationAction(
  integrationId: string,
): Promise<Calendar[]> {
  try {
    const calendars = await getCalendarsForIntegration(integrationId);
    return calendars;
  } catch (error) {
    throw new Error(
      mapErrorToUserMessage(error, "Failed to list calendars for integration"),
    );
  }
}
