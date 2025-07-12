import { getDay } from 'date-fns';
import { loadAvailabilityTemplateAction } from '@/lib/services/availability';
import { type DayOfWeek } from '@/lib/schemas/availability';
import { timeZones, BUSINESS_HOURS } from '@/lib/constants';

// Re-export types and functions from the core module
export { 
  calculateAvailableSlots, 
  type BusyTime, 
  type BusinessHours, 
  type AvailabilityOptions 
} from './availability-core';

// Import the BusinessHours type for use in this file
import { type BusinessHours } from './availability-core';

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
        timeZone: timeZones.DEFAULT
      };
    }
    
    const dayAvailability = template[dayName];
    
    // If the day is not defined, return no availability
    if (!dayAvailability || !dayAvailability.enabled || dayAvailability.slots.length === 0) {
      return {
        start: BUSINESS_HOURS.DEFAULT_START,
        end: BUSINESS_HOURS.DEFAULT_START, // No availability
        timeZone: timeZones.DEFAULT
      };
    }
    
    // For now, use the first time slot as the business hours
    // In a more complex implementation, you might want to merge multiple slots
    const firstSlot = dayAvailability.slots[0];
    if (!firstSlot) {
      return {
        start: BUSINESS_HOURS.DEFAULT_START,
        end: BUSINESS_HOURS.DEFAULT_START, // No availability
        timeZone: timeZones.DEFAULT
      };
    }
    
    return {
      start: firstSlot.start,
      end: firstSlot.end,
      timeZone: timeZones.DEFAULT
    };
    
  } catch (error) {
    console.error('Error getting business hours for date:', error);
    // Fall back to default business hours on error
    return {
      start: BUSINESS_HOURS.DEFAULT_START,
      end: BUSINESS_HOURS.DEFAULT_END,
      timeZone: timeZones.DEFAULT
    };
  }
}