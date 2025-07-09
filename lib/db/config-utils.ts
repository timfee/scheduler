import { type CalendarIntegrationConfig, type BasicAuthConfig, type OAuthConfig } from "./integrations";
import { type ConnectionConfigValues } from "@/schemas/connection";

/**
 * Build a CalendarIntegrationConfig from validated form values.
 */
export function buildConfigFromValues(values: ConnectionConfigValues): CalendarIntegrationConfig {
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
  updates: Partial<ConnectionConfigValues>,
): { config: CalendarIntegrationConfig; credentialsChanged: boolean } {
  let credentialsChanged = false;
  const result: CalendarIntegrationConfig = { ...existing } as CalendarIntegrationConfig;
  const u: Partial<ConnectionConfigValues> = updates;

  if (existing.authMethod === "Basic") {
    if (u.username !== undefined) {
      credentialsChanged ||= u.username !== existing.username;
      result.username = u.username;
    }
    if (u.password !== undefined) {
      credentialsChanged ||= u.password !== existing.password;
      (result as BasicAuthConfig).password = u.password;
    }
    if (u.serverUrl !== undefined) {
      credentialsChanged ||= u.serverUrl !== existing.serverUrl;
      result.serverUrl = u.serverUrl;
    }
    if (u.calendarUrl !== undefined) {
      result.calendarUrl = u.calendarUrl;
    }
  } else {
    if (u.username !== undefined) {
      credentialsChanged ||= u.username !== existing.username;
      result.username = u.username;
    }
    if (u.refreshToken !== undefined) {
      credentialsChanged ||= u.refreshToken !== existing.refreshToken;
      (result as OAuthConfig).refreshToken = u.refreshToken;
    }
    if (u.clientId !== undefined) {
      credentialsChanged ||= u.clientId !== existing.clientId;
      (result as OAuthConfig).clientId = u.clientId;
    }
    if (u.clientSecret !== undefined) {
      credentialsChanged ||= u.clientSecret !== existing.clientSecret;
      (result as OAuthConfig).clientSecret = u.clientSecret;
    }
    if (u.tokenUrl !== undefined) {
      (result as OAuthConfig).tokenUrl = u.tokenUrl;
    }
    if (u.serverUrl !== undefined) {
      credentialsChanged ||= u.serverUrl !== existing.serverUrl;
      result.serverUrl = u.serverUrl;
    }
    if (u.calendarUrl !== undefined) {
      credentialsChanged ||= u.calendarUrl !== existing.calendarUrl;
      result.calendarUrl = u.calendarUrl;
    }
  }

  if (u.capabilities !== undefined) {
    credentialsChanged ||= u.capabilities !== existing.capabilities;
    result.capabilities = u.capabilities;
  }

  return { config: result, credentialsChanged };
}
