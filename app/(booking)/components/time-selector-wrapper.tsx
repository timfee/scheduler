'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { TimeSelector } from './time-selector'

interface TimeSelectorWrapperProps {
  slots: string[]
  error: string | null
  selectedTime?: string
}

export function TimeSelectorWrapper({ 
  slots, 
  error, 
  selectedTime 
}: TimeSelectorWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSelect = useCallback((time: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('time', time)
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  return (
    <TimeSelector 
      slots={slots} 
      error={error} 
      selectedTime={selectedTime}
      onSelect={handleSelect}
    />
  )
}