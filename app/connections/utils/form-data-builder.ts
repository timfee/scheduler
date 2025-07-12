import { type ConnectionFormValues } from "@/lib/schemas/connection";
import { type ConnectionFormData } from "@/app/connections/server/actions";

/**
 * Default Google OAuth token URL
 */
export const DEFAULT_GOOGLE_TOKEN_URL = "https://accounts.google.com/o/oauth2/token";

/**
 * Builds ConnectionFormData from form values based on authentication method
 * Extracts the duplicated form building logic from ConnectionsClient
 */
export function buildConnectionFormData(
  values: ConnectionFormValues,
  isTestMode = false
): ConnectionFormData {
  const baseData = {
    provider: values.provider,
    displayName: values.displayName,
    authMethod: values.authMethod,
    username: values.username,
    serverUrl: values.serverUrl,
    calendarUrl: values.calendarUrl,
    capabilities: values.capabilities,
  } as const;

  if (values.authMethod === "Basic") {
    return {
      ...baseData,
      authMethod: "Basic",
      password: values.password ?? "",
    };
  } else {
    return {
      ...baseData,
      authMethod: "Oauth",
      refreshToken: values.refreshToken ?? "",
      clientId: values.clientId ?? "",
      clientSecret: values.clientSecret ?? "",
      tokenUrl: values.tokenUrl?.trim() ? values.tokenUrl : (isTestMode ? DEFAULT_GOOGLE_TOKEN_URL : ""),
    };
  }
}