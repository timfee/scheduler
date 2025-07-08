"use server";

import {
  addCalendarToIntegration,
  getCalendarsForIntegration,
  updateCalendarCapability,
  removeCalendar,
} from "@/lib/db/integrations";
import { type CalendarCapability } from "@/types/constants";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

const addCalendarSchema = z.object({
  integrationId: z.string().uuid(),
  calendarUrl: z.string().url(),
  displayName: z.string().min(1),
  capability: z.enum(["booking", "blocking_available", "blocking_busy"]),
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

    const result = await addCalendarToIntegration(
      validated.integrationId,
      validated.calendarUrl,
      validated.displayName,
      validated.capability as CalendarCapability,
    );

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    revalidatePath("/connections");
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add calendar",
    };
  }
}

export async function updateCalendarCapabilityAction(
  calendarId: string,
  capability: CalendarCapability,
) {
  try {
    const result = await updateCalendarCapability(calendarId, capability);

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    revalidatePath("/connections");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update calendar",
    };
  }
}

export async function removeCalendarAction(calendarId: string) {
  try {
    const result = await removeCalendar(calendarId);

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    revalidatePath("/connections");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove calendar",
    };
  }
}

export async function listCalendarsForIntegrationAction(integrationId: string) {
  try {
    const calendars = await getCalendarsForIntegration(integrationId);
    return { success: true, data: calendars };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list calendars",
    };
  }
}
