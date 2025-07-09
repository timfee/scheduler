"use server";

import { getPrimaryCalendarIntegration, createDAVClientFromIntegration } from "@/infrastructure/database/integrations";
import { createCalDavProvider } from "@/infrastructure/providers/caldav";

export async function listBusyTimesAction(from: string, to: string) {
  const integration = await getPrimaryCalendarIntegration();
  if (!integration) return [];

  const client = await createDAVClientFromIntegration(integration);
  const provider = createCalDavProvider(
    client,
    integration.config.calendarUrl ?? "",
  );

  return provider.listBusyTimes({ from, to });
}
