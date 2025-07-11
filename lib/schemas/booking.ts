import { z } from "zod";

export const bookingFormSchema = z.object({
  type: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/\d{2}:\d{2}/),
  name: z.string().min(1),
  email: z.string().email(),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;