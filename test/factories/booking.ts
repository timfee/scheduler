import { Factory } from './base';
import { type BookingFormData } from '@/app/(booking)/schemas/booking';

/**
 * Factory for creating booking form data
 */
export const bookingFactory = Factory.define<BookingFormData>(() => ({
  type: 'intro',
  date: '2024-01-01',
  time: '10:00',
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
  withCustomTime: (time: string) => bookingFactory.build({ time }),
  withCustomDate: (date: string) => bookingFactory.build({ date }),
  withCustomEmail: (email: string) => bookingFactory.build({ email }),
};