import { addDays, format, startOfDay } from 'date-fns'
import Link from 'next/link'
import { listBusyTimesAction } from '@/app/appointments/actions'

/**
 * Page segment that lists selectable booking dates.
 */

export default async function DatePage({ searchParams }: { searchParams: { type?: string; date?: string } }) {
  if (!searchParams.type) {
    return <p className="text-muted-foreground">Select a type first.</p>
  }

  const today = startOfDay(new Date())
  const from = today
  const to = addDays(today, 5)

  const busy = await listBusyTimesAction(
    format(from, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    format(to, "yyyy-MM-dd'T'HH:mm:ssXXX"),
  )
  const busyDates = new Set(busy.map(b => b.startUtc.slice(0, 10)))

  const days = Array.from({ length: 5 }).map((_, i) => addDays(today, i))

  return (
    <ul className="space-y-2">
      {days.map((d) => {
        const iso = format(d, 'yyyy-MM-dd')
        return (
          <li key={iso}>
            <Link href={{ query: { type: searchParams.type, date: iso } }}>
              {format(d, 'MMM d')}
              {busyDates.has(iso) ? ' (busy)' : ''}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
