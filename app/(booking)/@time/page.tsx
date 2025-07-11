'use client'

import { addMinutes, format } from 'date-fns'
import { listBusyTimesAction } from '@/app/appointments/actions'
import { getAppointmentType } from '@/app/(booking)/data'
import { useBookingState } from '@/app/(booking)/hooks/use-booking-state'
import { useEffect, useState } from 'react'
import { TimeSkeleton } from '@/components/booking-skeletons'

export default function TimePage() {
  const { type, date, updateBookingStep } = useBookingState()
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!type || !date) return

    setLoading(true)
    
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
      
      // Create business hours in the user's local timezone (9 AM to 5 PM in their timezone)
      const businessStart = new Date(`${dateStr}T09:00:00`)
      const businessEnd = new Date(`${dateStr}T17:00:00`)

      const availableSlots: string[] = []
      for (let t = businessStart; t < businessEnd; t = addMinutes(t, apptType.durationMinutes)) {
        const start = t
        const end = addMinutes(start, apptType.durationMinutes)
        
        // Convert start/end to UTC for comparison with busy times
        const startUTC = new Date(start.getTime() - (start.getTimezoneOffset() * 60000))
        const endUTC = new Date(end.getTime() - (end.getTimezoneOffset() * 60000))
        
        const overlap = busy.some(b => {
          const bStart = new Date(b.startUtc)
          const bEnd = new Date(b.endUtc)
          return bStart < endUTC && bEnd > startUTC
        })
        if (!overlap) {
          // Display time in user's local timezone
          availableSlots.push(format(start, 'HH:mm'))
        }
      }
      setSlots(availableSlots)
    }).catch((error) => {
      console.error('Failed to load time slots:', error)
      setSlots([])
    }).finally(() => setLoading(false))
  }, [type, date])

  if (!type || !date) {
    return <p className="text-muted-foreground">Select a date first.</p>
  }

  if (loading) {
    return <TimeSkeleton />
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
