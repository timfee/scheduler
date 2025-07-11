import { addMinutes, format } from 'date-fns'

/**
 * Test timezone functionality for business hours
 */
describe('Business Hours Timezone Handling', () => {
  it('should generate business hours in local timezone', () => {
    const date = new Date('2024-01-15')
    const dateStr = format(date, 'yyyy-MM-dd')
    
    // Create business hours in the user's local timezone (9 AM to 5 PM)
    const businessStart = new Date(`${dateStr}T09:00:00`)
    const businessEnd = new Date(`${dateStr}T17:00:00`)
    
    expect(businessStart.getHours()).toBe(9)
    expect(businessEnd.getHours()).toBe(17)
  })

  it('should convert local time to UTC for comparison', () => {
    const date = new Date('2024-01-15')
    const dateStr = format(date, 'yyyy-MM-dd')
    
    // Create a local time
    const localTime = new Date(`${dateStr}T09:00:00`)
    
    // Convert to UTC
    const utcTime = new Date(localTime.getTime() - (localTime.getTimezoneOffset() * 60000))
    
    // Verify correct UTC conversion by checking hour difference matches timezone offset
    const expectedHourDifference = localTime.getTimezoneOffset() / 60
    const actualHourDifference = utcTime.getHours() - localTime.getHours()
    expect(actualHourDifference).toBe(expectedHourDifference)
  })

  it('should format time slots correctly', () => {
    const date = new Date('2024-01-15')
    const dateStr = format(date, 'yyyy-MM-dd')
    
    const businessStart = new Date(`${dateStr}T09:00:00`)
    const slots = []
    
    for (let t = businessStart; t < addMinutes(businessStart, 60); t = addMinutes(t, 30)) {
      slots.push(format(t, 'HH:mm'))
    }
    
    expect(slots).toEqual(['09:00', '09:30'])
  })
})