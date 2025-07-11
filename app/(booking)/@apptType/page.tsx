'use client'

import { listAppointmentTypes } from '@/app/(booking)/data'
import { useBookingState } from '@/app/(booking)/hooks/use-booking-state'

import { useCallback, useEffect, useState } from 'react'
import { AppointmentTypeSkeleton } from '@/components/booking-skeletons'

export default function AppointmentTypePage() {
  const { updateBookingStep } = useBookingState()
  const [types, setTypes] = useState<Awaited<ReturnType<typeof listAppointmentTypes>>>([])
  const [loading, setLoading] = useState(true)

  const handleSelectType = useCallback((typeId: string) => {
    updateBookingStep({ type: typeId })
  }, [updateBookingStep])

  const handleButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const typeId = button.dataset.typeId;
    if (typeId) {
      handleSelectType(typeId);
    }
  }, [handleSelectType]);

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
    return <AppointmentTypeSkeleton />
  }

  return (
    <div>
      <h2 className="font-medium mb-3">Select Appointment Type</h2>
      <ul className="space-y-2">
        {types.map(t => (
          <li key={t.id}>
            <button
              onClick={handleButtonClick}
              data-type-id={t.id}
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
