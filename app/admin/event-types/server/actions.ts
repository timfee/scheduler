"use server";

import { db } from "@/lib/database";
import { appointmentTypes, type AppointmentType, type NewAppointmentType } from "@/lib/schemas/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { mapErrorToUserMessage } from "@/lib/errors";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { 
  validateAppointmentTypeName, 
  validateAppointmentTypeDuration, 
  validateAppointmentTypeId 
} from "@/lib/utils/validation";

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
    // Validate input data
    const sanitizedName = validateAppointmentTypeName(data.name);
    validateAppointmentTypeDuration(data.durationMinutes);

    const now = new Date();
    const id = uuid();
    
    const newAppointmentType: NewAppointmentType = {
      id,
      name: sanitizedName,
      description: data.description?.trim() ?? null,
      durationMinutes: data.durationMinutes,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(appointmentTypes).values(newAppointmentType).run();
    
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
    // Validate input data
    const sanitizedId = validateAppointmentTypeId(data.id);
    const sanitizedName = validateAppointmentTypeName(data.name);
    validateAppointmentTypeDuration(data.durationMinutes);

    const now = new Date();
    
    const result = db
      .update(appointmentTypes)
      .set({
        name: sanitizedName,
        description: data.description?.trim() ?? null,
        durationMinutes: data.durationMinutes,
        isActive: data.isActive,
        updatedAt: now,
      })
      .where(eq(appointmentTypes.id, sanitizedId))
      .run();

    if (result.changes === 0) {
      return { success: false, error: "Appointment type not found" };
    }
    
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
    // Validate input data
    const sanitizedId = validateAppointmentTypeId(id);

    const result = db
      .delete(appointmentTypes)
      .where(eq(appointmentTypes.id, sanitizedId))
      .run();

    if (result.changes === 0) {
      return { success: false, error: "Appointment type not found" };
    }
    
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
    // Validate input data
    const sanitizedId = validateAppointmentTypeId(id);

    // First get the current state
    const current = db
      .select()
      .from(appointmentTypes)
      .where(eq(appointmentTypes.id, sanitizedId))
      .limit(1)
      .all();

    if (current.length === 0) {
      return { success: false, error: "Appointment type not found" };
    }

    const currentAppointmentType = current[0]!;

    const now = new Date();
    db
      .update(appointmentTypes)
      .set({
        isActive: !currentAppointmentType.isActive,
        updatedAt: now,
      })
      .where(eq(appointmentTypes.id, sanitizedId))
      .run();
    
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
    
    return db.select().from(appointmentTypes).all();
  } catch (error) {
    throw new Error(mapErrorToUserMessage(error, "Failed to fetch appointment types"));
  }
}