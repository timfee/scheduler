import { beforeAll, afterEach, describe, expect, it, jest } from '@jest/globals'
import { type BookingFormData } from '../schemas/booking'

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */

let createBookingAction: (data: BookingFormData) => Promise<void>
let clearRateLimiter: () => void
let provider: any
const validData: BookingFormData = {
  type: 'intro',
  date: '2024-01-01',
  time: '10:00',
  name: 'Jane',
  email: 'test@example.com',
}

beforeAll(async () => {
  Object.assign(process.env, { NODE_ENV: 'development' })
  process.env.ENCRYPTION_KEY =
    'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148'
  process.env.SQLITE_PATH = ':memory:'

  provider = {
    listBusyTimes: jest.fn(async () => []) as any,
    createAppointment: jest.fn(async () => undefined) as any,
  }

  ;(jest as unknown as { unstable_mockModule: (p: string, f: () => unknown) => void }).unstable_mockModule(
    '@/infrastructure/database/integrations',
    () => ({
      getBookingCalendar: jest.fn(async () => ({
        id: '1',
        provider: 'caldav',
        displayName: 'Main',
        encryptedConfig: '',
        displayOrder: 0,
        createdAt: 0,
        updatedAt: 0,
        config: {
          calendarUrl: 'https://cal',
          serverUrl: 'https://cal',
          authMethod: 'Basic',
          username: 'u',
          password: 'p',
          capabilities: ['booking'],
        },
      })),
      createDAVClientFromIntegration: jest.fn(async () => ({})),
    })
  )

  ;(jest as unknown as { unstable_mockModule: (p: string, f: () => unknown) => void }).unstable_mockModule(
    '@/infrastructure/providers/caldav',
    () => ({
      createCalDavProvider: jest.fn(() => provider) as any,
    })
  )

  ;(jest as unknown as { unstable_mockModule: (p: string, f: () => unknown) => void }).unstable_mockModule(
    '@/features/booking/data',
    () => ({
      getAppointmentType: jest.fn(async () => ({
        id: 'intro',
        name: 'Intro',
        durationMinutes: 30,
        isActive: true,
        createdAt: 0,
        updatedAt: 0,
      })),
    })
  )

  ;({ createBookingAction, clearRateLimiter } = await import('../actions'))
})

afterEach(() => {
  jest.clearAllMocks()
  clearRateLimiter()
})

describe('createBookingAction', () => {
  it('validates all required fields', async () => {
    await expect(
      createBookingAction({ ...validData, name: '' })
    ).rejects.toThrow()
  })

  it('checks calendar availability before booking', async () => {
    await createBookingAction(validData)
    expect(provider.listBusyTimes).toHaveBeenCalled()
    expect(provider.createAppointment).toHaveBeenCalled()
  })

  it('handles calendar connection errors gracefully', async () => {
    jest.resetModules()
    ;(jest as unknown as { unstable_mockModule: (p: string, f: () => unknown) => void }).unstable_mockModule(
      '@/infrastructure/database/integrations',
      () => ({
        getBookingCalendar: jest.fn(async () => null),
        createDAVClientFromIntegration: jest.fn(async () => ({})),
      })
    )
    const { createBookingAction: action } = await import('../actions')
    await expect(action(validData)).rejects.toThrow('No booking calendar configured')
  })

  it('enforces rate limiting per email', async () => {
    // First request should succeed
    await createBookingAction(validData)
    
    // Second request from same email should fail
    await expect(createBookingAction(validData)).rejects.toThrow('Too many booking attempts')
    
    // Different email should succeed
    await createBookingAction({ ...validData, email: 'different@example.com' })
  })

  it('cleans up old rate limit entries to prevent memory growth', async () => {
    // Create a booking to populate the rate limiter
    await createBookingAction(validData)
    
    // Mock Date.now to simulate time passing beyond cleanup threshold
    const originalDateNow = Date.now
    const mockNow = jest.fn()
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
})
