import * as z from "zod";
import { CALENDAR_CAPABILITY } from "@/types/constants";

/**
 * Schema for connection form values used on both client and server.
 * Includes optional `calendarUrl` and a list of `capabilities`.
 */
const baseSchema = z.object({
  provider: z.enum(["apple", "google", "fastmail", "nextcloud", "caldav"]),
  displayName: z.string().min(1, "Display name is required"),
  authMethod: z.enum(["Basic", "Oauth"]),
  username: z.string().min(1, "Username is required"),
  password: z.string().optional(),
  serverUrl: z.string().optional(),
  calendarUrl: z.string().optional(),
  refreshToken: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  tokenUrl: z.string().optional(),
  capabilities: z
    .array(
      z.enum([
        CALENDAR_CAPABILITY.BLOCKING_BUSY,
        CALENDAR_CAPABILITY.BLOCKING_AVAILABLE,
        CALENDAR_CAPABILITY.BOOKING,
      ]),
    )
    .min(1, "Select at least one capability"),
});

function withValidations<S extends z.ZodRawShape>(schema: z.ZodObject<S>) {
  return schema
    .refine(
      (data: any) => {
        if (data.authMethod === "Basic") {
          return !!data.password;
        }
        return true;
      },
      {
        message: "Password is required for Basic authentication",
        path: ["password"],
      },
    )
    .refine(
        (data: any) => {
          const provider = data.provider;
          if (provider && ["nextcloud", "caldav"].includes(provider)) {
            return !!data.serverUrl;
          }
          return true;
        },
      {
        message: "Server URL is required for this provider",
        path: ["serverUrl"],
      },
    )
    .refine(
      (data: any) => {
        if (data.authMethod === "Oauth") {
          return (
            !!data.refreshToken &&
            !!data.clientId &&
            !!data.clientSecret &&
            !!data.tokenUrl
          );
        }
        return true;
      },
      {
        message: "All OAuth fields are required",
        path: ["refreshToken"],
      },
    );
}

export const connectionFormSchema = withValidations(baseSchema);

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

// Schema for just the connection config (no display name or primary flag)
export const connectionConfigSchema = withValidations(
  baseSchema.omit({
    displayName: true,
  }),
);

export type ConnectionConfigValues = z.infer<typeof connectionConfigSchema>;
