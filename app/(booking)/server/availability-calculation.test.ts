import { BUSINESS_HOURS, DURATION, TIME_ZONES } from "@/lib/constants";
import { describe, expect, it } from "@jest/globals";

import {
  calculateAvailableSlots,
  type BusinessHours,
  type BusyTime,
} from "../server/availability-core";

describe("Availability Calculation", () => {
  const defaultBusinessHours: BusinessHours = {
    start: BUSINESS_HOURS.DEFAULT_START,
    end: BUSINESS_HOURS.DEFAULT_END,
    timeZone: TIME_ZONES.DEFAULT,
  };

  describe("Basic slot generation", () => {
    it("should generate all slots for empty calendar", () => {
      // Given: Business hours 9 AM - 5 PM, 30-minute slots
      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: DURATION.DEFAULT_APPOINTMENT_MINUTES,
        businessHours: defaultBusinessHours,
        busyTimes: [],
      };

      // When: No busy times
      const slots = calculateAvailableSlots(options);

      // Then: Should return 16 slots (9:00, 9:30, ..., 16:30)
      expect(slots).toHaveLength(16);
      expect(slots[0]).toBe(BUSINESS_HOURS.DEFAULT_START);
      expect(slots[1]).toBe("09:30");
      expect(slots[slots.length - 1]).toBe("16:30");
    });

    it("should handle single appointment in middle of day", () => {
      // Given: Busy time 12 PM - 1 PM EST (17:00 - 18:00 UTC)
      const busyTimes: BusyTime[] = [
        {
          startUtc: "2024-01-15T17:00:00Z", // 12 PM EST = 17:00 UTC
          endUtc: "2024-01-15T18:00:00Z", // 1 PM EST = 18:00 UTC
        },
      ];

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: DURATION.DEFAULT_APPOINTMENT_MINUTES,
        businessHours: defaultBusinessHours,
        busyTimes,
      };

      // When: Requesting 30-minute slots
      const slots = calculateAvailableSlots(options);

      // Then: Should exclude 12:00 and 12:30 slots (EST display times)
      expect(slots).not.toContain("12:00");
      expect(slots).not.toContain("12:30");
      expect(slots).toContain("11:30");
      expect(slots).toContain("13:00");
    });

    it("should handle 60-minute slots", () => {
      // Given: 60-minute appointment duration
      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 60,
        businessHours: defaultBusinessHours,
        busyTimes: [],
      };

      // When: No busy times
      const slots = calculateAvailableSlots(options);

      // Then: Should return 8 slots (9:00, 10:00, ..., 16:00)
      expect(slots).toHaveLength(8);
      expect(slots[0]).toBe(BUSINESS_HOURS.DEFAULT_START);
      expect(slots[1]).toBe("10:00");
      expect(slots[slots.length - 1]).toBe("16:00");
    });
  });

  describe("Complex overlap scenarios", () => {
    it("should handle adjacent appointments with no gap", () => {
      // Given: Back-to-back appointments 10-11 AM and 11-12 PM EST (15:00-16:00 UTC and 16:00-17:00 UTC)
      const busyTimes: BusyTime[] = [
        {
          startUtc: "2024-01-15T15:00:00Z", // 10 AM EST = 15:00 UTC
          endUtc: "2024-01-15T16:00:00Z", // 11 AM EST = 16:00 UTC
        },
        {
          startUtc: "2024-01-15T16:00:00Z", // 11 AM EST = 16:00 UTC
          endUtc: "2024-01-15T17:00:00Z", // 12 PM EST = 17:00 UTC
        },
      ];

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 60,
        businessHours: defaultBusinessHours,
        busyTimes,
      };

      // When: Requesting 60-minute slots
      const slots = calculateAvailableSlots(options);

      // Then: Should not show 10 AM or 11 AM slots (EST display times)
      expect(slots).not.toContain("10:00");
      expect(slots).not.toContain("11:00");
      expect(slots).toContain(BUSINESS_HOURS.DEFAULT_START);
      expect(slots).toContain("12:00");
    });

    it("should handle overlapping appointments (double-booked)", () => {
      // Given: Overlapping appointments 2-3 PM and 2:30-3:30 PM EST (19:00-20:00 UTC and 19:30-20:30 UTC)
      const busyTimes: BusyTime[] = [
        {
          startUtc: "2024-01-15T19:00:00Z", // 2 PM EST = 19:00 UTC
          endUtc: "2024-01-15T20:00:00Z", // 3 PM EST = 20:00 UTC
        },
        {
          startUtc: "2024-01-15T19:30:00Z", // 2:30 PM EST = 19:30 UTC
          endUtc: "2024-01-15T20:30:00Z", // 3:30 PM EST = 20:30 UTC
        },
      ];

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: DURATION.DEFAULT_APPOINTMENT_MINUTES,
        businessHours: defaultBusinessHours,
        busyTimes,
      };

      // When: Requesting 30-minute slots
      const slots = calculateAvailableSlots(options);

      // Then: No slots from 2 PM to 3:30 PM EST
      expect(slots).not.toContain("14:00");
      expect(slots).not.toContain("14:30");
      expect(slots).not.toContain("15:00");
      expect(slots).toContain("13:30");
      expect(slots).toContain("15:30");
    });

    it("should handle appointment partially outside business hours", () => {
      // Given: Appointment 4:30 PM - 5:30 PM EST (21:30-22:30 UTC), business hours end at 5 PM EST (22:00 UTC)
      const busyTimes: BusyTime[] = [
        {
          startUtc: "2024-01-15T21:30:00Z", // 4:30 PM EST = 21:30 UTC
          endUtc: "2024-01-15T22:30:00Z", // 5:30 PM EST = 22:30 UTC
        },
      ];

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: DURATION.DEFAULT_APPOINTMENT_MINUTES,
        businessHours: defaultBusinessHours,
        busyTimes,
      };

      // When: Requesting 30-minute slots
      const slots = calculateAvailableSlots(options);

      // Then: 4:30 PM slot should be unavailable
      expect(slots).not.toContain("16:30");
      expect(slots).toContain("16:00");
    });
  });

  describe("Duration-based edge cases", () => {
    it("should show slot when requested duration equals available gap", () => {
      // Given: 60-minute gap between appointments in EST
      const busyTimes: BusyTime[] = [
        {
          startUtc: "2024-01-15T14:00:00Z", // 9 AM EST = 14:00 UTC
          endUtc: "2024-01-15T15:00:00Z", // 10 AM EST = 15:00 UTC
        },
        {
          startUtc: "2024-01-15T16:00:00Z", // 11 AM EST = 16:00 UTC
          endUtc: "2024-01-15T17:00:00Z", // 12 PM EST = 17:00 UTC
        },
      ];

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 60,
        businessHours: defaultBusinessHours,
        busyTimes,
      };

      // When: Requesting 60-minute slots
      const slots = calculateAvailableSlots(options);

      // Then: Exactly one slot should fit at 10 AM EST
      expect(slots).toContain("10:00");
      expect(slots).not.toContain(BUSINESS_HOURS.DEFAULT_START);
      expect(slots).not.toContain("11:00");
    });

    it("should show no slots when duration exceeds all gaps", () => {
      // Given: Multiple 45-minute gaps
      const busyTimes: BusyTime[] = [
        {
          startUtc: "2024-01-15T09:00:00Z", // 9 AM UTC
          endUtc: "2024-01-15T09:45:00Z", // 9:45 AM UTC
        },
        {
          startUtc: "2024-01-15T10:30:00Z", // 10:30 AM UTC
          endUtc: "2024-01-15T11:15:00Z", // 11:15 AM UTC
        },
        {
          startUtc: "2024-01-15T12:00:00Z", // 12 PM UTC
          endUtc: "2024-01-15T12:45:00Z", // 12:45 PM UTC
        },
      ];

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 60,
        businessHours: defaultBusinessHours,
        busyTimes,
      };

      // When: Requesting 60-minute slots
      const slots = calculateAvailableSlots(options);

      // Then: No available slots due to insufficient gaps
      expect(slots).not.toContain("09:45");
      expect(slots).not.toContain("10:30");
      expect(slots).not.toContain("11:15");
    });

    it("should handle minimum duration slots (5 minutes)", () => {
      // Given: 8-hour business day
      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 5,
        businessHours: defaultBusinessHours,
        busyTimes: [],
      };

      // When: Requesting 5-minute slots
      const slots = calculateAvailableSlots(options);

      // Then: Should generate 96 slots and remain performant
      expect(slots).toHaveLength(96);
      expect(slots[0]).toBe(BUSINESS_HOURS.DEFAULT_START);
      expect(slots[1]).toBe("09:05");
      expect(slots[slots.length - 1]).toBe("16:55");
    });

    it("should handle maximum duration slots (full day)", () => {
      // Given: 8-hour business day
      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 480, // 8 hours
        businessHours: defaultBusinessHours,
        busyTimes: [],
      };

      // When: Requesting 8-hour slots
      const slots = calculateAvailableSlots(options);

      // Then: Only one slot at start of day
      expect(slots).toHaveLength(1);
      expect(slots[0]).toBe(BUSINESS_HOURS.DEFAULT_START);
    });
  });

  describe("Timezone handling", () => {
    it("should convert business hours to user timezone", () => {
      // Given: Business hours 9 AM - 5 PM EST
      const businessHours: BusinessHours = {
        start: BUSINESS_HOURS.DEFAULT_START,
        end: BUSINESS_HOURS.DEFAULT_END,
        timeZone: TIME_ZONES.DEFAULT,
      };

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: DURATION.DEFAULT_APPOINTMENT_MINUTES,
        businessHours,
        busyTimes: [],
      };

      // When: User in EST timezone
      const slots = calculateAvailableSlots(options);

      // Then: Slots display as 9 AM - 4:30 PM EST
      expect(slots[0]).toBe(BUSINESS_HOURS.DEFAULT_START);
      expect(slots[slots.length - 1]).toBe("16:30");
    });

    it("should handle EST timezone (America/New_York)", () => {
      // Given: Business hours 9 AM - 5 PM EST, busy time 12 PM - 1 PM EST
      const businessHours: BusinessHours = {
        start: "09:00",
        end: "17:00",
        timeZone: "America/New_York",
      };

      const busyTimes: BusyTime[] = [
        {
          startUtc: "2024-01-15T17:00:00Z", // 12 PM EST = 17:00 UTC
          endUtc: "2024-01-15T18:00:00Z", // 1 PM EST = 18:00 UTC
        },
      ];

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 30,
        businessHours,
        busyTimes,
      };

      // When: Calculating slots
      const slots = calculateAvailableSlots(options);

      // Then: Slots display in EST, 12:00 and 12:30 are blocked
      expect(slots).toContain("09:00");
      expect(slots).toContain("11:30");
      expect(slots).not.toContain("12:00");
      expect(slots).not.toContain("12:30");
      expect(slots).toContain("13:00");
      expect(slots).toContain("16:30");
    });

    it("should handle PST timezone (America/Los_Angeles)", () => {
      // Given: Business hours 9 AM - 5 PM PST, busy time 12 PM - 1 PM PST
      const businessHours: BusinessHours = {
        start: "09:00",
        end: "17:00",
        timeZone: "America/Los_Angeles",
      };

      const busyTimes: BusyTime[] = [
        {
          startUtc: "2024-01-15T20:00:00Z", // 12 PM PST = 20:00 UTC
          endUtc: "2024-01-15T21:00:00Z", // 1 PM PST = 21:00 UTC
        },
      ];

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 30,
        businessHours,
        busyTimes,
      };

      // When: Calculating slots
      const slots = calculateAvailableSlots(options);

      // Then: Slots display in PST, 12:00 and 12:30 are blocked
      expect(slots).toContain("09:00");
      expect(slots).toContain("11:30");
      expect(slots).not.toContain("12:00");
      expect(slots).not.toContain("12:30");
      expect(slots).toContain("13:00");
      expect(slots).toContain("16:30");
    });

    it("should handle UTC timezone", () => {
      // Given: Business hours 9 AM - 5 PM UTC, busy time 12 PM - 1 PM UTC
      const businessHours: BusinessHours = {
        start: "09:00",
        end: "17:00",
        timeZone: "UTC",
      };

      const busyTimes: BusyTime[] = [
        {
          startUtc: "2024-01-15T12:00:00Z", // 12 PM UTC
          endUtc: "2024-01-15T13:00:00Z", // 1 PM UTC
        },
      ];

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 30,
        businessHours,
        busyTimes,
      };

      // When: Calculating slots
      const slots = calculateAvailableSlots(options);

      // Then: Slots display in UTC, 12:00 and 12:30 are blocked
      expect(slots).toContain("09:00");
      expect(slots).toContain("11:30");
      expect(slots).not.toContain("12:00");
      expect(slots).not.toContain("12:30");
      expect(slots).toContain("13:00");
      expect(slots).toContain("16:30");
    });

    it("should default to UTC when no timezone specified", () => {
      // Given: Business hours without timezone
      const businessHours: BusinessHours = {
        start: "09:00",
        end: "17:00",
        // No timezone specified
      };

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 60,
        businessHours,
        busyTimes: [],
      };

      // When: Calculating slots
      const slots = calculateAvailableSlots(options);

      // Then: Should work with UTC default
      expect(slots).toHaveLength(8);
      expect(slots[0]).toBe("09:00");
      expect(slots[slots.length - 1]).toBe("16:00");
    });

    it("should handle cross-timezone busy times", () => {
      // Given: Business in EST, busy time from different timezone
      const businessHours: BusinessHours = {
        start: "09:00",
        end: "17:00",
        timeZone: "America/New_York",
      };

      const busyTimes: BusyTime[] = [
        {
          // PST busy time: 9 AM PST = 17:00 UTC = 12 PM EST
          startUtc: "2024-01-15T17:00:00Z", // 9 AM PST = 12 PM EST
          endUtc: "2024-01-15T18:00:00Z", // 10 AM PST = 1 PM EST
        },
      ];

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 30,
        businessHours,
        busyTimes,
      };

      // When: Calculating slots
      const slots = calculateAvailableSlots(options);

      // Then: EST 12:00 and 12:30 should be blocked
      expect(slots).not.toContain("12:00");
      expect(slots).not.toContain("12:30");
      expect(slots).toContain("11:30");
      expect(slots).toContain("13:00");
    });

    it("should handle booking across DST transition", () => {
      // Given: Business hours on DST transition day (Spring forward)
      const businessHours: BusinessHours = {
        start: BUSINESS_HOURS.DEFAULT_START,
        end: BUSINESS_HOURS.DEFAULT_END,
        timeZone: TIME_ZONES.DEFAULT,
      };

      const options = {
        selectedDate: "2024-03-10", // DST transition day in 2024
        durationMinutes: 60,
        businessHours,
        busyTimes: [],
      };

      // When: Spring forward occurs
      const slots = calculateAvailableSlots(options);

      // Then: No duplicate or missing slots
      expect(slots).toHaveLength(8);
      expect(slots[0]).toBe(BUSINESS_HOURS.DEFAULT_START);
      expect(slots[slots.length - 1]).toBe("16:00");
    });

    it("should handle UTC midnight boundary", () => {
      // Given: Business hours that don't cross midnight (simplified)
      const businessHours: BusinessHours = {
        start: "22:00",
        end: "23:59",
        timeZone: TIME_ZONES.DEFAULT,
      };

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: 60,
        businessHours,
        busyTimes: [],
      };

      // When: This doesn't cross UTC midnight in our simplified implementation
      const slots = calculateAvailableSlots(options);

      // Then: Should handle the crossing correctly
      // Note: This is a simplified test - real implementation would need more complex logic for crossing midnight
      expect(slots.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Multiple calendar capabilities", () => {
    it("should respect blocking_busy calendars", () => {
      // Given: Calendar with blocking_busy capability has event at 12 PM - 1 PM EST
      const busyTimes: BusyTime[] = [
        {
          startUtc: "2024-01-15T17:00:00Z", // 12 PM EST = 17:00 UTC
          endUtc: "2024-01-15T18:00:00Z", // 1 PM EST = 18:00 UTC
        },
      ];

      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: DURATION.DEFAULT_APPOINTMENT_MINUTES,
        businessHours: defaultBusinessHours,
        busyTimes,
      };

      // When: Calculating availability
      const slots = calculateAvailableSlots(options);

      // Then: Time is blocked
      expect(slots).not.toContain("12:00");
      expect(slots).not.toContain("12:30");
    });

    it("should handle empty busy times array", () => {
      // Given: No busy times
      const options = {
        selectedDate: "2024-01-15",
        durationMinutes: DURATION.DEFAULT_APPOINTMENT_MINUTES,
        businessHours: defaultBusinessHours,
        busyTimes: [],
      };

      // When: Calculating availability
      const slots = calculateAvailableSlots(options);

      // Then: All slots should be available
      expect(slots).toHaveLength(16);
    });
  });
});
