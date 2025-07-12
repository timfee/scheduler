import { listBusyTimesAction } from '@/app/appointments/actions'
import { DateSelectorWrapper } from '@/app/(booking)/components/date-selector-wrapper'
import { addDays, format, startOfDay } from 'date-fns'

export default async function DatePage({
  searchParams
}: {
  searchParams: { type?: string; date?: string; time?: string }
}) {
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

  return (
    <DateSelectorWrapper 
      busyDates={busyDates} 
      selectedDate={searchParams.date}
    />
  )
}
