'use client'

import { useBookingState } from '@/app/(booking)/hooks/use-booking-state'
import { useCallback } from 'react'
import { type AppointmentType } from '@/app/(booking)/server/data'

interface AppointmentTypeSelectorProps {
  types: AppointmentType[]
}

export function AppointmentTypeSelector({ types }: AppointmentTypeSelectorProps) {
  const { updateBookingStep } = useBookingState()

  const handleSelectType = useCallback((typeId: string) => {
    updateBookingStep({ type: typeId })
  }, [updateBookingStep])

  const handleButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const typeId = button.dataset.typeId
    if (typeId) {
      handleSelectType(typeId)
    }
  }, [handleSelectType])

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