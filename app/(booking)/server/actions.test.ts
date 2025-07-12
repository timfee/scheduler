import { beforeAll, afterEach, describe, expect, it, jest } from '@jest/globals'
import { type BookingFormData } from '@/lib/schemas/booking'
import { type CalDavProvider } from '@/lib/providers/caldav'
import { type CalendarEvent } from '@/lib/schemas/calendar-event'
import { bookingFactory, calendarEventFactory, appointmentTypeFactory } from '@test/factories'
import { TEST_CONSTANTS } from '@/lib/constants'
import '@test/setup/jest.setup'

// Mock the appointment type data
jest.mock('@/app/(booking)/server/data', () => ({
  getAppointmentType: jest.fn(async () => appointmentTypeFactory.build({
    id: 'intro',
    name: 'Intro',
    durationMinutes: 30,
    isActive: true,
  })),
}))

// Mock the database integrations
jest.mock('@/lib/database/integrations', () => ({
  getBookingCalendar: jest.fn(async () => ({
    id: "1",
    provider: "caldav",
    displayName: "Main",
    encryptedConfig: "",
    displayOrder: 0,
    createdAt: 0,
    updatedAt: 0,
    config: {
      calendarUrl: "https://cal",
      serverUrl: "https://cal",
      authMethod: "Basic",
      username: "u",
      password: "p",
      capabilities: ["booking"],
    },
  })),
  createDAVClientFromIntegration: jest.fn(async () => ({})),
}))

// Mock the CalDAV provider
let provider: Pick<CalDavProvider, 'listBusyTimes' | 'createAppointment'>

jest.mock('@/lib/providers/caldav', () => ({
  createCalDavProvider: jest.fn(() => provider),
}))

let createBookingAction: (data: BookingFormData) => Promise<void>
let clearRateLimiter: () => void
const validData: BookingFormData = bookingFactory.build()

const mockCalendarEvent: CalendarEvent = calendarEventFactory.build({
  id: 'test-id',
  title: 'Test Event',
  startUtc: '2024-01-01T10:00:00.000Z',
  endUtc: '2024-01-01T10:30:00.000Z',
  createdUtc: '2024-01-01T09:00:00.000Z',
  updatedUtc: '2024-01-01T09:00:00.000Z',
})

beforeAll(async () => {
  Object.assign(process.env, { NODE_ENV: 'development' })
  process.env.ENCRYPTION_KEY =
    'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148'
  process.env.SQLITE_PATH = TEST_CONSTANTS.SQLITE_PATH

  provider = {
    listBusyTimes: jest.fn(async () => []),
    createAppointment: jest.fn(async () => mockCalendarEvent),
  }

  ;({ createBookingAction, clearRateLimiter } = await import('@/app/(booking)/server/actions'))
})

afterEach(() => {
  clearRateLimiter()
})

describe('createBookingAction', () => {
  it('validates all required fields', async () => {
    const invalidData = bookingFactory.build({ name: '' })
    await expect(createBookingAction(invalidData)).rejects.toThrow()
  })

  it('checks calendar availability before booking', async () => {
    await createBookingAction(validData)
    expect(provider.listBusyTimes).toHaveBeenCalled()
    expect(provider.createAppointment).toHaveBeenCalled()
  })

  it('handles calendar connection errors gracefully', async () => {
    jest.resetModules()
    jest.unstable_mockModule(
      '@/lib/database/integrations',
      () => ({
        getBookingCalendar: jest.fn(async () => null),
        createDAVClientFromIntegration: jest.fn(async () => ({})),
      })
    )
    const { createBookingAction: action } = await import('@/app/(booking)/server/actions')
    await expect(action(validData)).rejects.toThrow('No booking calendar configured')
  })

  it('enforces rate limiting per email', async () => {
    // First request should succeed
    await createBookingAction(validData)
    
    // Second request from same email should fail
    await expect(createBookingAction(validData)).rejects.toThrow('Too many booking attempts')
    
    // Different email should succeed
    const differentEmailData = bookingFactory.build({ email: 'different@example.com' })
    await createBookingAction(differentEmailData)
  })

  it('cleans up old rate limit entries to prevent memory growth', async () => {
    // Create a booking to populate the rate limiter
    await createBookingAction(validData)
    
    // Mock Date.now to simulate time passing beyond cleanup threshold
    const originalDateNow = Date.now
    const mockNow = jest.fn<() => number>()
    Date.now = mockNow
    
    try {
      // First call - return current time
      mockNow.mockReturnValue(originalDateNow())
      
      // Second call - return time 3 minutes in the future (beyond 2 minute cleanup threshold)
      mockNow.mockReturnValue(originalDateNow() + 3 * 60 * 1000)
      
      // This should succeed because the old entry should be cleaned up
      await createBookingAction(validData)
      
      // The rate limiter should allow the request since old entries are cleaned up
      expect(provider.createAppointment).toHaveBeenCalled()
    } finally {
      Date.now = originalDateNow
    }
  })

  it('cleans up old rate limit entries during booking requests', async () => {
    // This test verifies that the manual cleanup works correctly during booking requests
    
    // Create a booking to populate the rate limiter
    await createBookingAction(validData)
    
    // Mock Date.now to simulate time passing beyond cleanup threshold
    const originalDateNow = Date.now
    const mockNow = jest.fn<() => number>()
    Date.now = mockNow
    
    try {
      // Return time 3 minutes in the future (beyond 2 minute cleanup threshold)
      mockNow.mockReturnValue(originalDateNow() + 3 * 60 * 1000)
      
      // The manual cleanup during booking should remove old entries
      await createBookingAction(validData)
      
      // Should succeed because cleanup removes old entries
      expect(provider.createAppointment).toHaveBeenCalled()
    } finally {
      Date.now = originalDateNow
    }
  })

  it('sets up periodic cleanup interval to prevent memory growth', async () => {
    // Use fake timers to test the setInterval scheduling
    jest.useFakeTimers()
    const setIntervalSpy = jest.spyOn(global, 'setInterval')
    
    try {
      // Re-import the module to trigger the setInterval call
      jest.resetModules()
      await import('@/app/(booking)/server/actions')
      
      // Verify that setInterval was called with the cleanup function and 5 minute interval
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000
      )
    } finally {
      jest.useRealTimers()
      setIntervalSpy.mockRestore()
    }
  })
})
