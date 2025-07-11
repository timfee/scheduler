import { z } from "zod/v4";

export const timeSlotSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
});

export const dayAvailabilitySchema = z.object({
  enabled: z.boolean(),
  slots: z.array(timeSlotSchema),
});

export const weeklyAvailabilitySchema = z.object({
  monday: dayAvailabilitySchema,
  tuesday: dayAvailabilitySchema,
  wednesday: dayAvailabilitySchema,
  thursday: dayAvailabilitySchema,
  friday: dayAvailabilitySchema,
  saturday: dayAvailabilitySchema,
  sunday: dayAvailabilitySchema,
});

export type TimeSlot = z.infer<typeof timeSlotSchema>;
export type DayAvailability = z.infer<typeof dayAvailabilitySchema>;
export type WeeklyAvailability = z.infer<typeof weeklyAvailabilitySchema>;