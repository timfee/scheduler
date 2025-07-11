import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createTables } from "../infrastructure/database/migrations";
import * as schema from "@/lib/schemas/database";

function initDb() {
  // Initialize database

  // Create database connection
  const sqlite = new Database("scheduler.db");
  const db = drizzle(sqlite);

  try {
    createTables(db);

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
