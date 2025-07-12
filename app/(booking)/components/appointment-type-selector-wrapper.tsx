'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { AppointmentTypeSelector } from './appointment-type-selector'
import { type AppointmentType } from '@/app/(booking)/server/data'

interface AppointmentTypeSelectorWrapperProps {
  types: AppointmentType[]
  selectedType?: string
}

export function AppointmentTypeSelectorWrapper({ 
  types, 
  selectedType 
}: AppointmentTypeSelectorWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSelect = useCallback((typeId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('type', typeId)
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  return (
    <AppointmentTypeSelector 
      types={types} 
      selectedType={selectedType}
      onSelect={handleSelect}
    />
  )
}