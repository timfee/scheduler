"use server";

import { unstable_cache } from 'next/cache'
import { getBookingCalendar, createDAVClientFromIntegration } from "@/lib/database/integrations";
import { createCalDavProvider } from "@/lib/providers/caldav";
import { mapErrorToUserMessage } from "@/lib/errors";

const cachedListBusyTimes = async (from: string, to: string) => {
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

export async function listBusyTimesAction(from: string, to: string) {
  return unstable_cache(
    async () => cachedListBusyTimes(from, to),
    [`busy-times-${from}-${to}`],
    { 
      revalidate: 300, // Cache for 5 minutes
      tags: ['busy-times']
    }
  )();
}