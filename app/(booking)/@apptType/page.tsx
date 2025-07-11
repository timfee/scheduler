'use client'

import { listAppointmentTypes } from '@/app/(booking)/data'
import { useBookingState } from '@/app/(booking)/hooks/use-booking-state'
import { useEffect, useState } from 'react'

export default function AppointmentTypePage() {
  const { updateBookingStep } = useBookingState()
  const [types, setTypes] = useState<Awaited<ReturnType<typeof listAppointmentTypes>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAppointmentTypes()
      .then(setTypes)
      .catch(error => {
        console.error('Failed to fetch appointment types:', error);
        setTypes([]); // Fallback to an empty list
      })
      .finally(() => setLoading(false));
  }, [])

  if (loading) {
    return <div className="space-y-2">Loading appointment types...</div>
  }

  return (
    <div>
      <h2 className="font-medium mb-3">Select Appointment Type</h2>
      <ul className="space-y-2">
        {types.map(t => (
          <li key={t.id}>
            <button
              onClick={() => updateBookingStep({ type: t.id })}
              className="w-full text-left p-2 hover:bg-gray-100 rounded border"
            >
              {t.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
