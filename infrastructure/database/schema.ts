import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Calendar integrations table
export const calendarIntegrations = sqliteTable("calendar_integrations", {
  id: text("id").primaryKey(), // UUID
  provider: text("provider").notNull(), // 'caldav', 'google', 'outlook'
  displayName: text("display_name").notNull(),
  encryptedConfig: text("encrypted_config").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Individual calendars table
export const calendars = sqliteTable("calendars", {
  id: text("id").primaryKey(), // UUID
  integrationId: text("integration_id")
    .notNull()
    .references(() => calendarIntegrations.id, { onDelete: "cascade" }),
  calendarUrl: text("calendar_url").notNull(),
  displayName: text("display_name").notNull(),
  capability: text("capability").notNull(), // 'booking' | 'blocking_available' | 'blocking_busy'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// User preferences
export const preferences = sqliteTable("preferences", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON string
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// API response cache
export const apiCache = sqliteTable("api_cache", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

// Type exports
export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type NewCalendarIntegration = typeof calendarIntegrations.$inferInsert;
export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;
export type Preference = typeof preferences.$inferSelect;
export type ApiCacheEntry = typeof apiCache.$inferSelect;
