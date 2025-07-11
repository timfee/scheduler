"use server";

import { unstable_cache } from 'next/cache'
import { getBookingCalendar, createDAVClientFromIntegration } from "@/infrastructure/database/integrations";
import { createCalDavProvider } from "@/infrastructure/providers/caldav";
import { mapErrorToUserMessage } from "@/lib/errors";

const listBusyTimes = async (from: string, to: string) => {
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
    throw new Error(mapErrorToUserMessage(error, "Failed to list busy times"));
  }
};

export const listBusyTimesAction = (from: string, to: string) => 
  unstable_cache(
    () => listBusyTimes(from, to),
    [`busy-times-${from}-${to}`],
    { 
      revalidate: 300, // Cache for 5 minutes
      tags: ['busy-times']
    }
  )();
