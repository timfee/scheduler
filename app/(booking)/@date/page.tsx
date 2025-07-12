import { listBusyTimesAction } from '@/lib/services/busy-times'
import { DateSelectorWrapper } from '@/app/(booking)/components/date-selector-wrapper'
import { createDateRange } from '@/lib/utils/date-range'

export default async function DatePage({
  searchParams
}: {
  searchParams: { type?: string; date?: string; time?: string }
}) {
  if (!searchParams.type) {
    return <p className="text-muted-foreground">Select a type first.</p>
  }

  const { from, to } = createDateRange(5)

  const busy = await listBusyTimesAction(from, to)

  const busyDates = new Set(busy.map(b => b.startUtc.slice(0, 10)))

  return (
    <DateSelectorWrapper 
      busyDates={busyDates} 
      selectedDate={searchParams.date}
    />
  )
}
