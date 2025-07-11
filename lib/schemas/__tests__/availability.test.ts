import { describe, it, expect } from "@jest/globals";
import { timeSlotSchema, dayAvailabilitySchema, weeklyAvailabilitySchema } from "@/lib/schemas/availability";

describe("Availability Schema", () => {
  describe("timeSlotSchema", () => {
    it("should validate valid time slots", () => {
      const validSlot = { start: "09:00", end: "17:00" };
      expect(() => timeSlotSchema.parse(validSlot)).not.toThrow();
    });

    it("should accept single digit hours", () => {
      const validSlot = { start: "9:00", end: "17:00" };
      expect(() => timeSlotSchema.parse(validSlot)).not.toThrow();
    });

    it("should reject invalid time formats", () => {
      const invalidSlot = { start: "9", end: "17:00" };
      expect(() => timeSlotSchema.parse(invalidSlot)).toThrow();
    });

    it("should reject invalid time values", () => {
      const invalidSlot = { start: "25:00", end: "17:00" };
      expect(() => timeSlotSchema.parse(invalidSlot)).toThrow();
    });
  });

  describe("dayAvailabilitySchema", () => {
    it("should validate valid day availability", () => {
      const validDay = {
        enabled: true,
        slots: [{ start: "09:00", end: "17:00" }]
      };
      expect(() => dayAvailabilitySchema.parse(validDay)).not.toThrow();
    });

    it("should accept empty slots for disabled days", () => {
      const validDay = {
        enabled: false,
        slots: []
      };
      expect(() => dayAvailabilitySchema.parse(validDay)).not.toThrow();
    });
  });

  describe("weeklyAvailabilitySchema", () => {
    it("should validate complete weekly availability", () => {
      const validWeek = {
        monday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
        tuesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
        wednesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
        thursday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
        friday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
        saturday: { enabled: false, slots: [] },
        sunday: { enabled: false, slots: [] }
      };
      expect(() => weeklyAvailabilitySchema.parse(validWeek)).not.toThrow();
    });

    it("should reject incomplete weekly availability", () => {
      const invalidWeek = {
        monday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
        // Missing other days
      };
      expect(() => weeklyAvailabilitySchema.parse(invalidWeek)).toThrow();
    });
  });
});