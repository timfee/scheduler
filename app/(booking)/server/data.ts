import { db } from "@/lib/database";
import { appointmentTypes } from "@/lib/schemas/database";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export type AppointmentType = typeof appointmentTypes.$inferSelect;

/**
 * Fetch all active appointment types from the database.
 */
export const listAppointmentTypes = unstable_cache(
  async (): Promise<AppointmentType[]> => {
    // eslint-disable-next-line custom/performance-patterns -- Appointment types are typically a small, fixed set
    return db
      .select()
      .from(appointmentTypes)
      .where(eq(appointmentTypes.isActive, true));
  },
  ["appointment-types"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["appointment-types"],
  },
);

/**
 * Look up a specific appointment type by id.
 */
const cachedGetAppointmentType = async (
  id: string,
): Promise<AppointmentType | null> => {
  // eslint-disable-next-line custom/performance-patterns -- Looking up a single appointment type by ID
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
      tags: ["appointment-types"],
    },
  )();
};
