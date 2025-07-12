'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DateSelector } from './date-selector'

interface DateSelectorWrapperProps {
  busyDates: Set<string> | string[]
  selectedDate?: string
}

export function DateSelectorWrapper({ 
  busyDates, 
  selectedDate 
}: DateSelectorWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSelect = useCallback((date: Date) => {
    const params = new URLSearchParams(searchParams)
    params.set('date', date.toISOString())
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  return (
    <DateSelector 
      busyDates={busyDates} 
      selectedDate={selectedDate}
      onSelect={handleSelect}
    />
  )
}