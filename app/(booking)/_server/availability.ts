import { addMinutes, format } from 'date-fns';

export interface BusyTime {
  startUtc: string;
  endUtc: string;
}

export interface BusinessHours {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  timezone?: string;
}

export interface AvailabilityOptions {
  date: string; // YYYY-MM-DD format
  durationMinutes: number;
  businessHours: BusinessHours;
  busyTimes: BusyTime[];
}

/**
 * Calculate available booking slots for a given date and duration
 */
export function calculateAvailableSlots(options: AvailabilityOptions): string[] {
  const { date, durationMinutes, businessHours, busyTimes } = options;
  
  // Parse business hours
  const [startHour, startMinute] = businessHours.start.split(':').map(Number);
  const [endHour, endMinute] = businessHours.end.split(':').map(Number);
  
  // Create business hours in the user's local timezone
  const businessStart = new Date(`${date}T${businessHours.start}:00`);
  const businessEnd = new Date(`${date}T${businessHours.end}:00`);
  
  const availableSlots: string[] = [];
  
  // Generate all possible slots
  for (
    let t = businessStart;
    t < businessEnd;
    t = addMinutes(t, durationMinutes)
  ) {
    const slotStart = t;
    const slotEnd = addMinutes(slotStart, durationMinutes);
    
    // Don't create slots that extend beyond business hours
    if (slotEnd > businessEnd) {
      break;
    }
    
    // Convert slot times to UTC for comparison with busy times
    // Since busy times are in UTC, we need to convert local slot times to UTC
    const slotStartUTC = slotStart.toISOString().replace(/\.000Z$/, 'Z');
    const slotEndUTC = slotEnd.toISOString().replace(/\.000Z$/, 'Z');
    
    // Check if slot overlaps with any busy time
    const hasOverlap = busyTimes.some((busy) => {
      const busyStart = busy.startUtc;
      const busyEnd = busy.endUtc;
      
      // Check for overlap: slot starts before busy ends AND slot ends after busy starts
      return slotStartUTC < busyEnd && slotEndUTC > busyStart;
    });
    
    if (!hasOverlap) {
      // Display time in user's local timezone
      availableSlots.push(format(slotStart, 'HH:mm'));
    }
  }
  
  return availableSlots;
}

/**
 * Get business hours for a specific date
 * In a real implementation, this would check the availability template
 */
export function getBusinessHoursForDate(date: string): BusinessHours {
  // Default business hours - in a real app this would come from the availability template
  return {
    start: '09:00',
    end: '17:00',
    timezone: 'America/New_York'
  };
}