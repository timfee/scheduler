import { describe, it, expect } from '@jest/globals';
import { calculateAvailableSlots, type BusyTime, type BusinessHours } from '../_server/availability';

describe('Timezone-aware Availability Calculation', () => {
  describe('EST timezone (America/New_York)', () => {
    const businessHours: BusinessHours = {
      start: '09:00',
      end: '17:00',
      timezone: 'America/New_York'
    };

    it('should correctly convert EST business hours to UTC', () => {
      // Given: Business hours 9 AM - 5 PM EST on January 15, 2024
      const options = {
        date: '2024-01-15',
        durationMinutes: 60,
        businessHours,
        busyTimes: []
      };

      // When: No busy times
      const slots = calculateAvailableSlots(options);

      // Then: Should return 8 slots (9 AM - 4 PM EST)
      expect(slots).toHaveLength(8);
      expect(slots[0]).toBe('09:00');
      expect(slots[slots.length - 1]).toBe('16:00');
    });

    it('should handle busy times correctly with EST timezone', () => {
      // Given: Busy time 12 PM EST (17:00 UTC)
      const busyTimes: BusyTime[] = [
        {
          startUtc: '2024-01-15T17:00:00Z', // 12 PM EST
          endUtc: '2024-01-15T18:00:00Z'   // 1 PM EST
        }
      ];

      const options = {
        date: '2024-01-15',
        durationMinutes: 60,
        businessHours,
        busyTimes
      };

      // When: Requesting 60-minute slots
      const slots = calculateAvailableSlots(options);

      // Then: Should exclude 12 PM EST slot but include others
      expect(slots).not.toContain('12:00');
      expect(slots).toContain('11:00');
      expect(slots).toContain('13:00');
    });

    it('should handle DST transition correctly', () => {
      // Given: DST transition day (March 10, 2024 - Spring forward)
      const businessHoursSpring: BusinessHours = {
        start: '09:00',
        end: '17:00',
        timezone: 'America/New_York'
      };

      const options = {
        date: '2024-03-10',
        durationMinutes: 60,
        businessHours: businessHoursSpring,
        busyTimes: []
      };

      // When: No busy times
      const slots = calculateAvailableSlots(options);

      // Then: Should still return 8 slots despite DST transition
      expect(slots).toHaveLength(8);
      expect(slots[0]).toBe('09:00');
      expect(slots[slots.length - 1]).toBe('16:00');
    });
  });

  describe('PST timezone (America/Los_Angeles)', () => {
    const businessHours: BusinessHours = {
      start: '09:00',
      end: '17:00',
      timezone: 'America/Los_Angeles'
    };

    it('should correctly convert PST business hours to UTC', () => {
      // Given: Business hours 9 AM - 5 PM PST on January 15, 2024
      const options = {
        date: '2024-01-15',
        durationMinutes: 60,
        businessHours,
        busyTimes: []
      };

      // When: No busy times
      const slots = calculateAvailableSlots(options);

      // Then: Should return 8 slots (9 AM - 4 PM PST)
      expect(slots).toHaveLength(8);
      expect(slots[0]).toBe('09:00');
      expect(slots[slots.length - 1]).toBe('16:00');
    });

    it('should handle busy times correctly with PST timezone', () => {
      // Given: Busy time 12 PM PST (20:00 UTC)
      const busyTimes: BusyTime[] = [
        {
          startUtc: '2024-01-15T20:00:00Z', // 12 PM PST
          endUtc: '2024-01-15T21:00:00Z'   // 1 PM PST
        }
      ];

      const options = {
        date: '2024-01-15',
        durationMinutes: 60,
        businessHours,
        busyTimes
      };

      // When: Requesting 60-minute slots
      const slots = calculateAvailableSlots(options);

      // Then: Should exclude 12 PM PST slot but include others
      expect(slots).not.toContain('12:00');
      expect(slots).toContain('11:00');
      expect(slots).toContain('13:00');
    });
  });

  describe('UTC timezone', () => {
    const businessHours: BusinessHours = {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC'
    };

    it('should handle UTC timezone correctly', () => {
      // Given: Business hours 9 AM - 5 PM UTC
      const options = {
        date: '2024-01-15',
        durationMinutes: 60,
        businessHours,
        busyTimes: []
      };

      // When: No busy times
      const slots = calculateAvailableSlots(options);

      // Then: Should return 8 slots (9 AM - 4 PM UTC)
      expect(slots).toHaveLength(8);
      expect(slots[0]).toBe('09:00');
      expect(slots[slots.length - 1]).toBe('16:00');
    });

    it('should handle busy times correctly with UTC timezone', () => {
      // Given: Busy time 12 PM UTC
      const busyTimes: BusyTime[] = [
        {
          startUtc: '2024-01-15T12:00:00Z', // 12 PM UTC
          endUtc: '2024-01-15T13:00:00Z'   // 1 PM UTC
        }
      ];

      const options = {
        date: '2024-01-15',
        durationMinutes: 60,
        businessHours,
        busyTimes
      };

      // When: Requesting 60-minute slots
      const slots = calculateAvailableSlots(options);

      // Then: Should exclude 12 PM UTC slot but include others
      expect(slots).not.toContain('12:00');
      expect(slots).toContain('11:00');
      expect(slots).toContain('13:00');
    });
  });

  describe('Default timezone fallback', () => {
    it('should use UTC when no timezone is specified', () => {
      // Given: Business hours without timezone
      const businessHours: BusinessHours = {
        start: '09:00',
        end: '17:00'
        // No timezone specified
      };

      const options = {
        date: '2024-01-15',
        durationMinutes: 60,
        businessHours,
        busyTimes: []
      };

      // When: No busy times
      const slots = calculateAvailableSlots(options);

      // Then: Should return 8 slots (treated as UTC)
      expect(slots).toHaveLength(8);
      expect(slots[0]).toBe('09:00');
      expect(slots[slots.length - 1]).toBe('16:00');
    });
  });

  describe('Cross-timezone busy time handling', () => {
    it('should correctly handle busy times when business is in different timezone', () => {
      // Given: Business in EST, busy time in different timezone
      const businessHours: BusinessHours = {
        start: '09:00',
        end: '17:00',
        timezone: 'America/New_York'
      };

      // Busy time from 9 AM EST (14:00 UTC) to 10 AM EST (15:00 UTC)
      const busyTimes: BusyTime[] = [
        {
          startUtc: '2024-01-15T14:00:00Z', // 9 AM EST
          endUtc: '2024-01-15T15:00:00Z'   // 10 AM EST
        }
      ];

      const options = {
        date: '2024-01-15',
        durationMinutes: 60,
        businessHours,
        busyTimes
      };

      // When: Requesting 60-minute slots
      const slots = calculateAvailableSlots(options);

      // Then: Should exclude 9 AM EST slot but include others
      expect(slots).not.toContain('09:00');
      expect(slots).toContain('10:00');
      expect(slots).toContain('11:00');
    });
  });
});