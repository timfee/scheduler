import { describe, expect, it } from "@jest/globals";

import {
  validateAppointmentTypeDuration,
  validateAppointmentTypeId,
  validateAppointmentTypeName,
} from "../validation";

describe("Appointment Type Validation Utils", () => {
  describe("validateAppointmentTypeName", () => {
    it("should pass with valid name and return trimmed name", () => {
      expect(validateAppointmentTypeName("Valid Name")).toBe("Valid Name");
    });

    it("should pass with name containing spaces", () => {
      expect(validateAppointmentTypeName("Name with spaces")).toBe(
        "Name with spaces",
      );
    });

    it("should pass with name containing special characters", () => {
      expect(validateAppointmentTypeName("Name-with_special.chars")).toBe(
        "Name-with_special.chars",
      );
    });

    it("should pass with name that has leading/trailing spaces and return trimmed name", () => {
      expect(validateAppointmentTypeName("  Valid Name  ")).toBe("Valid Name");
    });

    it("should throw error with empty string", () => {
      expect(() => validateAppointmentTypeName("")).toThrow("Name is required");
    });

    it("should throw error with only whitespace", () => {
      expect(() => validateAppointmentTypeName("   ")).toThrow(
        "Name is required",
      );
    });

    it("should throw error with only tabs", () => {
      expect(() => validateAppointmentTypeName("\t\t")).toThrow(
        "Name is required",
      );
    });

    it("should throw error with only newlines", () => {
      expect(() => validateAppointmentTypeName("\n\n")).toThrow(
        "Name is required",
      );
    });

    it("should throw error with mixed whitespace", () => {
      expect(() => validateAppointmentTypeName(" \t\n ")).toThrow(
        "Name is required",
      );
    });
  });

  describe("validateAppointmentTypeDuration", () => {
    it("should pass with valid duration at minimum boundary", () => {
      expect(() => validateAppointmentTypeDuration(1)).not.toThrow();
    });

    it("should pass with valid duration at maximum boundary", () => {
      expect(() => validateAppointmentTypeDuration(480)).not.toThrow();
    });

    it("should pass with valid duration in middle range", () => {
      expect(() => validateAppointmentTypeDuration(30)).not.toThrow();
      expect(() => validateAppointmentTypeDuration(60)).not.toThrow();
      expect(() => validateAppointmentTypeDuration(120)).not.toThrow();
    });

    it("should throw error with duration less than 1", () => {
      expect(() => validateAppointmentTypeDuration(0)).toThrow(
        "Duration must be between 1 and 480 minutes",
      );
    });

    it("should throw error with negative duration", () => {
      expect(() => validateAppointmentTypeDuration(-1)).toThrow(
        "Duration must be between 1 and 480 minutes",
      );
      expect(() => validateAppointmentTypeDuration(-30)).toThrow(
        "Duration must be between 1 and 480 minutes",
      );
    });

    it("should throw error with duration greater than 480", () => {
      expect(() => validateAppointmentTypeDuration(481)).toThrow(
        "Duration must be between 1 and 480 minutes",
      );
      expect(() => validateAppointmentTypeDuration(500)).toThrow(
        "Duration must be between 1 and 480 minutes",
      );
    });

    it("should throw error with duration much greater than 480", () => {
      expect(() => validateAppointmentTypeDuration(1000)).toThrow(
        "Duration must be between 1 and 480 minutes",
      );
    });
  });

  describe("validateAppointmentTypeId", () => {
    it("should pass with valid UUID and return trimmed ID", () => {
      expect(
        validateAppointmentTypeId("550e8400-e29b-41d4-a716-446655440000"),
      ).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should pass with valid string ID", () => {
      expect(validateAppointmentTypeId("valid-id")).toBe("valid-id");
    });

    it("should pass with numeric string ID", () => {
      expect(validateAppointmentTypeId("12345")).toBe("12345");
    });

    it("should pass with alphanumeric ID", () => {
      expect(validateAppointmentTypeId("abc123")).toBe("abc123");
    });

    it("should pass with ID containing hyphens and underscores", () => {
      expect(validateAppointmentTypeId("test-id_123")).toBe("test-id_123");
    });

    it("should pass with ID that has leading/trailing spaces and return trimmed ID", () => {
      expect(validateAppointmentTypeId("  valid-id  ")).toBe("valid-id");
    });

    it("should throw error with empty string", () => {
      expect(() => validateAppointmentTypeId("")).toThrow("ID is required");
    });

    it("should throw error with only whitespace", () => {
      expect(() => validateAppointmentTypeId("   ")).toThrow("ID is required");
    });

    it("should throw error with only tabs", () => {
      expect(() => validateAppointmentTypeId("\t\t")).toThrow("ID is required");
    });

    it("should throw error with only newlines", () => {
      expect(() => validateAppointmentTypeId("\n\n")).toThrow("ID is required");
    });

    it("should throw error with mixed whitespace", () => {
      expect(() => validateAppointmentTypeId(" \t\n ")).toThrow(
        "ID is required",
      );
    });
  });
});
