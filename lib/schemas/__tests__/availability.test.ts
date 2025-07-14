import { BUSINESS_HOURS } from "@/lib/constants";
import {
  dayAvailabilitySchema,
  timeSlotSchema,
  weeklyAvailabilitySchema,
} from "@/lib/schemas/availability";
import { describe, expect, it } from "@jest/globals";

describe("Availability Schema", () => {
  describe("timeSlotSchema", () => {
    it("should validate valid time slots", () => {
      const validSlot = {
        start: BUSINESS_HOURS.DEFAULT_START,
        end: BUSINESS_HOURS.DEFAULT_END,
      };
      expect(() => timeSlotSchema.parse(validSlot)).not.toThrow();
    });

    it("should accept single digit hours", () => {
      const validSlot = { start: "9:00", end: BUSINESS_HOURS.DEFAULT_END };
      expect(() => timeSlotSchema.parse(validSlot)).not.toThrow();
    });

    it("should reject invalid time formats", () => {
      const invalidSlot = { start: "9", end: BUSINESS_HOURS.DEFAULT_END };
      expect(() => timeSlotSchema.parse(invalidSlot)).toThrow();
    });

    it("should reject invalid time values", () => {
      const invalidSlot = { start: "25:00", end: BUSINESS_HOURS.DEFAULT_END };
      expect(() => timeSlotSchema.parse(invalidSlot)).toThrow();
    });
  });

  describe("dayAvailabilitySchema", () => {
    it("should validate valid day availability", () => {
      const validDay = {
        enabled: true,
        slots: [
          {
            start: BUSINESS_HOURS.DEFAULT_START,
            end: BUSINESS_HOURS.DEFAULT_END,
          },
        ],
      };
      expect(() => dayAvailabilitySchema.parse(validDay)).not.toThrow();
    });

    it("should accept empty slots for disabled days", () => {
      const validDay = {
        enabled: false,
        slots: [],
      };
      expect(() => dayAvailabilitySchema.parse(validDay)).not.toThrow();
    });
  });

  describe("weeklyAvailabilitySchema", () => {
    it("should validate complete weekly availability", () => {
      const validWeek = {
        monday: {
          enabled: true,
          slots: [{ start: "09:00", end: BUSINESS_HOURS.DEFAULT_END }],
        },
        tuesday: {
          enabled: true,
          slots: [{ start: "09:00", end: BUSINESS_HOURS.DEFAULT_END }],
        },
        wednesday: {
          enabled: true,
          slots: [{ start: "09:00", end: BUSINESS_HOURS.DEFAULT_END }],
        },
        thursday: {
          enabled: true,
          slots: [{ start: "09:00", end: BUSINESS_HOURS.DEFAULT_END }],
        },
        friday: {
          enabled: true,
          slots: [{ start: "09:00", end: BUSINESS_HOURS.DEFAULT_END }],
        },
        saturday: { enabled: false, slots: [] },
        sunday: { enabled: false, slots: [] },
      };
      expect(() => weeklyAvailabilitySchema.parse(validWeek)).not.toThrow();
    });

    it("should reject incomplete weekly availability", () => {
      const invalidWeek = {
        monday: {
          enabled: true,
          slots: [{ start: "09:00", end: BUSINESS_HOURS.DEFAULT_END }],
        },
        // Missing other days
      };
      expect(() => weeklyAvailabilitySchema.parse(invalidWeek)).toThrow();
    });
  });
});
