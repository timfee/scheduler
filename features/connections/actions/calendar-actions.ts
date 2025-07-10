"use server";

import {
  addCalendarToIntegration,
  getCalendarsForIntegration,
  updateCalendarCapability,
  removeCalendar,
} from "@/infrastructure/database/integrations";
import { CALENDAR_CAPABILITY, type CalendarCapability } from "@/types/constants";
import { revalidatePath } from "next/cache";
import { mapErrorToUserMessage } from "@/lib/errors";
import { z } from "zod/v4";

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
) {
  try {
    const validated = addCalendarSchema.parse({
      integrationId,
      calendarUrl,
      displayName,
      capability,
    });

    const calendar = await addCalendarToIntegration(
      validated.integrationId,
      validated.calendarUrl,
      validated.displayName,
      validated.capability,
    );

    revalidatePath("/connections");
    return calendar;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to add calendar"));
  }
}

export async function updateCalendarCapabilityAction(
  calendarId: string,
  capability: CalendarCapability,
) {
  try {
    await updateCalendarCapability(calendarId, capability);

    revalidatePath("/connections");
    return;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to update calendar"));
  }
}

export async function removeCalendarAction(calendarId: string) {
  try {
    const deleted = await removeCalendar(calendarId);

    if (!deleted) {
      throw new Error("Failed to remove calendar");
    }

    revalidatePath("/connections");
    return;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to remove calendar"));
  }
}

export async function listCalendarsForIntegrationAction(integrationId: string) {
  try {
    const calendars = await getCalendarsForIntegration(integrationId);
    return calendars;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to list calendars"));
  }
}
