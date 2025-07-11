#!/usr/bin/env tsx

/**
 * Script to generate environment variables for the scheduler application
 * Run with: tsx scripts/generate-env.ts
 */
<<<<<<< HEAD
<<<<<<< HEAD
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
=======

import { randomBytes } from 'crypto';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
=======
import { randomBytes } from "crypto";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
>>>>>>> 0ed66dc (Refactor generate-env script for consistency and readability)

function generateEncryptionKey(): string {
  return randomBytes(32).toString("hex").toUpperCase();
}

function generateWebhookSecret(): string {
  return randomBytes(32).toString("base64");
}

<<<<<<< HEAD
function generateEnvFile(): void {
>>>>>>> dfc03e0 (Add GitHub environment setup, CI workflow, and documentation)
=======
function generateEnvFile(forceOverwrite = false): void {
>>>>>>> 0ed66dc (Refactor generate-env script for consistency and readability)
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

<<<<<<< HEAD
<<<<<<< HEAD
  const envPath = join(process.cwd(), ".env.example");

  if (existsSync(envPath) && !forceOverwrite) {
    console.log("⚠️  .env.example already exists");
    console.log("Generated values:");
=======
  const envPath = join(process.cwd(), '.env.example');
  
  if (existsSync(envPath) && !forceOverwrite) {
    console.log('⚠️  .env.example already exists');
    console.log('Generated values:');
>>>>>>> dfc03e0 (Add GitHub environment setup, CI workflow, and documentation)
=======
  const envPath = join(process.cwd(), ".env.example");

  if (existsSync(envPath) && !forceOverwrite) {
    console.log("⚠️  .env.example already exists");
    console.log("Generated values:");
>>>>>>> 0ed66dc (Refactor generate-env script for consistency and readability)
    console.log(`ENCRYPTION_KEY=${generateEncryptionKey()}`);
    console.log(`WEBHOOK_SECRET=${generateWebhookSecret()}`);
  } else {
    writeFileSync(envPath, envContent);
<<<<<<< HEAD
<<<<<<< HEAD
    console.log("✅ Generated .env.example with secure values");
    console.log("📝 Copy .env.example to .env.local and customize as needed");
=======
    console.log('✅ Generated .env.example with secure values');
    console.log('📝 Copy .env.example to .env.local and customize as needed');
>>>>>>> dfc03e0 (Add GitHub environment setup, CI workflow, and documentation)
=======
    console.log("✅ Generated .env.example with secure values");
    console.log("📝 Copy .env.example to .env.local and customize as needed");
>>>>>>> 0ed66dc (Refactor generate-env script for consistency and readability)
  }
}

// Display individual values for manual setup
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 0ed66dc (Refactor generate-env script for consistency and readability)
console.log("🔐 Environment Variable Generator");
console.log("================================");
console.log("");
console.log("For GitHub Repository Secrets:");
console.log("");
<<<<<<< HEAD
console.log(`ENCRYPTION_KEY: ${generateEncryptionKey()}`);
console.log(`WEBHOOK_SECRET: ${generateWebhookSecret()}`);
console.log("");
console.log("For local development:");
generateEnvFile();
=======
console.log('🔐 Environment Variable Generator');
console.log('================================');
console.log('');
console.log('For GitHub Repository Secrets:');
console.log('');
console.log(`ENCRYPTION_KEY: ${generateEncryptionKey()}`);
console.log(`WEBHOOK_SECRET: ${generateWebhookSecret()}`);
console.log('');
console.log('For local development:');
generateEnvFile();
>>>>>>> dfc03e0 (Add GitHub environment setup, CI workflow, and documentation)
=======
console.log(`ENCRYPTION_KEY: ${generateEncryptionKey()}`);
console.log(`WEBHOOK_SECRET: ${generateWebhookSecret()}`);
console.log("");
console.log("For local development:");
generateEnvFile();
>>>>>>> 0ed66dc (Refactor generate-env script for consistency and readability)
