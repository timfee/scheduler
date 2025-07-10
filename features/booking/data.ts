import { db } from "@/infrastructure/database";
import { appointmentTypes } from "@/infrastructure/database/schema";
import { eq } from "drizzle-orm";

export type AppointmentType = typeof appointmentTypes.$inferSelect;

/**
 * Fetch all active appointment types from the database.
 */
export async function listAppointmentTypes(): Promise<AppointmentType[]> {
  return db
    .select()
    .from(appointmentTypes)
    .where(eq(appointmentTypes.isActive, true));
}

/**
 * Look up a specific appointment type by id.
 */
export async function getAppointmentType(
  id: string,
): Promise<AppointmentType | null> {
  const result = await db
    .select()
    .from(appointmentTypes)
    .where(eq(appointmentTypes.id, id));
  return result[0] ?? null;
}
