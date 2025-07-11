import { getAppointmentType } from '@/app/(booking)/data'
import { listBusyTimesAction } from '@/app/appointments/actions'
import { addMinutes, format } from 'date-fns'
import { TimeSelector } from '@/app/(booking)/components/time-selector'

interface TimePageProps {
  searchParams: Promise<{ type?: string; date?: string }>
}

export default async function TimePage({ searchParams }: TimePageProps) {
  const { type, date: dateParam } = await searchParams

  if (!type || !dateParam) {
    return <p className="text-muted-foreground">Select a date first.</p>
  }

  let slots: string[] = []
  let error: string | null = null

  try {
    const date = new Date(dateParam)
    const [apptType, busy] = await Promise.all([
      getAppointmentType(type),
      listBusyTimesAction(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          0,
          0,
          0,
        ).toISOString(),
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          23,
          59,
          59,
        ).toISOString(),
      ),
    ])

    if (!apptType) {
      slots = []
    } else {
      const dateStr = format(date, 'yyyy-MM-dd')

      // Create business hours in the user's local timezone (9 AM to 5 PM in their timezone)
      const businessStart = new Date(`${dateStr}T09:00:00`)
      const businessEnd = new Date(`${dateStr}T17:00:00`)

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

  return <TimeSelector type={type} date={dateParam} slots={slots} error={error} />
}
