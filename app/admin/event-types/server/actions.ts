"use server";

import { db } from "@/lib/database";
import { appointmentTypes, type AppointmentType, type NewAppointmentType } from "@/lib/schemas/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { mapErrorToUserMessage } from "@/lib/errors";
import { v4 as uuid } from "uuid";
import { z } from "zod";

export interface CreateAppointmentTypeData {
  name: string;
  description?: string;
  durationMinutes: number;
}

export interface UpdateAppointmentTypeData {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  isActive: boolean;
}

/**
 * Create a new appointment type
 */
export async function createAppointmentTypeAction(
  data: CreateAppointmentTypeData
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const now = new Date();
    const id = uuid();
    
    const newAppointmentType: NewAppointmentType = {
      id,
      name: data.name,
      description: data.description ?? null,
      durationMinutes: data.durationMinutes,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(appointmentTypes).values(newAppointmentType).run();
    
    // Revalidate cache
    revalidateTag("appointment-types");
    
    return { success: true, id };
  } catch (error) {
    return {
      success: false,
      error: mapErrorToUserMessage(error, "Failed to create appointment type"),
    };
  }
}

/**
 * Update an existing appointment type
 */
export async function updateAppointmentTypeAction(
  data: UpdateAppointmentTypeData
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date();
    
    const result = await db
      .update(appointmentTypes)
      .set({
        name: data.name,
        description: data.description ?? null,
        durationMinutes: data.durationMinutes,
        isActive: data.isActive,
        updatedAt: now,
      })
      .where(eq(appointmentTypes.id, data.id));

    if (result.changes === 0) {
      return { success: false, error: "Appointment type not found" };
    }
    
    // Revalidate cache
    revalidateTag("appointment-types");
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: mapErrorToUserMessage(error, "Failed to update appointment type"),
    };
  }
}

/**
 * Delete an appointment type
 */
export async function deleteAppointmentTypeAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .delete(appointmentTypes)
      .where(eq(appointmentTypes.id, id));

    if (result.changes === 0) {
      return { success: false, error: "Appointment type not found" };
    }
    
    // Revalidate cache
    revalidateTag("appointment-types");
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: mapErrorToUserMessage(error, "Failed to delete appointment type"),
    };
  }
}

/**
 * Toggle the active status of an appointment type
 */
export async function toggleAppointmentTypeAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First get the current state
    const current = await db
      .select()
      .from(appointmentTypes)
      .where(eq(appointmentTypes.id, id))
      .limit(1);

    if (current.length === 0) {
      return { success: false, error: "Appointment type not found" };
    }

    const currentAppointmentType = current[0];
    if (!currentAppointmentType) {
      return { success: false, error: "Appointment type not found" };
    }

    const now = new Date();
    await db
      .update(appointmentTypes)
      .set({
        isActive: !currentAppointmentType.isActive,
        updatedAt: now,
      })
      .where(eq(appointmentTypes.id, id));
    
    // Revalidate cache
    revalidateTag("appointment-types");
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: mapErrorToUserMessage(error, "Failed to toggle appointment type"),
    };
  }
}

/**
 * Get all appointment types (including inactive ones for admin)
 */
export async function getAllAppointmentTypesAction(
  _input = {}
): Promise<AppointmentType[]> {
  try {
    // Validate input (no parameters needed but required for linter)
    z.object({}).parse(_input);
    
    return await db.select().from(appointmentTypes);
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to fetch appointment types"));
  }
}