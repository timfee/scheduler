import "server-only";

import { db } from "@/infrastructure/database";
import { decrypt, encrypt } from "@/infrastructure/database/encryption";
import {
  calendarIntegrations,
  calendars,
  type CalendarIntegration,
  type NewCalendarIntegration,
  type Calendar,
  type NewCalendar,
} from "@/infrastructure/database/schema";
import { type CalendarCapability } from "@/types/constants";
import { CalendarConnectionError } from "@/lib/errors";
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
export function resolveServerUrl(provider: ProviderType, customUrl?: string): string {
  const wellKnownUrl = WELL_KNOWN_SERVERS[provider];

  // For providers that require custom URLs
  if (!wellKnownUrl && !customUrl) {
    throw new Error(`Provider ${provider} requires a custom server URL`);
  }

  return wellKnownUrl ?? customUrl ?? "";
}

/**
 * Ensure the config has a server and calendar URL. If missing, attempt
 * to resolve the well-known server URL and discover the first calendar.
 */
export async function prepareConfig(
  provider: ProviderType,
  config: CalendarIntegrationConfig,
): Promise<CalendarIntegrationConfig> {
  try {
    const resolved = {
      ...config,
      serverUrl: resolveServerUrl(provider, config.serverUrl),
    } as CalendarIntegrationConfig;

    // Don't auto-select calendar anymore - let user choose
    return resolved;
  } catch (error) {
    throw new CalendarConnectionError(
      error instanceof Error ? error.message : "Failed to prepare configuration",
      "INVALID_CONFIG",
    );
  }
}

/**
 * Create a new calendar integration
 */
export async function createCalendarIntegration(
  input: CreateCalendarIntegrationInput,
): Promise<CalendarIntegration> {
  const now = new Date();

  // Validate and prepare server URL
  const serverUrl = resolveServerUrl(input.provider, input.config.serverUrl);

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
  const created = db
    .insert(calendarIntegrations)
    .values(newIntegration)
    .returning()
    .get();
  return created;
}

// NEW: Add calendars to an integration
export async function addCalendarToIntegration(
  integrationId: string,
  calendarUrl: string,
  displayName: string,
  capability: CalendarCapability,
): Promise<Calendar> {
  const newCalendar: NewCalendar = {
    id: uuid(),
    integrationId,
    calendarUrl,
    displayName,
    capability,
    createdAt: new Date(),
  };

  const created = db.insert(calendars).values(newCalendar).returning().get();
  return created;
}

// NEW: Get calendars for an integration
export async function getCalendarsForIntegration(
  integrationId: string,
): Promise<Calendar[]> {
  return db.select().from(calendars).where(eq(calendars.integrationId, integrationId));
}

// NEW: Update calendar capability
export async function updateCalendarCapability(
  calendarId: string,
  capability: CalendarCapability,
): Promise<Calendar> {
  const updated = db
    .update(calendars)
    .set({ capability })
    .where(eq(calendars.id, calendarId))
    .returning()
    .get();
  return updated;
}

// NEW: Remove a calendar
export async function removeCalendar(calendarId: string): Promise<boolean> {
  const result = db.delete(calendars).where(eq(calendars.id, calendarId)).run();
  return result.changes > 0;
}

/**
 * Get all calendar integrations
 */
export async function listCalendarIntegrations(): Promise<
  Array<CalendarIntegration & { config: CalendarIntegrationConfig }>
> {
  const integrations = await db.select().from(calendarIntegrations);

  return integrations.map((integration) => {
    let cfg: CalendarIntegrationConfig | Record<string, unknown> = {};
    try {
      cfg = JSON.parse(decrypt(integration.encryptedConfig)) as Record<string, unknown>;
    } catch {
      cfg = {};
    }
    return {
      ...integration,
      config: cfg as unknown as CalendarIntegrationConfig,
    };
  });
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

  try {
    const cfg = JSON.parse(decrypt(integration.encryptedConfig)) as Record<string, unknown>;
    return {
      ...integration,
      config: cfg as unknown as CalendarIntegrationConfig,
    };
  } catch {
    return {
      ...integration,
      config: {} as CalendarIntegrationConfig,
    };
  }
}

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

  try {
    const cfg = JSON.parse(decrypt(integration.encryptedConfig)) as Record<string, unknown>;
    return {
      ...integration,
      config: cfg as unknown as CalendarIntegrationConfig,
    };
  } catch {
    return {
      ...integration,
      config: {} as CalendarIntegrationConfig,
    };
  }
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
      mergedConfig.serverUrl = resolveServerUrl(
        existing.provider as ProviderType,
        mergedConfig.serverUrl,
      );
    }

    try {
      updates.encryptedConfig = encrypt(JSON.stringify(mergedConfig));
    } catch (error) {
      throw error instanceof Error ? error : new Error("Failed to encrypt");
    }
  }

  if (input.isPrimary !== undefined) {
    updates.isPrimary = input.isPrimary;
    if (input.isPrimary) {
      db.update(calendarIntegrations)
        .set({ isPrimary: false })
        .where(eq(calendarIntegrations.isPrimary, true))
        .run();
    }
  }
  const result = db
    .update(calendarIntegrations)
    .set(updates)
    .where(eq(calendarIntegrations.id, id))
    .returning()
    .get();
  return result ?? null;
}

/**
 * Delete a calendar integration
 */
export async function deleteCalendarIntegration(id: string): Promise<boolean> {
  const result = db
    .delete(calendarIntegrations)
    .where(eq(calendarIntegrations.id, id))
    .run();
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
 * Create a DAV client from a config
 */
export async function createDAVClientFromConfig(
  config: CalendarIntegrationConfig,
): Promise<Awaited<ReturnType<typeof createDAVClient>>> {
  if (config.authMethod === "Basic") {
    if (!config.username || !config.password) {
      throw new Error("Missing username or password");
    }

    if (!config.serverUrl) {
      throw new Error("Missing server URL");
    }

    return createDAVClient({
      serverUrl: config.serverUrl,
      credentials: {
        username: config.username,
        password: config.password,
      },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });
  }

  if (config.authMethod === "Oauth") {
    if (!config.refreshToken || !config.clientId || !config.clientSecret) {
      throw new Error("Missing OAuth credentials");
    }

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

/**
 * Test calendar connection
 */
export async function testCalendarConnection(
  config: CalendarIntegrationConfig,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await createDAVClientFromConfig(config);

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
  return createDAVClientFromConfig(config);
}

export interface CalendarOption {
  url: string;
  displayName: string;
}

export async function fetchCalendarOptions(
  client: Awaited<ReturnType<typeof createDAVClient>>,
): Promise<CalendarOption[]> {
  const calendars = await client.fetchCalendars();
  return calendars.map((c) => ({
    url: c.url,
    displayName: typeof c.displayName === "string" ? c.displayName : c.url,
  }));
}
