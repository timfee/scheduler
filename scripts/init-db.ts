import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createTables } from "@/lib/database/migrations";
import * as schema from "@/lib/schemas/database";
import { v4 as uuid } from "uuid";

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
          key: "timeZone",
          value: JSON.stringify({ timeZone: "UTC" }),
          updatedAt: new Date(),
        })
        .run();
    }

    // Insert default appointment types if they don't exist
    const existingAppointmentTypes = db
      .select()
      .from(schema.appointmentTypes)
      .all();

    if (existingAppointmentTypes.length === 0) {
      const now = new Date();
      
      await db.insert(schema.appointmentTypes)
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
