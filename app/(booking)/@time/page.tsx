import { getAppointmentType } from "@/app/(booking)/server/data";
import { listBusyTimesAction } from "@/app/appointments/actions";
import { TimeSelector } from "./time-selector";
import { addMinutes, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export default async function TimePage({
  searchParams
}: {
  searchParams: { type?: string; date?: string; time?: string }
}) {
  if (!searchParams.type || !searchParams.date) {
    return <p className="text-muted-foreground">Select a date first.</p>;
  }

  const date = new Date(searchParams.date);
  let slots: string[] = [];
  let error: string | null = null;
  
  try {
    const [apptType, busy] = await Promise.all([
      getAppointmentType(searchParams.type),
      listBusyTimesAction(
        `${searchParams.date}T00:00:00Z`, // Start of the day
        `${searchParams.date}T23:59:59Z`  // End of the day
      ),
    ])

    if (!apptType) {
      slots = []
    } else {
      const dateStr = format(date, 'yyyy-MM-dd')

      // Create business hours in the dynamically fetched business timezone, then convert to UTC
      const businessTimezone = apptType.timezone || 'America/New_York'; // Fallback to default if timezone is not provided
      const businessStart = fromZonedTime(`${dateStr}T09:00:00`, businessTimezone);
      const businessEnd = fromZonedTime(`${dateStr}T17:00:00`, businessTimezone);

      const availableSlots: string[] = []
      for (
        let t = businessStart;
        t < businessEnd;
        t = addMinutes(t, apptType.durationMinutes)
      ) {
        const start = t
        const end = addMinutes(start, apptType.durationMinutes)

        // Convert start/end to UTC strings for comparison with busy times
        const startUTC = start.toISOString().replace(/\.000Z$/, 'Z');
        const endUTC = end.toISOString().replace(/\.000Z$/, 'Z');

        const overlap = busy.some((b) => {
          const bStart = b.startUtc;
          const bEnd = b.endUtc;
          return bStart < endUTC && bEnd > startUTC;
        })
        if (!overlap) {
          // Display time in the business timezone for user readability
          const zonedStart = toZonedTime(start, businessTimezone);
          availableSlots.push(format(zonedStart, 'HH:mm'))
        }
      }
      slots = availableSlots
    }
  } catch (err) {
    console.error('Failed to load time slots:', err)
    error = 'Unable to load available times. Please try again.'
    slots = []
  }

  return <TimeSelector slots={slots} error={error} />
}
