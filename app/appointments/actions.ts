"use server";

import { getBookingCalendar, createDAVClientFromIntegration } from "@/infrastructure/database/integrations";
import { createCalDavProvider } from "@/infrastructure/providers/caldav";
import { userMessageFromError } from "@/features/shared/errors";

export async function listBusyTimesAction(from: string, to: string) {
  try {
    const integration = await getBookingCalendar();
    if (!integration) return [];

    const client = await createDAVClientFromIntegration(integration);
    const provider = createCalDavProvider(
      client,
      integration.config.calendarUrl ?? "",
    );

    return provider.listBusyTimes({ from, to });
  } catch (error) {
    throw new Error(userMessageFromError(error, "Failed to list busy times"));
  }
}
