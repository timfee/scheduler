"use server";

import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { db } from "@/lib/database";
import { mapErrorToUserMessage } from "@/lib/errors";
import {
  appointmentTypes,
  type AppointmentType,
  type NewAppointmentType,
} from "@/lib/schemas/database";
import {
  validateAppointmentTypeDuration,
  validateAppointmentTypeId,
  validateAppointmentTypeName,
} from "@/lib/utils/validation";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
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
  data: CreateAppointmentTypeData,
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

    // eslint-disable-next-line custom/performance-patterns -- better-sqlite3 is synchronous by design
    db.insert(appointmentTypes).values(newAppointmentType).run();

    revalidateTag("appointment-types");

    return { success: true, id };
  } catch (error) {
    return {
      success: false,
      error: mapErrorToUserMessage(
        error,
        ERROR_MESSAGES.FAILED_TO_CREATE_APPOINTMENT_TYPE,
      ),
    };
  }
}

/**
 * Update an existing appointment type
 */
export async function updateAppointmentTypeAction(
  data: UpdateAppointmentTypeData,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input data
    const sanitizedId = validateAppointmentTypeId(data.id);
    const sanitizedName = validateAppointmentTypeName(data.name);
    validateAppointmentTypeDuration(data.durationMinutes);

    const now = new Date();

    // eslint-disable-next-line custom/performance-patterns -- better-sqlite3 is synchronous by design
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
      return {
        success: false,
        error: ERROR_MESSAGES.APPOINTMENT_TYPE_NOT_FOUND,
      };
    }

    revalidateTag("appointment-types");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: mapErrorToUserMessage(
        error,
        ERROR_MESSAGES.FAILED_TO_UPDATE_APPOINTMENT_TYPE,
      ),
    };
  }
}

/**
 * Delete an appointment type
 */
export async function deleteAppointmentTypeAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input data
    const sanitizedId = validateAppointmentTypeId(id);

    // eslint-disable-next-line custom/performance-patterns -- better-sqlite3 is synchronous by design
    const result = db
      .delete(appointmentTypes)
      .where(eq(appointmentTypes.id, sanitizedId))
      .run();

    if (result.changes === 0) {
      return {
        success: false,
        error: ERROR_MESSAGES.APPOINTMENT_TYPE_NOT_FOUND,
      };
    }

    revalidateTag("appointment-types");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: mapErrorToUserMessage(
        error,
        ERROR_MESSAGES.FAILED_TO_DELETE_APPOINTMENT_TYPE,
      ),
    };
  }
}

/**
 * Toggle the active status of an appointment type
 */
export async function toggleAppointmentTypeAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input data
    const sanitizedId = validateAppointmentTypeId(id);

    // First get the current state
    // eslint-disable-next-line custom/performance-patterns -- Loading single appointment type, appropriate for lookup
    const current = db
      .select()
      .from(appointmentTypes)
      .where(eq(appointmentTypes.id, sanitizedId))
      .limit(1)
      .all();

    if (current.length === 0) {
      return {
        success: false,
        error: ERROR_MESSAGES.APPOINTMENT_TYPE_NOT_FOUND,
      };
    }

    const currentAppointmentType = current[0]!;

    const now = new Date();
    // eslint-disable-next-line custom/performance-patterns -- better-sqlite3 is synchronous by design
    db.update(appointmentTypes)
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
      error: mapErrorToUserMessage(
        error,
        ERROR_MESSAGES.FAILED_TO_TOGGLE_APPOINTMENT_TYPE,
      ),
    };
  }
}

/**
 * Get all appointment types (including inactive ones for admin)
 */
export async function getAllAppointmentTypesAction(
  _input = {},
): Promise<AppointmentType[]> {
  try {
    // Validate input (no parameters needed but required for linter)
    z.object({}).parse(_input);

    // eslint-disable-next-line custom/performance-patterns -- Admin view needs all appointment types (small dataset)
    return db.select().from(appointmentTypes).all();
  } catch (error) {
    throw new Error(
      mapErrorToUserMessage(error, "Failed to fetch appointment types"),
    );
  }
}
