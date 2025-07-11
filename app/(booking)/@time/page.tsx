'use client'

import { addMinutes, format } from 'date-fns'
import { listBusyTimesAction } from '@/actions/appointments-actions'
import { getAppointmentType } from '@/app/(booking)/data'
import { useBookingState } from '@/lib/hooks/use-booking-state'
import { useEffect, useState } from 'react'
import { TimeSkeleton } from '@/components/booking-skeletons'
import { Alert } from '@/components/ui/alert'

export default function TimePage() {
  const { type, date, updateBookingStep } = useBookingState()
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!type || !date) return

    setLoading(true)
    setError(null)
    
    Promise.all([
      getAppointmentType(type),
      listBusyTimesAction(
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).toISOString(),
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString()
      )
    ]).then(([apptType, busy]) => {
      if (!apptType) {
        setSlots([])
        return
      }

      const dateStr = format(date, 'yyyy-MM-dd')
      const businessStart = new Date(`${dateStr}T09:00:00Z`)
      const businessEnd = new Date(`${dateStr}T17:00:00Z`)

      const availableSlots: string[] = []
      for (let t = businessStart; t < businessEnd; t = addMinutes(t, apptType.durationMinutes)) {
        const start = t
        const end = addMinutes(start, apptType.durationMinutes)
        const overlap = busy.some(b => {
          const bStart = new Date(b.startUtc)
          const bEnd = new Date(b.endUtc)
          return bStart < end && bEnd > start
        })
        if (!overlap) {
          availableSlots.push(format(start, 'HH:mm'))
        }
      }
      setSlots(availableSlots)
    }).catch((error) => {
      console.error('Failed to load time slots:', error)
      setError('Unable to load available times. Please try again.')
      setSlots([])
    }).finally(() => setLoading(false))
  }, [type, date])

  if (!type || !date) {
    return <p className="text-muted-foreground">Select a date first.</p>
  }

  if (loading) {
    return <TimeSkeleton />
  }

  if (error) {
    return <Alert variant="destructive">{error}</Alert>
  }

  if (slots.length === 0) {
    return <p className="text-muted-foreground">No times available</p>
  }

  return (
    <div>
      <h2 className="font-medium mb-3">Select Time</h2>
      <ul className="space-y-2">
        {slots.map((t) => (
          <li key={t}>
            <button
              onClick={() => updateBookingStep({ time: t })}
              className="w-full text-left p-2 hover:bg-gray-100 rounded border"
            >
              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
