"use server";

import { getPrimaryCalendarIntegration, createDAVClientFromIntegration } from "@/lib/db/integrations";
import { createCalDavProvider } from "@/providers/caldav";
import { type DAVClient } from "tsdav";

export async function listBusyTimesAction(from: string, to: string) {
  const integration = await getPrimaryCalendarIntegration();
  if (!integration) return [];

  const client = await createDAVClientFromIntegration(integration);
  const provider = createCalDavProvider(
    client as unknown as DAVClient,
    integration.config.calendarUrl ?? "",
  );

  return provider.listBusyTimes({ from, to });
}
