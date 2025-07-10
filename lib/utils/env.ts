import { z } from "zod/v4";

const envSchema = z.object({
  // Required environment variables
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9A-Fa-f]{64}$/, "Must be a 64-character hex string"),
  SQLITE_PATH: z.string().min(1).default("scheduler.db"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Optional OAuth variables
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

export function validateEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.format());
    throw new Error("Invalid environment configuration");
  }

  cachedEnv = result.data;
  return cachedEnv;
}

// Helper to get validated env
export function getEnv(): Env {
  return cachedEnv ?? validateEnv();
}
