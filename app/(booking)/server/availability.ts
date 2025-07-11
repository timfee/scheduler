import { addMinutes, format, getDay, set } from 'date-fns';
import { loadAvailabilityTemplateAction } from '@/app/admin/availability/server/actions';
import { type DayOfWeek } from '@/lib/schemas/availability';
import { TIMEZONES, BUSINESS_HOURS } from '@/lib/constants';

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
  
  // Create business hours in the user's local timezone
  const startParts = businessHours.start.split(':');
  const endParts = businessHours.end.split(':');
  
  const businessStart = set(new Date(date), { 
    hours: parseInt(startParts[0] ?? '0'), 
    minutes: parseInt(startParts[1] ?? '0') 
  });
  const businessEnd = set(new Date(date), { 
    hours: parseInt(endParts[0] ?? '0'), 
    minutes: parseInt(endParts[1] ?? '0') 
  });
  
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
 * Get business hours for a specific date based on the availability template
 */
export async function getBusinessHoursForDate(date: string): Promise<BusinessHours> {
  try {
    // Parse the date to get the day of week
    const dateObj = new Date(date);
    const dayOfWeek = getDay(dateObj); // 0 = Sunday, 1 = Monday, etc.
    
    // Map JavaScript day numbers to our day names
    const dayMapping: Record<number, DayOfWeek> = {
      0: 'sunday',
      1: 'monday', 
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };
    
    const dayName = dayMapping[dayOfWeek];
    if (!dayName) {
      throw new Error(`Invalid day of week: ${dayOfWeek}`);
    }
    
    // Load the availability template
    const template = await loadAvailabilityTemplateAction();
    
    if (!template) {
      // Fall back to default business hours if no template is configured
      return {
        start: BUSINESS_HOURS.DEFAULT_START,
        end: BUSINESS_HOURS.DEFAULT_END,
        timezone: TIMEZONES.DEFAULT
      };
    }
    
    const dayAvailability = template[dayName];
    
    // If the day is not defined, return no availability
    if (!dayAvailability || !dayAvailability.enabled || dayAvailability.slots.length === 0) {
      return {
        start: BUSINESS_HOURS.DEFAULT_START,
        end: BUSINESS_HOURS.DEFAULT_START, // No availability
        timezone: TIMEZONES.DEFAULT
      };
    }
    
    // For now, use the first time slot as the business hours
    // In a more complex implementation, you might want to merge multiple slots
    const firstSlot = dayAvailability.slots[0];
    if (!firstSlot) {
      return {
        start: BUSINESS_HOURS.DEFAULT_START,
        end: BUSINESS_HOURS.DEFAULT_START, // No availability
        timezone: TIMEZONES.DEFAULT
      };
    }
    
    return {
      start: firstSlot.start,
      end: firstSlot.end,
      timezone: TIMEZONES.DEFAULT
    };
    
  } catch (error) {
    console.error('Error getting business hours for date:', error);
    // Fall back to default business hours on error
    return {
      start: BUSINESS_HOURS.DEFAULT_START,
      end: BUSINESS_HOURS.DEFAULT_END,
      timezone: TIMEZONES.DEFAULT
    };
  }
}