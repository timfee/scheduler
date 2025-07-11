import { addDays, format, startOfDay } from 'date-fns'
import { listBusyTimesAction } from '@/app/appointments/actions'
import { DateSelector } from '@/app/(booking)/components/date-selector'

interface DatePageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function DatePage({ searchParams }: DatePageProps) {
  const { type } = await searchParams

  if (!type) {
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

  return <DateSelector type={type} busyDates={busyDates} />
}
