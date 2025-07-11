'use client'

import { addDays, format, startOfDay } from 'date-fns'
import { listBusyTimesAction } from '@/actions/appointments-actions'
import { useBookingState } from '@/lib/hooks/use-booking-state'
import { useEffect, useState } from 'react'
import { DateSkeleton } from '@/components/booking-skeletons'

export default function DatePage() {
  const { type, updateBookingStep } = useBookingState()
  const [busyDates, setBusyDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!type) return

    setLoading(true)
    const today = startOfDay(new Date())
    const from = today
    const to = addDays(today, 5)

    void listBusyTimesAction(
      format(from, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      format(to, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    ).then(busy => {
      setBusyDates(new Set(busy.map(b => b.startUtc.slice(0, 10))))
    }).finally(() => setLoading(false))
  }, [type])

  if (!type) {
    return <p className="text-muted-foreground">Select a type first.</p>
  }

  if (loading) {
    return <DateSkeleton />
  }

  const today = startOfDay(new Date())
  const days = Array.from({ length: 5 }).map((_, i) => addDays(today, i))

  return (
    <div>
      <h2 className="font-medium mb-3">Select Date</h2>
      <ul className="space-y-2">
        {days.map((d) => {
          const iso = format(d, 'yyyy-MM-dd')
          const isBusy = busyDates.has(iso)
          return (
            <li key={iso}>
              <button
                onClick={() => updateBookingStep({ date: d })}
                className={`w-full text-left p-2 rounded border hover:bg-gray-100 ${
                  isBusy ? 'opacity-50' : ''
                }`}
                disabled={isBusy}
              >
                {format(d, 'MMM d')}
                {isBusy ? ' (busy)' : ''}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
