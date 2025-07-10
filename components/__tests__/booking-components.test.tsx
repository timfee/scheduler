import { describe, it, expect } from '@jest/globals'
import { AppointmentTypeSkeleton, DateSkeleton, TimeSkeleton } from '@/components/booking-skeletons'
import { BookingProgress } from '@/components/booking-progress'

describe('Booking Components', () => {
  it('should render skeleton components without errors', () => {
    expect(() => AppointmentTypeSkeleton()).not.toThrow()
    expect(() => DateSkeleton()).not.toThrow()
    expect(() => TimeSkeleton()).not.toThrow()
  })

  it('should render progress component correctly', () => {
    expect(() => BookingProgress({ progress: 1 })).not.toThrow()
    expect(() => BookingProgress({ progress: 2, total: 5 })).not.toThrow()
  })
})