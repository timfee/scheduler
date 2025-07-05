import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "../lib/db/schema";

function initDb() {
  console.log("Initializing database...");

  // Create database connection
  const sqlite = new Database("scheduler.db");
  const db = drizzle(sqlite, { schema });

  try {
    // Create tables using raw SQL (since we're not using Drizzle migrations)
    db.run(sql`
      CREATE TABLE IF NOT EXISTS calendar_integrations (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        display_name TEXT NOT NULL,
        encrypted_config TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.run(sql`
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.run(sql`
      CREATE TABLE IF NOT EXISTS api_cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `);

    // Create indexes for better performance
    db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider
      ON calendar_integrations(provider)
    `);

    db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_calendar_integrations_is_primary
      ON calendar_integrations(is_primary)
    `);

    db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at
      ON api_cache(expires_at)
    `);

    console.log("Database initialized successfully!");

    // Insert default preferences if they don't exist
    const existingPrefs = db
      .select()
      .from(schema.preferences)
      .where(sql`key = 'timezone'`)
      .all();

    if (existingPrefs.length === 0) {
      db.insert(schema.preferences)
        .values({
          key: "timezone",
          value: JSON.stringify({ timezone: "UTC" }),
          updatedAt: new Date(),
        })
        .run();
      console.log("Default preferences added.");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

// Run the initialization
initDb();
