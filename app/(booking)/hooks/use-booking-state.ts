import { parseAsString, parseAsIsoDateTime, useQueryStates } from 'nuqs'

export const bookingParsers = {
  type: parseAsString.withDefault(''),
  date: parseAsIsoDateTime,
  time: parseAsString.withDefault(''),
}

export function useBookingState() {
  const [state, setState] = useQueryStates(bookingParsers)

  const updateBookingStep = (updates: Partial<typeof state>) => {
    setState(updates).catch((error) => {
      console.error('Failed to update booking state:', error)
    })
  }

  const progress = [state.type, state.date, state.time].filter(Boolean).length
  const isComplete = Boolean(state.type && state.date && state.time)

  return {
    ...state,
    updateBookingStep,
    isComplete,
    progress,
    // Keep backward compatibility
    setState,
  }
}
