import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { calendarIntegrations } from "./calendar-integrations";

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

export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;