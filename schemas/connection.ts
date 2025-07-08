import { z } from "zod/v4";
import { CALENDAR_CAPABILITY } from "@/types/constants";

// Base schema for all connections
const baseConnectionSchema = z.object({
  provider: z.enum(["apple", "google", "fastmail", "nextcloud", "caldav"]),
  displayName: z.string().min(1, "Display name is required"),
});

// Basic auth schema
const basicAuthSchema = baseConnectionSchema.extend({
  authMethod: z.literal("Basic"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  serverUrl: z.string().optional(),
});

// OAuth schema
const oauthSchema = baseConnectionSchema.extend({
  authMethod: z.literal("Oauth"),
  username: z.string().email("Must be a valid email"),
  refreshToken: z.string().min(1, "Refresh token is required"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client secret is required"),
  tokenUrl: z.string().url("Must be a valid URL"),
  serverUrl: z.string().optional(),
});

// Discriminated union for type safety
export const connectionFormSchema = z
  .discriminatedUnion("authMethod", [basicAuthSchema, oauthSchema])
  .superRefine((data, ctx) => {
    // Server URL validation for specific providers
    if (["nextcloud", "caldav"].includes(data.provider) && !data.serverUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Server URL is required for this provider",
        path: ["serverUrl"],
      });
    }
  });

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

// Schema for calendar selection (new)
export const calendarSelectionSchema = z.object({
  calendarUrl: z.string().url(),
  displayName: z.string().min(1),
  capability: z.enum([
    CALENDAR_CAPABILITY.BOOKING,
    CALENDAR_CAPABILITY.BLOCKING_AVAILABLE,
    CALENDAR_CAPABILITY.BLOCKING_BUSY,
  ]),
});

export type CalendarSelection = z.infer<typeof calendarSelectionSchema>;
