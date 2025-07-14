import { randomUUID } from "crypto";
import { type AppointmentType } from "@/lib/schemas/database";

import { Factory } from "./base";

/**
 * Factory for creating appointment types
 */
export const appointmentTypeFactory = Factory.define<AppointmentType>(() => ({
  id: randomUUID(),
  name: "Intro",
  description: "Introduction meeting",
  durationMinutes: 30,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

/**
 * Appointment type factory variants
 */
export const appointmentTypeVariants = {
  intro: () =>
    appointmentTypeFactory.build({
      name: "Intro",
      description: "Introduction meeting",
      durationMinutes: 30,
    }),

  followUp: () =>
    appointmentTypeFactory.build({
      name: "Follow-up",
      description: "Follow-up meeting",
      durationMinutes: 30,
    }),

  consultation: () =>
    appointmentTypeFactory.build({
      name: "Consultation",
      description: "Consultation session",
      durationMinutes: 60,
    }),

  briefing: () =>
    appointmentTypeFactory.build({
      name: "Briefing",
      description: "Quick briefing session",
      durationMinutes: 15,
    }),

  withDuration: (durationMinutes: number) =>
    appointmentTypeFactory.build({ durationMinutes }),

  inactive: () =>
    appointmentTypeFactory.build({
      isActive: false,
    }),

  withDescription: (description: string) =>
    appointmentTypeFactory.build({ description }),
};
