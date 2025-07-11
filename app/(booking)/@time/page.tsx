import { getAppointmentType } from "@/app/(booking)/server/data";
import { listBusyTimesAction } from "@/app/appointments/actions";
import { TimeSelector } from "./time-selector";
import { addMinutes, format } from 'date-fns';
import { DEFAULT_BUSINESS_HOURS } from '@/lib/types/constants';

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
        `${searchParams.date}T00:00:00`, // Start of the day
        `${searchParams.date}T23:59:59`  // End of the day
      ),
    ])

    if (!apptType) {
      slots = []
    } else {
      const dateStr = format(date, 'yyyy-MM-dd')

      // Create business hours in the user's local timezone (9 AM to 5 PM in their timezone)
      const businessStart = new Date(`${dateStr}T${DEFAULT_BUSINESS_HOURS.start}:00`)
      const businessEnd = new Date(`${dateStr}T${DEFAULT_BUSINESS_HOURS.end}:00`)

      const availableSlots: string[] = []
      for (
        let t = businessStart;
        t < businessEnd;
        t = addMinutes(t, apptType.durationMinutes)
      ) {
        const start = t
        const end = addMinutes(start, apptType.durationMinutes)

        // Convert start/end to UTC for comparison with busy times
        const startUTC = new Date(
          start.getTime() - start.getTimezoneOffset() * 60000,
        )
        const endUTC = new Date(
          end.getTime() - end.getTimezoneOffset() * 60000,
        )

        const overlap = busy.some((b) => {
          const bStart = new Date(b.startUtc)
          const bEnd = new Date(b.endUtc)
          return bStart < endUTC && bEnd > startUTC
        })
        if (!overlap) {
          // Display time in user's local timezone
          availableSlots.push(format(start, 'HH:mm'))
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
