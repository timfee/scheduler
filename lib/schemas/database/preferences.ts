import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// User preferences
export const preferences = sqliteTable("preferences", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON string
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Preference = typeof preferences.$inferSelect;