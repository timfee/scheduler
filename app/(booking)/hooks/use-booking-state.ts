import { parseAsString, parseAsIsoDateTime, useQueryStates } from 'nuqs'

export const bookingParsers = {
  type: parseAsString.withDefault(''),
  selectedDate: parseAsIsoDateTime,
  selectedTime: parseAsString.withDefault(''),
}

export function useBookingState() {
  const [state, setState] = useQueryStates(bookingParsers)

  const updateBookingStep = (updates: Partial<typeof state>) => {
    setState(updates).catch((error) => {
      console.error('Failed to update booking state:', error)
    })
  }

  const progress = [state.type, state.selectedDate, state.selectedTime].filter(Boolean).length
  const isComplete = Boolean(state.type && state.selectedDate && state.selectedTime)

  return {
    ...state,
    updateBookingStep,
    isComplete,
    progress,
    // Keep backward compatibility
    setState,
  }
}
