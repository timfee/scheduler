import { type CalendarIntegrationConfig, type BasicAuthConfig, type OAuthConfig } from "./integrations";
import { type ConnectionConfigValues } from "@/lib/schemas/connection";

/**
 * Extract common fields shared by both auth methods.
 */
function buildBaseConfigFields(values: ConnectionConfigValues) {
  return {
    username: values.username,
    serverUrl: values.serverUrl ?? "",
    calendarUrl: values.calendarUrl,
    capabilities: values.capabilities,
  };
}

/**
 * Merge common fields and track credential changes.
 */
function mergeBaseConfigFields(
  existing: CalendarIntegrationConfig,
  updates: Partial<ConnectionConfigValues>,
  result: CalendarIntegrationConfig,
  credentialsChanged: boolean
) {
  if (updates.username !== undefined) {
    credentialsChanged ||= updates.username !== existing.username;
    result.username = updates.username;
  }
  if (updates.serverUrl !== undefined) {
    credentialsChanged ||= updates.serverUrl !== existing.serverUrl;
    result.serverUrl = updates.serverUrl;
  }
  if (updates.calendarUrl !== undefined) {
    result.calendarUrl = updates.calendarUrl;
  }
  if (updates.capabilities !== undefined) {
    credentialsChanged ||= updates.capabilities !== existing.capabilities;
    result.capabilities = updates.capabilities;
  }
  return credentialsChanged;
}

/**
 * Build a CalendarIntegrationConfig from validated form values.
 */
export function buildConfigFromValues(values: ConnectionConfigValues): CalendarIntegrationConfig {
  const baseFields = buildBaseConfigFields(values);
  
  if (values.authMethod === "Basic") {
    if (!values.password) {
      throw new Error("Password is required for Basic authentication");
    }
    const cfg: BasicAuthConfig = {
      authMethod: "Basic",
      password: values.password,
      ...baseFields,
    };
    return cfg;
  }

  if (!values.refreshToken || !values.clientId || !values.clientSecret || !values.tokenUrl) {
    throw new Error("All OAuth fields are required for OAuth authentication");
  }

  const cfg: OAuthConfig = {
    authMethod: "Oauth",
    refreshToken: values.refreshToken,
    clientId: values.clientId,
    clientSecret: values.clientSecret,
    tokenUrl: values.tokenUrl,
    ...baseFields,
  };
  return cfg;
}

/**
 * Merge an existing CalendarIntegrationConfig with partial form updates.
 * Returns the merged config along with a flag indicating if credential
 * fields changed and the connection should be re-tested.
 */
export function mergeConfig(
  existing: CalendarIntegrationConfig,
  updates: Partial<ConnectionConfigValues>,
): { config: CalendarIntegrationConfig; credentialsChanged: boolean } {
  let credentialsChanged = false;

  if (existing.authMethod === "Basic") {
    const result: BasicAuthConfig = { ...existing };
    if (updates.password !== undefined) {
      credentialsChanged ||= updates.password !== existing.password;
      result.password = updates.password;
    }
    credentialsChanged = mergeBaseConfigFields(existing, updates, result, credentialsChanged);
    return { config: result, credentialsChanged };
  }

  const result: OAuthConfig = { ...existing };
  if (updates.refreshToken !== undefined) {
    credentialsChanged ||= updates.refreshToken !== existing.refreshToken;
    result.refreshToken = updates.refreshToken;
  }
  if (updates.clientId !== undefined) {
    credentialsChanged ||= updates.clientId !== existing.clientId;
    result.clientId = updates.clientId;
  }
  if (updates.clientSecret !== undefined) {
    credentialsChanged ||= updates.clientSecret !== existing.clientSecret;
    result.clientSecret = updates.clientSecret;
  }
  if (updates.tokenUrl !== undefined) {
    result.tokenUrl = updates.tokenUrl;
  }
  credentialsChanged = mergeBaseConfigFields(existing, updates, result, credentialsChanged);

  return { config: result, credentialsChanged };
}
