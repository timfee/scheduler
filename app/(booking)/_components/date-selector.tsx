'use client'

import { addDays, format, startOfDay } from 'date-fns'
import { useBookingState } from '@/app/(booking)/_hooks/use-booking-state'
import { useCallback } from 'react'

interface DateSelectorProps {
  type: string | null
  busyDates: Set<string>
}

export function DateSelector({ type, busyDates }: DateSelectorProps) {
  const { updateBookingStep } = useBookingState()

  const handleSelectDate = useCallback((date: Date) => {
    updateBookingStep({ date })
  }, [updateBookingStep])

  const handleButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const dateStr = button.dataset.date
    if (dateStr) {
      const date = new Date(dateStr)
      handleSelectDate(date)
    }
  }, [handleSelectDate])

  if (!type) {
    return <p className="text-muted-foreground">Select a type first.</p>
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
                onClick={handleButtonClick}
                data-date={d.toISOString()}
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