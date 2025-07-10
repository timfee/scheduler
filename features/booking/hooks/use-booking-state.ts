import { parseAsString, parseAsIsoDateTime, useQueryStates } from 'nuqs'

export const bookingParsers = {
  type: parseAsString.withDefault(''),
  date: parseAsIsoDateTime,
  time: parseAsString.withDefault(''),
}

export function useBookingState() {
  return useQueryStates(bookingParsers)
}
