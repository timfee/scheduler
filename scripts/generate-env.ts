#!/usr/bin/env tsx

/**
 * Script to generate environment variables for the scheduler application
 * Run with: tsx scripts/generate-env.ts
 */
import { randomBytes } from "crypto";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";

function generateEncryptionKey(): string {
  return randomBytes(32).toString("hex").toUpperCase();
}

function generateWebhookSecret(): string {
  return randomBytes(32).toString("base64");
}

function generateEnvFile(forceOverwrite = false): void {
  const envContent = `# Generated environment variables for scheduler
# Copy to .env.local for local development

# Required: 64-character hex string for encryption
ENCRYPTION_KEY=${generateEncryptionKey()}

# Required: Secret for webhook verification (32+ characters)
WEBHOOK_SECRET=${generateWebhookSecret()}

# Optional: SQLite database path (default: scheduler.db)
SQLITE_PATH=scheduler.db

# Optional: Application environment
NODE_ENV=development

# Optional: Google OAuth credentials (for calendar integration)
# GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
# GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
`;

  const envPath = join(process.cwd(), ".env.example");

  if (existsSync(envPath) && !forceOverwrite) {
    console.log("⚠️  .env.example already exists");
    console.log("Generated values:");
    console.log(`ENCRYPTION_KEY=${generateEncryptionKey()}`);
    console.log(`WEBHOOK_SECRET=${generateWebhookSecret()}`);
  } else {
    writeFileSync(envPath, envContent);
    console.log("✅ Generated .env.example with secure values");
    console.log("📝 Copy .env.example to .env.local and customize as needed");
  }
}

// Display individual values for manual setup

console.log("🔐 Environment Variable Generator");
console.log("================================");
console.log("");
console.log("For GitHub Repository Secrets:");
console.log("");
console.log(`ENCRYPTION_KEY: ${generateEncryptionKey()}`);
console.log(`WEBHOOK_SECRET: ${generateWebhookSecret()}`);
console.log("");
console.log("For local development:");
generateEnvFile();
