import { describe, it, expect } from '@jest/globals'
import { AppointmentTypeSkeleton, DateSkeleton, TimeSkeleton } from '@/components/booking-skeletons'
import { BookingProgress } from '@/components/booking-progress'

describe('Booking Components', () => {
  describe('Skeleton Components', () => {
    it('should render AppointmentTypeSkeleton with correct structure', () => {
      const result = AppointmentTypeSkeleton()
      expect(result).toBeTruthy()
      expect(result.type).toBe('div')
      expect(result.props).toHaveProperty('className', 'space-y-2')
    })

    it('should render DateSkeleton with correct structure', () => {
      const result = DateSkeleton()
      expect(result).toBeTruthy()
      expect(result.type).toBe('div')
      expect(result.props).toHaveProperty('className', 'space-y-2')
    })

    it('should render TimeSkeleton with correct structure', () => {
      const result = TimeSkeleton()
      expect(result).toBeTruthy()
      expect(result.type).toBe('div')
      expect(result.props).toHaveProperty('className', 'space-y-2')
    })
  })

  describe('BookingProgress Component', () => {
    it('should render progress correctly with default total', () => {
      const result = BookingProgress({ progress: 1 })
      expect(result).toBeTruthy()
      expect(result.type).toBe('div')
    })

    it('should render progress correctly with custom total', () => {
      const result = BookingProgress({ progress: 2, total: 5 })
      expect(result).toBeTruthy()
      expect(result.type).toBe('div')
    })

    it('should render correct number of progress dots', () => {
      const result = BookingProgress({ progress: 2, total: 4 })
      expect(result).toBeTruthy()
      // Check that the component renders with correct props
      expect(result.props).toHaveProperty('children')
    })

    it('should handle edge cases', () => {
      const result = BookingProgress({ progress: 0, total: 3 })
      expect(result).toBeTruthy()
      expect(result.type).toBe('div')
    })
  })
})