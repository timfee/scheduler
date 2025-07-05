"use server";

import {
  createCalendarIntegration,
  deleteCalendarIntegration,
  getCalendarIntegration,
  listCalendarIntegrations,
  testCalendarConnection,
  updateCalendarIntegration,
  type CalendarIntegrationConfig,
  type CreateCalendarIntegrationInput,
  type ProviderType,
  type UpdateCalendarIntegrationInput,
} from "@/lib/db/integrations";
import {
  buildConfigFromValues,
  mergeConfig,
} from "@/lib/db/config-utils";
import {
  connectionFormSchema,
  type ConnectionFormValues,
  connectionConfigSchema,
} from "@/schemas/connection";
import { type CalendarCapability } from "@/types/constants";
import { revalidatePath } from "next/cache";

export type { ProviderType };

export type ConnectionFormData = ConnectionFormValues;

export interface ConnectionActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface ConnectionListItem {
  id: string;
  provider: string;
  displayName: string;
  isPrimary: boolean;
  capabilities: CalendarCapability[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new calendar connection
 */
export async function createConnectionAction(
  formData: ConnectionFormData,
): Promise<ConnectionActionResult<{ id: string; displayName: string }>> {
  try {
    const parsed = connectionFormSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message };
    }

    const values = parsed.data;
    const config = buildConfigFromValues(values);

    // Test the connection first
    const testResult = await testCalendarConnection(values.provider, config);
    if (!testResult.success) {
      return {
        success: false,
        error: testResult.error ?? "Connection test failed",
      };
    }

    // Create the integration
    const input: CreateCalendarIntegrationInput = {
      provider: values.provider,
      displayName: values.displayName,
      config,
      isPrimary: values.isPrimary,
    };

    const integration = await createCalendarIntegration(input);

    revalidatePath("/connections");

    return {
      success: true,
      data: {
        id: integration.id,
        displayName: integration.displayName,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create connection",
    };
  }
}

/**
 * Update an existing calendar connection
 */
export async function updateConnectionAction(
  id: string,
  formData: Partial<ConnectionFormData>,
): Promise<ConnectionActionResult<{ id: string; displayName: string }>> {
  try {
    const existing = await getCalendarIntegration(id);
    if (!existing) {
      return {
        success: false,
        error: "Connection not found",
      };
    }

    const updateInput: UpdateCalendarIntegrationInput = {};

    if (formData.displayName !== undefined) {
      updateInput.displayName = formData.displayName;
    }

    if (formData.isPrimary !== undefined) {
      updateInput.isPrimary = formData.isPrimary;
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

      if (credentialsChanged) {
        const testResult = await testCalendarConnection(
          existing.provider as ProviderType,
          config,
        );
        if (!testResult.success) {
          return {
            success: false,
            error: testResult.error ?? "Connection test failed",
          };
        }
      }

      updateInput.config = config;
    }

    const updated = await updateCalendarIntegration(id, updateInput);
    if (!updated) {
      return {
        success: false,
        error: "Failed to update connection",
      };
    }

    revalidatePath("/connections");

    return {
      success: true,
      data: {
        id: updated.id,
        displayName: updated.displayName,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update connection",
    };
  }
}

/**
 * Delete a calendar connection
 */
export async function deleteConnectionAction(
  id: string,
): Promise<ConnectionActionResult<undefined>> {
  try {
    const deleted = await deleteCalendarIntegration(id);
    if (!deleted) {
      return {
        success: false,
        error: "Connection not found",
      };
    }

    revalidatePath("/connections");

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete connection",
    };
  }
}

/**
 * List all calendar connections
 */
export async function listConnectionsAction(): Promise<
  ConnectionActionResult<ConnectionListItem[]>
> {
  try {
    const integrations = await listCalendarIntegrations();

    // Remove sensitive data before sending to client
    const sanitized = integrations.map((integration) => ({
      id: integration.id,
      provider: integration.provider,
      displayName: integration.displayName,
      isPrimary: integration.isPrimary,
      capabilities: integration.config.capabilities,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    }));

    return {
      success: true,
      data: sanitized,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to list connections",
    };
  }
}

/**
 * Test a calendar connection
 */
export async function testConnectionAction(
  provider: ProviderType,
  config: Partial<ConnectionFormData>,
): Promise<ConnectionActionResult<undefined>> {
  try {
    const parsed = connectionConfigSchema.safeParse({
      provider,
      ...config,
      displayName: "",
      isPrimary: false,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message };
    }

    const testConfig = buildConfigFromValues(parsed.data);

    const result = await testCalendarConnection(provider, testConfig);

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    };
  }
}

/**
 * Set a connection as primary
 */
export async function setPrimaryConnectionAction(
  id: string,
): Promise<ConnectionActionResult<undefined>> {
  try {
    const updated = await updateCalendarIntegration(id, { isPrimary: true });
    if (!updated) {
      return {
        success: false,
        error: "Connection not found",
      };
    }

    revalidatePath("/connections");

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to set primary connection",
    };
  }
}
