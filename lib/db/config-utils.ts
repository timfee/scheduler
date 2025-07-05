import { type CalendarIntegrationConfig, type BasicAuthConfig, type OAuthConfig } from "./integrations";
import { type ConnectionFormValues } from "@/schemas/connection";

/**
 * Build a CalendarIntegrationConfig from validated form values.
 */
export function buildConfigFromValues(values: ConnectionFormValues): CalendarIntegrationConfig {
  if (values.authMethod === "Basic") {
    const cfg: BasicAuthConfig = {
      authMethod: "Basic",
      username: values.username,
      password: values.password!,
      serverUrl: values.serverUrl ?? "",
      calendarUrl: values.calendarUrl,
      capabilities: values.capabilities,
    };
    return cfg;
  }

  const cfg: OAuthConfig = {
    authMethod: "Oauth",
    username: values.username,
    refreshToken: values.refreshToken!,
    clientId: values.clientId!,
    clientSecret: values.clientSecret!,
    tokenUrl: values.tokenUrl!,
    serverUrl: values.serverUrl ?? "",
    calendarUrl: values.calendarUrl,
    capabilities: values.capabilities,
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
  updates: Partial<ConnectionFormValues>,
): { config: CalendarIntegrationConfig; credentialsChanged: boolean } {
  let credentialsChanged = false;
  const result: CalendarIntegrationConfig = { ...existing } as CalendarIntegrationConfig;

  if (existing.authMethod === "Basic") {
    if (updates.username !== undefined) {
      credentialsChanged ||= updates.username !== existing.username;
      result.username = updates.username;
    }
    if (updates.password !== undefined) {
      credentialsChanged ||= updates.password !== existing.password;
      (result as BasicAuthConfig).password = updates.password;
    }
    if (updates.serverUrl !== undefined) {
      credentialsChanged ||= updates.serverUrl !== existing.serverUrl;
      result.serverUrl = updates.serverUrl;
    }
    if (updates.calendarUrl !== undefined) {
      result.calendarUrl = updates.calendarUrl;
    }
  } else {
    if (updates.username !== undefined) {
      credentialsChanged ||= updates.username !== existing.username;
      result.username = updates.username;
    }
    if (updates.refreshToken !== undefined) {
      credentialsChanged ||= updates.refreshToken !== existing.refreshToken;
      (result as OAuthConfig).refreshToken = updates.refreshToken;
    }
    if (updates.clientId !== undefined) {
      credentialsChanged ||= updates.clientId !== existing.clientId;
      (result as OAuthConfig).clientId = updates.clientId;
    }
    if (updates.clientSecret !== undefined) {
      credentialsChanged ||= updates.clientSecret !== existing.clientSecret;
      (result as OAuthConfig).clientSecret = updates.clientSecret;
    }
    if (updates.tokenUrl !== undefined) {
      (result as OAuthConfig).tokenUrl = updates.tokenUrl;
    }
    if (updates.serverUrl !== undefined) {
      credentialsChanged ||= updates.serverUrl !== existing.serverUrl;
      result.serverUrl = updates.serverUrl;
    }
    if (updates.calendarUrl !== undefined) {
      result.calendarUrl = updates.calendarUrl;
    }
  }

  if (updates.capabilities !== undefined) {
    result.capabilities = updates.capabilities;
  }

  return { config: result, credentialsChanged };
}
