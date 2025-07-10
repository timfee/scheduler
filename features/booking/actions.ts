"use server";

import { getBookingCalendar, createDAVClientFromIntegration } from "@/infrastructure/database/integrations";
import { createCalDavProvider } from "@/infrastructure/providers/caldav";
import { getAppointmentType } from "./data";
import { DEFAULT_TIMEZONE } from "@/types/constants";
import { z } from "zod/v4";

const bookingFormSchema = z.object({
  type: z.string(),
  date: z.string().regex(/\d{4}-\d{2}-\d{2}/, "Invalid date"),
  time: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

/**
 * Server action to create a booking on the configured calendar.
 *
 * Validates the submitted form data, resolves the appointment type and
 * booking calendar and then creates the event via CalDAV.
 */
export async function createBookingAction(formData: BookingFormData) {
  const { type, date, time, name, email } = bookingFormSchema.parse(formData);

  const apptType = await getAppointmentType(type);
  if (!apptType) {
    throw new Error("Invalid appointment type");
  }

  const start = new Date(`${date}T${time}:00Z`);
  const end = new Date(start.getTime() + apptType.durationMinutes * 60 * 1000);

  const integration = await getBookingCalendar();
  if (!integration) {
    throw new Error("No booking calendar configured");
  }

  const client = await createDAVClientFromIntegration(integration);
  const provider = createCalDavProvider(
    client,
    integration.config.calendarUrl ?? ""
  );

  await provider.createAppointment({
    title: `${apptType.name} - ${name}`,
    description: `Scheduled via booking form for ${email}`,
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
    ownerTimeZone: DEFAULT_TIMEZONE,
    location: "",
  });
}
