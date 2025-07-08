import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createTables } from "../lib/db/migrations";
import * as schema from "../lib/db/schema";

function initDb() {
  console.log("Initializing database...");

  // Create database connection
  const sqlite = new Database("scheduler.db");
  const db = drizzle(sqlite, { schema });

  try {
    createTables(db);
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
