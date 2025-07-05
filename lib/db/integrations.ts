import "server-only";

import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/db/encryption";
import {
  calendarIntegrations,
  type CalendarIntegration,
  type NewCalendarIntegration,
} from "@/lib/db/schema";
import { type CalendarCapability } from "@/types/constants";
import { eq } from "drizzle-orm";
import { createDAVClient } from "tsdav";
import { v4 as uuid } from "uuid";

// Well-known CalDAV server URLs
const WELL_KNOWN_SERVERS = {
  google: "https://apidata.googleusercontent.com/caldav/v2/",
  apple: "https://caldav.icloud.com",
  fastmail: "https://caldav.fastmail.com/dav/calendars",
  nextcloud: "", // User must provide full URL
  caldav: "", // Generic CalDAV - user provides URL
} as const;

export type ProviderType = keyof typeof WELL_KNOWN_SERVERS;

export interface BaseCalendarConfig {
  capabilities: CalendarCapability[]; // ['conflict', 'availability', 'booking']
}

export interface BasicAuthConfig extends BaseCalendarConfig {
  authMethod: "Basic";
  username: string;
  password: string;
  serverUrl: string;
  calendarUrl?: string;
}

export interface OAuthConfig extends BaseCalendarConfig {
  authMethod: "Oauth";
  username: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  serverUrl: string;
  calendarUrl?: string;
}

export type CalendarIntegrationConfig = BasicAuthConfig | OAuthConfig;

export interface CreateCalendarIntegrationInput {
  provider: ProviderType;
  displayName: string;
  config: CalendarIntegrationConfig;
  isPrimary?: boolean;
}

export interface UpdateCalendarIntegrationInput {
  displayName?: string;
  config?: CalendarIntegrationConfig;
  isPrimary?: boolean;
}

/**
 * Get the server URL for a provider
 */
function getServerUrl(provider: ProviderType, customUrl?: string): string {
  const wellKnownUrl = WELL_KNOWN_SERVERS[provider];

  // For providers that require custom URLs
  if (!wellKnownUrl && !customUrl) {
    throw new Error(`Provider ${provider} requires a custom server URL`);
  }

  return wellKnownUrl ?? customUrl ?? "";
}

/**
 * Create a new calendar integration
 */
export async function createCalendarIntegration(
  input: CreateCalendarIntegrationInput,
): Promise<CalendarIntegration> {
  const now = new Date();

  // Validate and prepare server URL
  const serverUrl = getServerUrl(input.provider, input.config.serverUrl);

  // Update config with proper server URL
  const configWithServerUrl = {
    ...input.config,
    serverUrl,
  };

  // Encrypt the configuration
  const encryptedConfig = encrypt(JSON.stringify(configWithServerUrl));

  const newIntegration: NewCalendarIntegration = {
    id: uuid(),
    provider: input.provider,
    displayName: input.displayName,
    encryptedConfig,
    isPrimary: input.isPrimary ?? false,
    createdAt: now,
    updatedAt: now,
  };

  const created = db.transaction((tx) => {
    if (input.isPrimary) {
      tx
        .update(calendarIntegrations)
        .set({ isPrimary: false })
        .where(eq(calendarIntegrations.isPrimary, true));
    }

    const [inserted] = tx
      .insert(calendarIntegrations)
      .values(newIntegration)
      .returning();

    return inserted;
  });

  return created;
}

/**
 * Get all calendar integrations
 */
export async function listCalendarIntegrations(): Promise<
  Array<CalendarIntegration & { config: CalendarIntegrationConfig }>
> {
  const integrations = await db.select().from(calendarIntegrations);

  return integrations.map((integration) => ({
    ...integration,
    config: JSON.parse(
      decrypt(integration.encryptedConfig),
    ) as CalendarIntegrationConfig,
  }));
}

/**
 * Get a specific calendar integration by ID
 */
export async function getCalendarIntegration(
  id: string,
): Promise<
  (CalendarIntegration & { config: CalendarIntegrationConfig }) | null
> {
  const [integration] = await db
    .select()
    .from(calendarIntegrations)
    .where(eq(calendarIntegrations.id, id))
    .limit(1);

  if (!integration) {
    return null;
  }

  return {
    ...integration,
    config: JSON.parse(
      decrypt(integration.encryptedConfig),
    ) as CalendarIntegrationConfig,
  };
}

/**
 * Get the primary calendar integration
 */
export async function getPrimaryCalendarIntegration(): Promise<
  (CalendarIntegration & { config: CalendarIntegrationConfig }) | null
> {
  const [integration] = await db
    .select()
    .from(calendarIntegrations)
    .where(eq(calendarIntegrations.isPrimary, true))
    .limit(1);

  if (!integration) {
    return null;
  }

  return {
    ...integration,
    config: JSON.parse(
      decrypt(integration.encryptedConfig),
    ) as CalendarIntegrationConfig,
  };
}

/**
 * Update a calendar integration
 */
export async function updateCalendarIntegration(
  id: string,
  input: UpdateCalendarIntegrationInput,
): Promise<CalendarIntegration | null> {
  const existing = await getCalendarIntegration(id);
  if (!existing) {
    return null;
  }

  const updates: Partial<NewCalendarIntegration> = {
    updatedAt: new Date(),
  };

  if (input.displayName !== undefined) {
    updates.displayName = input.displayName;
  }

  if (input.config !== undefined) {
    // Merge with existing config
    const mergedConfig = {
      ...existing.config,
      ...input.config,
    };

    // Ensure server URL is set
    if (!mergedConfig.serverUrl && existing.provider !== "caldav") {
      mergedConfig.serverUrl = getServerUrl(
        existing.provider as ProviderType,
        mergedConfig.serverUrl,
      );
    }

    updates.encryptedConfig = encrypt(JSON.stringify(mergedConfig));
  }

  if (input.isPrimary !== undefined) {
    updates.isPrimary = input.isPrimary;
  }

  const updated = db.transaction((tx) => {
    if (input.isPrimary) {
      tx
        .update(calendarIntegrations)
        .set({ isPrimary: false })
        .where(eq(calendarIntegrations.isPrimary, true));
    }

    const [result] = tx
      .update(calendarIntegrations)
      .set(updates)
      .where(eq(calendarIntegrations.id, id))
      .returning();

    return result ?? null;
  });

  return updated;
}

/**
 * Delete a calendar integration
 */
export async function deleteCalendarIntegration(id: string): Promise<boolean> {
  const result = await db
    .delete(calendarIntegrations)
    .where(eq(calendarIntegrations.id, id));

  return result.changes > 0;
}

/**
 * Get calendar integrations by capability
 */
export async function getCalendarIntegrationsByCapability(
  capability: CalendarCapability,
): Promise<Array<CalendarIntegration & { config: CalendarIntegrationConfig }>> {
  const allIntegrations = await listCalendarIntegrations();

  return allIntegrations.filter((integration) =>
    integration.config.capabilities.includes(capability),
  );
}

/**
 * Test calendar connection
 */
export async function testCalendarConnection(
  provider: ProviderType,
  config: CalendarIntegrationConfig,
): Promise<{ success: boolean; error?: string }> {
  try {
    let client;

    if (config.authMethod === "Basic") {
      // Basic auth for Apple, FastMail, and generic CalDAV
      if (!config.username || !config.password) {
        return { success: false, error: "Missing username or password" };
      }

      if (!config.serverUrl) {
        return { success: false, error: "Missing server URL" };
      }

      client = await createDAVClient({
        serverUrl: config.serverUrl,
        credentials: {
          username: config.username,
          password: config.password,
        },
        authMethod: "Basic",
        defaultAccountType: "caldav",
      });
    } else if (config.authMethod === "Oauth") {
      // OAuth for Google
      if (!config.refreshToken || !config.clientId || !config.clientSecret) {
        return { success: false, error: "Missing OAuth credentials" };
      }

      client = await createDAVClient({
        serverUrl: config.serverUrl,
        credentials: {
          tokenUrl: config.tokenUrl,
          username: config.username,
          refreshToken: config.refreshToken,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
        },
        authMethod: "Oauth",
        defaultAccountType: "caldav",
      });
    } else {
      return { success: false, error: "Invalid auth method" };
    }

    // Test by fetching calendars
    const calendars = await client.fetchCalendars();

    if (calendars.length === 0) {
      return { success: false, error: "No calendars found" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Create a DAV client from an integration
 */
export async function createDAVClientFromIntegration(
  integration: CalendarIntegration & { config: CalendarIntegrationConfig },
) {
  const { config } = integration;

  if (config.authMethod === "Basic") {
    return createDAVClient({
      serverUrl: config.serverUrl,
      credentials: {
        username: config.username,
        password: config.password,
      },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });
  } else if (config.authMethod === "Oauth") {
    return createDAVClient({
      serverUrl: config.serverUrl,
      credentials: {
        tokenUrl: config.tokenUrl,
        username: config.username,
        refreshToken: config.refreshToken,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      },
      authMethod: "Oauth",
      defaultAccountType: "caldav",
    });
  }

  throw new Error("Invalid auth method");
}
