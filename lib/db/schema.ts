import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Calendar integrations table
export const calendarIntegrations = sqliteTable("calendar_integrations", {
  id: text("id").primaryKey(), // UUID
  provider: text("provider").notNull(), // 'caldav', 'google', 'outlook'
  displayName: text("display_name").notNull(),
  encryptedConfig: text("encrypted_config").notNull(),
  isPrimary: integer("is_primary", { mode: "boolean" })
    .default(false)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
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
export type Preference = typeof preferences.$inferSelect;
export type ApiCacheEntry = typeof apiCache.$inferSelect;
