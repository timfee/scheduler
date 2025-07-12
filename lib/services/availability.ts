"use server";

import { getPreference, setPreference } from "@/lib/utils/preferences";
import { weeklyAvailabilitySchema, type WeeklyAvailability } from "@/lib/schemas/availability";
import { mapErrorToUserMessage } from "@/lib/errors";
import { revalidatePath } from "next/cache";

const AVAILABILITY_TEMPLATE_KEY = "availability_template";

/**
 * Save the weekly availability template
 */
export async function saveAvailabilityTemplateAction(availability: WeeklyAvailability): Promise<void> {
  try {
    // Validate the input
    const validated = weeklyAvailabilitySchema.parse(availability);
    
    // Save to preferences
    await setPreference(AVAILABILITY_TEMPLATE_KEY, validated);
    
    // Revalidate the admin pages
    revalidatePath("/admin/availability");
    revalidatePath("/admin");
    
  } catch (error) {
    console.error("Failed to save availability template:", error);
    throw new Error(mapErrorToUserMessage(error, "Failed to save availability template"));
  }
}

/**
 * Load the weekly availability template
 */
export async function loadAvailabilityTemplateAction(): Promise<WeeklyAvailability | null> {
  try {
    const template = await getPreference<WeeklyAvailability>(AVAILABILITY_TEMPLATE_KEY);
    
    if (!template) {
      return null;
    }
    
    // Validate the stored data
    const validated = weeklyAvailabilitySchema.parse(template);
    return validated;
    
  } catch (error) {
    console.error("Failed to load availability template:", error);
    throw new Error(mapErrorToUserMessage(error, "Failed to load availability template"));
  }
}