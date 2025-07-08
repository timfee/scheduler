import "server-only";

import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/db/encryption";
import {
  calendarIntegrations,
  calendars,
  type CalendarIntegration,
  type NewCalendarIntegration,
  type Calendar,
  type NewCalendar,
} from "@/lib/db/schema";
import { type CalendarCapability } from "@/types/constants";
import { Result, ok, err, CalendarConnectionError } from "@/lib/errors";
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
}

export interface UpdateCalendarIntegrationInput {
  displayName?: string;
  config?: CalendarIntegrationConfig;
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
): Promise<Result<CalendarIntegrationConfig, CalendarConnectionError>> {
  try {
    const resolved = {
      ...config,
      serverUrl: resolveServerUrl(provider, config.serverUrl),
    } as CalendarIntegrationConfig;

    // Don't auto-select calendar anymore - let user choose
    return ok(resolved);
  } catch (error) {
    return err<CalendarConnectionError>(
      new CalendarConnectionError(
        error instanceof Error ? error.message : "Failed to prepare configuration",
        "INVALID_CONFIG",
      ),
    ) as Result<CalendarIntegrationConfig, CalendarConnectionError>;
  }
}

/**
 * Create a new calendar integration
 */
export async function createCalendarIntegration(
  input: CreateCalendarIntegrationInput,
): Promise<Result<CalendarIntegration, Error>> {
  const now = new Date();

  // Validate and prepare server URL
  const serverUrl = resolveServerUrl(input.provider, input.config.serverUrl);

  // Update config with proper server URL
  const configWithServerUrl = {
    ...input.config,
    serverUrl,
  };

  // Encrypt the configuration
  const encryptResult = encrypt(JSON.stringify(configWithServerUrl));
  if (!encryptResult.success) {
    return err(encryptResult.error);
  }

  const newIntegration: NewCalendarIntegration = {
    id: uuid(),
    provider: input.provider,
    displayName: input.displayName,
    encryptedConfig: encryptResult.data,
    createdAt: now,
    updatedAt: now,
  };
  try {
    const created = db
      .insert(calendarIntegrations)
      .values(newIntegration)
      .returning()
      .get();
    return ok(created);
  } catch (error) {
    return err(error instanceof Error ? error : new Error("Failed to create integration"));
  }
}

// NEW: Add calendars to an integration
export async function addCalendarToIntegration(
  integrationId: string,
  calendarUrl: string,
  displayName: string,
  capability: CalendarCapability,
): Promise<Result<Calendar, Error>> {
  const newCalendar: NewCalendar = {
    id: uuid(),
    integrationId,
    calendarUrl,
    displayName,
    capability,
    createdAt: new Date(),
  };

  try {
    const created = db.insert(calendars).values(newCalendar).returning().get();
    return ok(created);
  } catch (error) {
    return err(error instanceof Error ? error : new Error("Failed to add calendar"));
  }
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
): Promise<Result<Calendar, Error>> {
  try {
    const updated = db
      .update(calendars)
      .set({ capability })
      .where(eq(calendars.id, calendarId))
      .returning()
      .get();
    return ok(updated);
  } catch (error) {
    return err(error instanceof Error ? error : new Error("Failed to update calendar"));
  }
}

// NEW: Remove a calendar
export async function removeCalendar(calendarId: string): Promise<Result<boolean, Error>> {
  try {
    const result = db.delete(calendars).where(eq(calendars.id, calendarId)).run();
    return ok(result.changes > 0);
  } catch (error) {
    return err(error instanceof Error ? error : new Error("Failed to remove calendar"));
  }
}

/**
 * Get all calendar integrations
 */
export async function listCalendarIntegrations(): Promise<
  Array<CalendarIntegration & { config: CalendarIntegrationConfig }>
> {
  const integrations = await db.select().from(calendarIntegrations);

  return integrations.map((integration) => {
    const dec = decrypt(integration.encryptedConfig);
    const cfg = dec.success ? JSON.parse(dec.data) : {};
    return {
      ...integration,
      config: cfg as CalendarIntegrationConfig,
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

  const dec = decrypt(integration.encryptedConfig);
  return {
    ...integration,
    config: dec.success
      ? (JSON.parse(dec.data) as CalendarIntegrationConfig)
      : ({} as CalendarIntegrationConfig),
  };
}

/**
 * Update a calendar integration
 */
export async function updateCalendarIntegration(
  id: string,
  input: UpdateCalendarIntegrationInput,
): Promise<Result<CalendarIntegration | null, Error>> {
  const existing = await getCalendarIntegration(id);
  if (!existing) {
    return ok(null);
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

    const enc = encrypt(JSON.stringify(mergedConfig));
    if (!enc.success) {
      return err<Error>(enc.error) as Result<CalendarIntegration | null, Error>;
    }
    updates.encryptedConfig = enc.data;
  }
  try {
    const result = db
      .update(calendarIntegrations)
      .set(updates)
      .where(eq(calendarIntegrations.id, id))
      .returning()
      .get();
    return ok(result ?? null);
  } catch (error) {
    return err(error instanceof Error ? error : new Error("Failed to update"));
  }
}

/**
 * Delete a calendar integration
 */
export async function deleteCalendarIntegration(id: string): Promise<Result<boolean, Error>> {
  try {
    const result = db
      .delete(calendarIntegrations)
      .where(eq(calendarIntegrations.id, id))
      .run();
    return ok(result.changes > 0);
  } catch (error) {
    return err(error instanceof Error ? error : new Error("Failed to delete"));
  }
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
  provider: ProviderType,
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
