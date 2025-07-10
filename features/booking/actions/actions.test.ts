import { beforeAll, afterEach, describe, expect, it, jest } from '@jest/globals'
import { type BookingFormData } from '../schemas/booking'

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */

let createBookingAction: (data: BookingFormData) => Promise<void>
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

  ;({ createBookingAction } = await import('../actions'))
})

afterEach(() => {
  jest.clearAllMocks()
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
})
