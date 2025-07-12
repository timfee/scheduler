'use client'

import { addDays, format, startOfDay } from 'date-fns'
import { useBookingState } from '@/app/(booking)/hooks/use-booking-state'
import { useCallback } from 'react'

interface DateSelectorProps {
  type?: string | null
  busyDates: Set<string> | string[]
  selectedDate?: string
  onSelect?: (date: Date) => void
}

export function DateSelector({ 
  type, 
  busyDates, 
  selectedDate, 
  onSelect 
}: DateSelectorProps) {
  const { updateBookingStep } = useBookingState()

  const handleSelectDate = useCallback((date: Date) => {
    if (onSelect) {
      onSelect(date)
    } else {
      updateBookingStep({ date })
    }
  }, [updateBookingStep, onSelect])

  const handleButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const dateStr = button.dataset.date
    if (dateStr) {
      const date = new Date(dateStr)
      handleSelectDate(date)
    }
  }, [handleSelectDate])

  if (type === null) {
    return <p className="text-muted-foreground">Select a type first.</p>
  }

  const busyDatesSet = busyDates instanceof Set ? busyDates : new Set(busyDates)
  const today = startOfDay(new Date())
  const days = Array.from({ length: 5 }).map((_, i) => addDays(today, i))

  return (
    <div>
      <h2 className="font-medium mb-3">Select Date</h2>
      <ul className="space-y-2">
        {days.map((d) => {
          const iso = format(d, 'yyyy-MM-dd')
          const isBusy = busyDatesSet.has(iso)
          const isSelected = selectedDate && new Date(selectedDate).toDateString() === d.toDateString()
          return (
            <li key={iso}>
              <button
                onClick={handleButtonClick}
                data-date={d.toISOString()}
                className={`w-full text-left p-2 rounded border hover:bg-gray-100 ${
                  isBusy ? 'opacity-50' : ''
                } ${isSelected ? 'bg-blue-50 border-blue-300' : ''}`}
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