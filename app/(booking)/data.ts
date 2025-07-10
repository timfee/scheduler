import { unstable_cache } from 'next/cache'
import { db } from "@/infrastructure/database";
import { appointmentTypes } from "@/infrastructure/database/schema";
import { eq } from "drizzle-orm";

export type AppointmentType = typeof appointmentTypes.$inferSelect;

/**
 * Fetch all active appointment types from the database.
 */
export const listAppointmentTypes = unstable_cache(
  async (): Promise<AppointmentType[]> => {
    return db
      .select()
      .from(appointmentTypes)
      .where(eq(appointmentTypes.isActive, true));
  },
  ['appointment-types'],
  { 
    revalidate: 3600, // Cache for 1 hour
    tags: ['appointment-types']
  }
);

/**
 * Look up a specific appointment type by id.
 */
const cachedGetAppointmentType = async (id: string): Promise<AppointmentType | null> => {
  const result = await db
    .select()
    .from(appointmentTypes)
    .where(eq(appointmentTypes.id, id));
  return result[0] ?? null;
};

export const getAppointmentType = (id: string) => {
  return unstable_cache(
    () => cachedGetAppointmentType(id),
    [`appointment-type-${id}`],
    { 
      revalidate: 3600, // Cache for 1 hour
      tags: ['appointment-types']
    }
  )();
};
