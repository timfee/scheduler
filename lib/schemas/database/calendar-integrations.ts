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

export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type NewCalendarIntegration = typeof calendarIntegrations.$inferInsert;
