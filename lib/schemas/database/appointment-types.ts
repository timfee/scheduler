import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appointmentTypes = sqliteTable("appointment_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type AppointmentType = typeof appointmentTypes.$inferSelect;
export type NewAppointmentType = typeof appointmentTypes.$inferInsert;