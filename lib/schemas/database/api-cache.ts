import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// API response cache
export const apiCache = sqliteTable("api_cache", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export type ApiCacheEntry = typeof apiCache.$inferSelect;
