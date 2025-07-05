"use server";

import {
  createCalendarIntegration,
  deleteCalendarIntegration,
  getCalendarIntegration,
  listCalendarIntegrations,
  testCalendarConnection,
  updateCalendarIntegration,
  type BasicAuthConfig,
  type CalendarIntegrationConfig,
  type CreateCalendarIntegrationInput,
  type OAuthConfig,
  type ProviderType,
  type UpdateCalendarIntegrationInput,
} from "@/lib/db/integrations";
import { revalidatePath } from "next/cache";

export type { ProviderType };

export interface BasicAuthFormData {
  provider: ProviderType;
  displayName: string;
  authMethod: "Basic";
  username: string;
  password: string;
  serverUrl?: string;
  calendarUrl?: string;
  capabilities: string[];
  isPrimary?: boolean;
}

export interface OAuthFormData {
  provider: ProviderType;
  displayName: string;
  authMethod: "Oauth";
  username: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  serverUrl?: string;
  calendarUrl?: string;
  capabilities: string[];
  isPrimary?: boolean;
}

export type ConnectionFormData = BasicAuthFormData | OAuthFormData;

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
  capabilities: string[];
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
    // Build the config object based on auth method
    let config: CalendarIntegrationConfig;

    if (formData.authMethod === "Basic") {
      if (!formData.username || !formData.password) {
        return {
          success: false,
          error: "Username and password are required",
        };
      }

      // For providers other than google, apple, fastmail, we need a custom URL
      if (
        ["nextcloud", "caldav"].includes(formData.provider) &&
        !formData.serverUrl
      ) {
        return {
          success: false,
          error: "Server URL is required for this provider",
        };
      }

      config = {
        authMethod: "Basic",
        username: formData.username,
        password: formData.password,
        serverUrl: formData.serverUrl ?? "",
        calendarUrl: formData.calendarUrl,
        capabilities: formData.capabilities,
      } satisfies BasicAuthConfig;
    } else if (formData.authMethod === "Oauth") {
      if (
        !formData.username ||
        !formData.refreshToken ||
        !formData.clientId ||
        !formData.clientSecret ||
        !formData.tokenUrl
      ) {
        return {
          success: false,
          error: "All OAuth fields are required",
        };
      }

      config = {
        authMethod: "Oauth",
        username: formData.username,
        refreshToken: formData.refreshToken,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        tokenUrl: formData.tokenUrl,
        serverUrl: formData.serverUrl ?? "",
        calendarUrl: formData.calendarUrl,
        capabilities: formData.capabilities,
      } satisfies OAuthConfig;
    } else {
      return {
        success: false,
        error: "Invalid authentication method",
      };
    }

    // Test the connection first
    const testResult = await testCalendarConnection(formData.provider, config);
    if (!testResult.success) {
      return {
        success: false,
        error: testResult.error ?? "Connection test failed",
      };
    }

    // Create the integration
    const input: CreateCalendarIntegrationInput = {
      provider: formData.provider,
      displayName: formData.displayName,
      config,
      isPrimary: formData.isPrimary,
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
    const hasConfigUpdates =
      formData.capabilities !== undefined ||
      (formData.authMethod === "Basic" &&
        (formData.serverUrl !== undefined ||
          formData.username !== undefined ||
          formData.password !== undefined ||
          formData.calendarUrl !== undefined)) ||
      (formData.authMethod === "Oauth" &&
        (formData.refreshToken !== undefined ||
          formData.clientId !== undefined ||
          formData.clientSecret !== undefined));

    if (hasConfigUpdates) {
      let config: CalendarIntegrationConfig;

      if (
        existing.config.authMethod === "Basic" &&
        formData.authMethod === "Basic"
      ) {
        config = {
          ...existing.config,
          capabilities: formData.capabilities ?? existing.config.capabilities,
          serverUrl: formData.serverUrl ?? existing.config.serverUrl,
          username: formData.username ?? existing.config.username,
          password: formData.password ?? existing.config.password,
          calendarUrl: formData.calendarUrl ?? existing.config.calendarUrl,
        };
      } else if (
        existing.config.authMethod === "Oauth" &&
        formData.authMethod === "Oauth"
      ) {
        config = {
          ...existing.config,
          capabilities: formData.capabilities ?? existing.config.capabilities,
          username: formData.username ?? existing.config.username,
          refreshToken: formData.refreshToken ?? existing.config.refreshToken,
          clientId: formData.clientId ?? existing.config.clientId,
          clientSecret: formData.clientSecret ?? existing.config.clientSecret,
          serverUrl: formData.serverUrl ?? existing.config.serverUrl,
          calendarUrl: formData.calendarUrl ?? existing.config.calendarUrl,
        };
      } else {
        // Just update capabilities if auth method doesn't match
        config = {
          ...existing.config,
          capabilities: formData.capabilities ?? existing.config.capabilities,
        };
      }

      // Test the connection if credentials changed
      const credentialsChanged =
        (config.authMethod === "Basic" &&
          formData.authMethod === "Basic" &&
          (formData.serverUrl !== undefined ||
            formData.username !== undefined ||
            formData.password !== undefined)) ||
        (config.authMethod === "Oauth" &&
          formData.authMethod === "Oauth" &&
          (formData.refreshToken !== undefined ||
            formData.clientId !== undefined ||
            formData.clientSecret !== undefined));

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
    let testConfig: CalendarIntegrationConfig;

    if (config.authMethod === "Basic") {
      if (!config.username || !config.password) {
        return {
          success: false,
          error: "Username and password are required",
        };
      }

      // Check if server URL is required
      if (["nextcloud", "caldav"].includes(provider) && !config.serverUrl) {
        return {
          success: false,
          error: "Server URL is required for this provider",
        };
      }

      testConfig = {
        authMethod: "Basic",
        username: config.username,
        password: config.password,
        serverUrl: config.serverUrl ?? "",
        calendarUrl: config.calendarUrl,
        capabilities: config.capabilities ?? [],
      };
    } else if (config.authMethod === "Oauth") {
      if (
        !config.username ||
        !config.refreshToken ||
        !config.clientId ||
        !config.clientSecret ||
        !config.tokenUrl
      ) {
        return {
          success: false,
          error: "All OAuth fields are required",
        };
      }

      testConfig = {
        authMethod: "Oauth",
        username: config.username,
        refreshToken: config.refreshToken,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        tokenUrl: config.tokenUrl,
        serverUrl: config.serverUrl ?? "",
        calendarUrl: config.calendarUrl,
        capabilities: config.capabilities ?? [],
      };
    } else {
      return {
        success: false,
        error: "Invalid authentication method",
      };
    }

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
