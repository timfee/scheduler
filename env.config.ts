import { defineEnv } from "envin";
import { z } from "zod";

export default defineEnv({
  server: {
    ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9A-Fa-f]{64}$/, "Must be a 64-character hex string")
      .describe(
        "Encryption key for sensitive data. Must be a 64-character hex string.",
      ),
    SQLITE_PATH: z
      .string()
      .min(1)
      .default("scheduler.db")
      .describe("Filesystem path to the SQLite database"),
    WEBHOOK_SECRET: z
      .string()
      .min(32, "Must be at least 32 characters")
      .describe("Secret key for webhook signature verification"),
    // Optional OAuth variables
    GOOGLE_OAUTH_CLIENT_ID: z
      .string()
      .optional()
      .describe("Google OAuth client ID for calendar integration"),
    GOOGLE_OAUTH_CLIENT_SECRET: z
      .string()
      .optional()
      .describe("Google OAuth client secret for calendar integration"),
  },
  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },

  clientPrefix: "NEXT_PUBLIC_",
  /*
   * In some cases, we need to manually destructure environment variables
   * to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables are included here.
   */
  envStrict: {
    NODE_ENV: process.env.NODE_ENV,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    SQLITE_PATH: process.env.SQLITE_PATH,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  },
});
