import { sql } from "drizzle-orm";
import { type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

export function createTables<T extends Record<string, unknown>>(
  db: BetterSQLite3Database<T>,
) {
  // Create all tables
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(sql`
    CREATE TABLE IF NOT EXISTS calendar_integrations (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      display_name TEXT NOT NULL,
      encrypted_config TEXT NOT NULL,
      display_order INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(sql`
    CREATE TABLE IF NOT EXISTS calendars (
      id TEXT PRIMARY KEY,
      integration_id TEXT NOT NULL,
      calendar_url TEXT NOT NULL,
      display_name TEXT NOT NULL,
      capability TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (integration_id) REFERENCES calendar_integrations(id) ON DELETE CASCADE
    )
  `);

  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(sql`
    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(sql`
    CREATE TABLE IF NOT EXISTS api_cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);

  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(sql`
    CREATE TABLE IF NOT EXISTS appointment_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Create indexes
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider ON calendar_integrations(provider)`,
  );
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_calendar_integrations_display_order ON calendar_integrations(display_order)`,
  );
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_calendars_integration_id ON calendars(integration_id)`,
  );
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_calendars_capability ON calendars(capability)`,
  );
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON api_cache(expires_at)`,
  );
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_appointment_types_active ON appointment_types(is_active)`,
  );
}

export function dropTables<T extends Record<string, unknown>>(
  db: BetterSQLite3Database<T>,
) {
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(sql`DROP TABLE IF EXISTS api_cache`);
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(sql`DROP TABLE IF EXISTS preferences`);
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(sql`DROP TABLE IF EXISTS calendars`);
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(sql`DROP TABLE IF EXISTS calendar_integrations`);
  // eslint-disable-next-line custom/performance-patterns -- Migration scripts should run synchronously
  db.run(sql`DROP TABLE IF EXISTS appointment_types`);
}
