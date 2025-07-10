import { z } from "zod/v4";

const schemaRegistry = z.registry<{
  id?: string;
  title?: string;
  description?: string;
  examples?: unknown[];
}>();

export const CalendarEventSchema = z
  .strictObject({
    id: z.uuid().meta({
      title: "Event ID",
      description: "Globally unique UUID identifier",
    }),
    title: z.string().default("Event").meta({
      title: "Title",
      description: "Event title",
    }),
    description: z.string().optional().meta({
      title: "Description",
      description: "Optional event description",
    }),
    location: z.string().optional().meta({
      title: "Location",
      description: "Optional event location",
    }),
    startUtc: z.iso.datetime({ offset: true }).meta({
      title: "Start Time",
      description: "ISO-8601 timestamp with UTC offset",
      examples: ["2025-07-05T15:00:00+00:00"],
    }),
    endUtc: z.iso.datetime({ offset: true }).meta({
      title: "End Time",
      description: "ISO-8601 timestamp with UTC offset",
      examples: ["2025-07-05T16:00:00+00:00"],
    }),
    createdUtc: z.iso.datetime({ offset: true }).optional().meta({
      title: "Created At",
      description: "Event creation timestamp",
    }),
    updatedUtc: z.iso.datetime({ offset: true }).optional().meta({
      title: "Updated At",
      description: "Event last update timestamp",
    }),
    ownerTimeZone: z.string().meta({
      title: "Owner Timezone",
      description: "IANA timezone (e.g., America/Los_Angeles)",
    }),
    metadata: z.record(z.string(), z.unknown()).optional().meta({
      title: "Metadata",
      description: "Provider-specific raw data",
    }),
  })
  .register(schemaRegistry, {
    id: "CalendarEvent",
    title: "CalendarEvent",
    description: "Normalized calendar event structure",
  });

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export const CalendarEventInputSchema = CalendarEventSchema.pick({
  title: true,
  description: true,
  location: true,
  startUtc: true,
  endUtc: true,
  ownerTimeZone: true,
}).register(schemaRegistry, {
  id: "CalendarEventInput",
  title: "CalendarEventInput",
  description: "Fields required to create a calendar event",
});

export type CalendarEventInput = z.infer<typeof CalendarEventInputSchema>;
