"use server";

import {
  createCalendarIntegration,
  deleteCalendarIntegration,
  getCalendarIntegration,
  testCalendarConnection,
  prepareConfig,
  updateCalendarIntegration,
  createDAVClientFromConfig,
  createDAVClientFromIntegration,
  fetchCalendarOptions,
  listCalendarIntegrations,
  isProviderType,
  addCalendarToIntegration,
  getCalendarsForIntegration,
  updateCalendarCapability,
  removeCalendar,
  type CreateCalendarIntegrationInput,
  type ProviderType,
  type UpdateCalendarIntegrationInput,
  type CalendarOption,
} from "@/infrastructure/database/integrations";
import { db } from "@/infrastructure/database";
import { calendarIntegrations } from "@/infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { getConnections } from './data';
import { mapErrorToUserMessage } from '@/lib/errors';
import {
  buildConfigFromValues,
  mergeConfig,
} from "@/infrastructure/database/config-utils";
import {
  connectionFormSchema,
  type ConnectionFormValues,
  connectionConfigSchema,
} from "./schemas/connection";
import { revalidatePath, revalidateTag } from "next/cache";
import { type ConnectionListItem } from "./data";
import { CALENDAR_CAPABILITY, type CalendarCapability } from "@/lib/types/constants";
import { z } from "zod/v4";

export type { ProviderType };
export type { CalendarOption };

export type ConnectionFormData = ConnectionFormValues;

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

/**
 * Create a new calendar connection
 */
export async function createConnectionAction(
  formData: ConnectionFormData,
): Promise<{ id: string; displayName: string }> {
  try {
    const parsed = connectionFormSchema.safeParse(formData);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message);
    }

    const values = parsed.data;
    const rawConfig = buildConfigFromValues(values);
    const config = await prepareConfig(values.provider, rawConfig);

    // Test the connection first
    const testResult = await testCalendarConnection(config);
    if (!testResult.success) {
      throw new Error(testResult.error ?? "Connection test failed");
    }

    // Create the integration
    const input: CreateCalendarIntegrationInput = {
      provider: values.provider,
      displayName: values.displayName,
      config,
    };

    const integration = await createCalendarIntegration(input);

    revalidatePath("/connections");
    revalidateTag("calendars");

    return {
      id: integration.id,
      displayName: integration.displayName,
    };
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to create connection"));
  }
}

/**
 * Update an existing calendar connection
 */
export async function updateConnectionAction(
  id: string,
  formData: Partial<ConnectionFormData>,
): Promise<{ id: string; displayName: string }> {
  try {
    const existing = await getCalendarIntegration(id);
    if (!existing) {
      throw new Error("Connection not found");
    }

    const updateInput: UpdateCalendarIntegrationInput = {};

    if (formData.displayName !== undefined) {
      updateInput.displayName = formData.displayName;
    }

    // Handle config updates
    const hasConfigUpdates = Object.keys(formData).some((key) =>
      [
        "username",
        "password",
        "refreshToken",
        "clientId",
        "clientSecret",
        "tokenUrl",
        "serverUrl",
        "calendarUrl",
        "capabilities",
      ].includes(key),
    );

    if (hasConfigUpdates) {
      const { config, credentialsChanged } = mergeConfig(
        existing.config,
        formData,
      );

      if (!isProviderType(existing.provider)) {
        throw new Error("Invalid provider");
      }
      const prepared = await prepareConfig(existing.provider, config);

      if (credentialsChanged) {
        const testResult = await testCalendarConnection(prepared);
        if (!testResult.success) {
          throw new Error(testResult.error ?? "Connection test failed");
        }
      }

      updateInput.config = prepared;
    }

    const updated = await updateCalendarIntegration(id, updateInput);
    if (!updated) {
      throw new Error("Failed to update connection");
    }

    revalidatePath("/connections");
    revalidateTag("calendars");

    return {
      id: updated.id,
      displayName: updated.displayName,
    };
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to update connection"));
  }
}

/**
 * Delete a calendar connection
 */
export async function deleteConnectionAction(id: string): Promise<void> {
  try {
    const deleted = await deleteCalendarIntegration(id);
    if (!deleted) {
      throw new Error("Connection not found");
    }

    revalidatePath("/connections");
    revalidateTag("calendars");

    return;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to delete connection"));
  }
}

/**
 * List all calendar connections
 */
export async function listConnectionsAction(): Promise<ConnectionListItem[]> {
  try {
    const data = await getConnections();
    return data;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to list connections"));
  }
}

/**
 * Test a calendar connection
 */
export async function testConnectionAction(
  provider: ProviderType,
  config: Partial<ConnectionFormData>,
): Promise<void> {
  try {
    const parsed = connectionConfigSchema.safeParse({
      provider,
      ...config,
      displayName: "",
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message);
    }

    const raw = buildConfigFromValues(parsed.data);
    const testConfig = await prepareConfig(provider, raw);

    const result = await testCalendarConnection(testConfig);
    if (!result.success) {
      throw new Error(result.error ?? "Connection test failed");
    }
    return;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Connection test failed"));
  }
}

/**
 * List available calendars for given credentials
 */
export async function listCalendarsAction(
  provider: ProviderType,
  config: Partial<ConnectionFormData>,
): Promise<CalendarOption[]> {
  try {
    const parsed = connectionConfigSchema.safeParse({
      provider,
      ...config,
      displayName: "",
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message);
    }

    const raw = buildConfigFromValues(parsed.data);
    const prepared = await prepareConfig(provider, raw);

    const client = await createDAVClientFromConfig(prepared);
    const calendars = await fetchCalendarOptions(client);
    return calendars;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to list calendars"));
  }
}

export interface ConnectionDetails {
  calendarUrl?: string;
}

/**
 * Get sanitized details for an existing connection
 */
export async function getConnectionDetailsAction(
  id: string,
): Promise<ConnectionDetails> {
  try {
    const integration = await getCalendarIntegration(id);
    if (!integration) {
      throw new Error("Connection not found");
    }

    return { calendarUrl: integration.config.calendarUrl };
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to load connection"));
  }
}

/**
 * List available calendars for an existing connection
 */
export async function listCalendarsForConnectionAction(
  id: string,
): Promise<CalendarOption[]> {
  try {
    const integration = await getCalendarIntegration(id);
    if (!integration) {
      throw new Error("Connection not found");
    }

    const client = await createDAVClientFromIntegration(integration);
    const calendars = await fetchCalendarOptions(client);
    return calendars;
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to list calendars"));
  }
}

/**
 * Update the display order of a connection
 */
export async function updateCalendarOrderAction(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  try {
    const list = await listCalendarIntegrations();
    const index = list.findIndex((c: { id: string }) => c.id === id);
    if (index === -1) throw new Error("Connection not found");

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;

    const current = list[index]!;
    const target = list[newIndex]!;

    db.transaction((tx) => {
      tx
        .update(calendarIntegrations)
        .set({ displayOrder: current.displayOrder })
        .where(eq(calendarIntegrations.id, target.id))
        .run();
      tx
        .update(calendarIntegrations)
        .set({ displayOrder: target.displayOrder })
        .where(eq(calendarIntegrations.id, current.id))
        .run();
    });

    revalidatePath("/connections");
    revalidateTag("calendars");
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to update order"));
  }
}

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
    revalidateTag("calendars");
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

// Re-export calendar management actions