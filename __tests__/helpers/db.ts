import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createTables, dropTables } from "@/lib/db/migrations";
import * as schema from "@/lib/db/schema";

export function createTestDb() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  createTables(db);
  return { db, sqlite };
}

export function cleanupTestDb(sqlite: Database) {
  const db = drizzle(sqlite);
  dropTables(db);
  sqlite.close();
}

// Helper to create test data
export async function createTestIntegration(
  db: ReturnType<typeof drizzle>,
  data: Partial<schema.NewCalendarIntegration> = {}
) {
  const integration: schema.NewCalendarIntegration = {
    id: data.id || "test-id",
    provider: data.provider || "caldav",
    displayName: data.displayName || "Test Calendar",
    encryptedConfig: data.encryptedConfig || "encrypted",
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };

  return db.insert(schema.calendarIntegrations).values(integration).returning().get();
}
