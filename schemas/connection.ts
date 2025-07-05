import * as z from "zod";
import { CAPABILITY, type CalendarCapability } from "@/types/constants";

/**
 * Schema for connection form values used on both client and server.
 * - isPrimary is optional since server actions may omit it
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
          CAPABILITY.CONFLICT,
          CAPABILITY.AVAILABILITY,
          CAPABILITY.BOOKING,
        ]),
      )
      .min(1, "Select at least one capability"),
    isPrimary: z.boolean().optional().default(false),
  });

function withValidations<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .refine(
      (data) => {
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
      (data) => {
        if (["nextcloud", "caldav"].includes(data.provider)) {
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
      (data) => {
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
    isPrimary: true,
  }),
);

export type ConnectionConfigValues = z.infer<typeof connectionConfigSchema>;

