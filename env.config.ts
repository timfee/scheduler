import { defineEnv } from "envin";
import { z } from "zod";

export default defineEnv({
  server: {
    ENCRYPTION_KEY: z
      .string()
      .regex(/[0-9A-Fa-f]+/g, "Must be a hex string")
      .length(64, "Must be a 64-character hex string")
      .describe(
        "Encryption key for sensitive data. Must be a 64-character hex string.",
      ),
    SQLITE_PATH: z
      .string()
      .default("scheduler.db")
      .describe("Filesystem path to the SQLite database"),
  },
  shared: {
    NODE_ENV: z.enum(["development", "production"]).default("development"),
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
  },
});
