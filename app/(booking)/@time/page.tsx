import Link from 'next/link'
import { addMinutes, format } from 'date-fns'
import { listBusyTimesAction } from '@/app/appointments/actions'
import { getAppointmentType } from '@/features/booking'

/**
 * Page segment that lists available time slots for a selected date.
 */

export default async function TimePage({ searchParams }: { searchParams: { type?: string; date?: string; time?: string } }) {
  if (!searchParams.type || !searchParams.date) {
    return <p className="text-muted-foreground">Select a date first.</p>
  }

  const apptType = await getAppointmentType(searchParams.type)
  if (!apptType) {
    return <p className="text-muted-foreground">Invalid appointment type.</p>
  }

  const dayStart = new Date(`${searchParams.date}T00:00:00Z`)
  const dayEnd = new Date(`${searchParams.date}T23:59:59Z`)
  const busy = await listBusyTimesAction(dayStart.toISOString(), dayEnd.toISOString())

  const businessStart = new Date(`${searchParams.date}T09:00:00Z`)
  const businessEnd = new Date(`${searchParams.date}T17:00:00Z`)

  const slots: string[] = []
  for (let t = businessStart; t < businessEnd; t = addMinutes(t, apptType.durationMinutes)) {
    const start = t
    const end = addMinutes(start, apptType.durationMinutes)
    const overlap = busy.some(b => {
      const bStart = new Date(b.startUtc)
      const bEnd = new Date(b.endUtc)
      return bStart < end && bEnd > start
    })
    if (!overlap) {
      slots.push(format(start, 'HH:mm'))
    }
  }

  if (slots.length === 0) {
    return <p className="text-muted-foreground">No times available</p>
  }

  return (
    <ul className="space-y-2">
      {slots.map((t) => (
        <li key={t}>
          <Link href={{ query: { type: searchParams.type, date: searchParams.date, time: t } }}>
            {t}
          </Link>
        </li>
      ))}
    </ul>
  )
}
