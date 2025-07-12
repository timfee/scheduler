import { Factory } from './base';
import { type BookingFormData } from '@/lib/schemas/booking';

/**
 * Factory for creating booking form data
 */
export const bookingFactory = Factory.define<BookingFormData>(() => ({
  type: 'intro',
  selectedDate: '2024-01-01',
  selectedTime: '10:00',
  name: 'Test User',
  email: 'test@example.com',
}));

/**
 * Factory for creating booking form data with common variations
 */
export const bookingVariants = {
  intro: () => bookingFactory.build({ type: 'intro' }),
  followUp: () => bookingFactory.build({ type: 'follow-up' }),
  consultation: () => bookingFactory.build({ type: 'consultation' }),
  withCustomTime: (selectedTime: string) => bookingFactory.build({ selectedTime }),
  withCustomDate: (selectedDate: string) => bookingFactory.build({ selectedDate }),
  withCustomEmail: (email: string) => bookingFactory.build({ email }),
};