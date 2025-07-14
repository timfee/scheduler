#!/usr/bin/env tsx

/**
 * Script to validate environment and database setup
 * Run with: tsx scripts/validate-setup.ts
 */

import { randomBytes } from "crypto";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import Database from "better-sqlite3";
import prompts from "prompts";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createTables } from "@/lib/database/migrations";
import * as schema from "@/lib/schemas/database";
import { v4 as uuid } from "uuid";

// Load environment variables from .env.local if it exists
function loadEnvFile(): void {
  const envPath = join(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=");
          process.env[key] = value;
        }
      }
    }
  }
}

// Load env file at startup
loadEnvFile();

// Required environment variables
const REQUIRED_ENV_VARS = {
  ENCRYPTION_KEY: {
    description: "64-character hex string for encryption",
    generator: () => randomBytes(32).toString("hex").toUpperCase(),
    validator: (value: string) => /^[0-9A-Fa-f]{64}$/.test(value),
    errorMessage: "Must be a 64-character hex string",
  },
  WEBHOOK_SECRET: {
    description: "Secret for webhook verification (32+ characters)",
    generator: () => randomBytes(32).toString("base64"),
    validator: (value: string) => value.length >= 32,
    errorMessage: "Must be at least 32 characters long",
  },
};

// Optional environment variables with defaults
const OPTIONAL_ENV_VARS = {
  SQLITE_PATH: {
    description: "SQLite database path",
    default: "scheduler.db",
  },
  NODE_ENV: {
    description: "Application environment",
    default: "development",
  },
};

interface EnvValidationResult {
  missing: string[];
  invalid: string[];
  valid: boolean;
}

function validateEnvironmentVariables(): EnvValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];

  // Check required variables
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else if (!config.validator(value)) {
      invalid.push(key);
    }
  }

  return {
    missing,
    invalid,
    valid: missing.length === 0 && invalid.length === 0,
  };
}

function checkDatabaseHealth(): { exists: boolean; hasRequiredTables: boolean; error?: string } {
  const dbPath = process.env.SQLITE_PATH ?? "scheduler.db";
  
  if (!existsSync(dbPath)) {
    return { exists: false, hasRequiredTables: false };
  }

  try {
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);

    // Check if required tables exist
    const requiredTables = [
      "appointment_types",
      "calendar_integrations", 
      "calendars",
      "preferences",
      "api_cache"
    ];

    for (const table of requiredTables) {
      const result = db.all(sql`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=${table}
      `);
      
      if (result.length === 0) {
        sqlite.close();
        return { exists: true, hasRequiredTables: false };
      }
    }

    sqlite.close();
    return { exists: true, hasRequiredTables: true };
  } catch (error) {
    return { 
      exists: true, 
      hasRequiredTables: false, 
      error: error instanceof Error ? error.message : "Unknown database error"
    };
  }
}

function generateEnvFile(variables: Record<string, string>): void {
  const envPath = join(process.cwd(), ".env.local");
  const generatedDate = new Date().toISOString();
  
  let envContent = `# Generated environment variables for scheduler
# Generated on ${generatedDate}

`;

  // Add required variables
  for (const [key, value] of Object.entries(variables)) {
    const config = REQUIRED_ENV_VARS[key as keyof typeof REQUIRED_ENV_VARS];
    if (config) {
      envContent += `# ${config.description}\n`;
      envContent += `${key}=${value}\n\n`;
    }
  }

  // Add optional variables with defaults
  for (const [key, config] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      envContent += `# ${config.description}\n`;
      envContent += `${key}=${config.default}\n\n`;
    }
  }

  // Add optional OAuth variables as comments
  envContent += `# Optional: Google OAuth credentials (for calendar integration)
# GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
# GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
`;

  writeFileSync(envPath, envContent);
}

async function initializeDatabase(): Promise<void> {
  const dbPath = process.env.SQLITE_PATH ?? "scheduler.db";
  
  // Create or recreate database
  if (existsSync(dbPath)) {
    console.log(`⚠️ Database file "${dbPath}" already exists.`);
    
    const response = await prompts({
      type: 'confirm',
      name: 'confirmDelete',
      message: 'Do you want to delete the existing database file? This will result in data loss.',
      initial: false,
    });
    
    if (!response.confirmDelete) {
      console.log("❌ Database deletion aborted.");
      process.exit(0);
    }
    
    const backupResponse = await prompts({
      type: 'confirm',
      name: 'backup',
      message: 'Do you want to back up the existing database file before deletion?',
      initial: true,
    });
    
    if (backupResponse.backup) {
      const backupPath = `${dbPath}.backup-${Date.now()}`;
      writeFileSync(backupPath, readFileSync(dbPath));
      console.log(`✅ Database backed up to "${backupPath}".`);
    }
    
    unlinkSync(dbPath);
    console.log(`✅ Deleted database file "${dbPath}".`);
  }

  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  try {
    createTables(db);
    console.log("✅ Database tables created successfully");
    
    // Add default data as in init-db.ts
    const now = new Date();
    
    // Insert default preferences
    // eslint-disable-next-line custom/performance-patterns
    db.run(sql`
      INSERT INTO preferences (key, value, updated_at)
      VALUES ('timeZone', '{"timeZone":"UTC"}', ${now.getTime()})
    `);
    
    // Insert default appointment types
    db.insert(schema.appointmentTypes)
      .values([
        {
          id: uuid(),
          name: "Quick Chat",
          description: "A brief 15-minute discussion",
          durationMinutes: 15,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuid(),
          name: "Standard Meeting", 
          description: "30-minute meeting for most discussions",
          durationMinutes: 30,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuid(),
          name: "Extended Session",
          description: "1-hour session for detailed discussions", 
          durationMinutes: 60,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .run();
    
    console.log("✅ Created default appointment types");
    
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

async function main(): Promise<void> {
  console.log("🔍 Validating Scheduler Setup");
  console.log("=============================\n");

  // Check environment variables
  const envValidation = validateEnvironmentVariables();
  
  if (!envValidation.valid) {
    console.log("❌ Environment validation failed\n");
    
    if (envValidation.missing.length > 0) {
      console.log("Missing required environment variables:");
      for (const key of envValidation.missing) {
        const config = REQUIRED_ENV_VARS[key as keyof typeof REQUIRED_ENV_VARS];
        console.log(`  - ${key}: ${config.description}`);
      }
      console.log();
    }
    
    if (envValidation.invalid.length > 0) {
      console.log("Invalid environment variables:");
      for (const key of envValidation.invalid) {
        const config = REQUIRED_ENV_VARS[key as keyof typeof REQUIRED_ENV_VARS];
        console.log(`  - ${key}: ${config.errorMessage}`);
      }
      console.log();
    }

    const response = await prompts({
      type: "confirm",
      name: "generate",
      message: "Would you like to auto-generate secure environment variables and save to .env.local?",
      initial: true,
    });

    if (response.generate) {
      const generatedVars: Record<string, string> = {};
      
      // Generate missing required variables
      for (const key of envValidation.missing) {
        const config = REQUIRED_ENV_VARS[key as keyof typeof REQUIRED_ENV_VARS];
        generatedVars[key] = config.generator();
      }
      
      // Generate invalid variables
      for (const key of envValidation.invalid) {
        const config = REQUIRED_ENV_VARS[key as keyof typeof REQUIRED_ENV_VARS];
        generatedVars[key] = config.generator();
      }
      
      generateEnvFile(generatedVars);
      loadEnvFile();
      console.log("🔄 Environment variables reloaded successfully\n");
      console.log("✅ Generated .env.local with secure values");
    } else {
      console.log("❌ Setup cancelled. Please set the required environment variables manually.");
      process.exit(1);
    }
  } else {
    console.log("✅ All required environment variables are present and valid\n");
  }

  // Check database health
  const dbHealth = checkDatabaseHealth();
  
  if (!dbHealth.exists) {
    console.log("❌ Database does not exist");
    
    const response = await prompts({
      type: "confirm",
      name: "create",
      message: "Would you like to create the database with default data?",
      initial: true,
    });

    if (response.create) {
      await initializeDatabase();
      console.log("✅ Database created successfully\n");
    } else {
      console.log("❌ Setup cancelled. Please run 'pnpm db:init' to create the database.");
      process.exit(1);
    }
  } else if (!dbHealth.hasRequiredTables) {
    console.log("❌ Database exists but is missing required tables");
    if (dbHealth.error) {
      console.log(`   Error: ${dbHealth.error}`);
    }
    
    const response = await prompts({
      type: "confirm", 
      name: "recreate",
      message: "Would you like to recreate the database with all required tables?",
      initial: true,
    });

    if (response.recreate) {
      await initializeDatabase();
      console.log("✅ Database recreated successfully\n");
    } else {
      console.log("❌ Setup cancelled. Please run 'pnpm db:init' to recreate the database.");
      process.exit(1);
    }
  } else {
    console.log("✅ Database is healthy and has all required tables\n");
  }

  console.log("🎉 Setup validation complete! The application is ready to start.\n");
}

// Handle graceful exit
process.on("SIGINT", () => {
  console.log("\n👋 Setup cancelled by user");
  process.exit(0);
});

main().catch((error) => {
  console.error("❌ Setup validation failed:", error);
  process.exit(1);
});