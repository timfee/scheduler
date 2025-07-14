import { formatDateForBooking } from "../utils";

describe("formatDateForBooking", () => {
  it("formats a valid date to YYYY-MM-DD format", () => {
    const date = new Date("2024-01-15T10:30:00Z");
    expect(formatDateForBooking(date)).toBe("2024-01-15");
  });

  it("formats a date with timezone to YYYY-MM-DD format", () => {
    const date = new Date("2024-12-25T23:59:59-05:00");
    expect(formatDateForBooking(date)).toBe("2024-12-26");
  });

  it("handles leap year date correctly", () => {
    const date = new Date("2024-02-29T12:00:00Z");
    expect(formatDateForBooking(date)).toBe("2024-02-29");
  });

  it("handles beginning of year date correctly", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    expect(formatDateForBooking(date)).toBe("2024-01-01");
  });

  it("handles end of year date correctly", () => {
    const date = new Date("2024-12-31T23:59:59Z");
    expect(formatDateForBooking(date)).toBe("2024-12-31");
  });

  it("throws error for invalid date", () => {
    const invalidDate = new Date("invalid-date");
    expect(() => formatDateForBooking(invalidDate)).toThrow(
      "Invalid date format",
    );
  });

  it("throws error for date with NaN time", () => {
    const invalidDate = new Date(NaN);
    expect(() => formatDateForBooking(invalidDate)).toThrow(
      "Invalid date format",
    );
  });

  it("handles edge case of Date object created from invalid string", () => {
    const invalidDate = new Date("not-a-date");
    expect(() => formatDateForBooking(invalidDate)).toThrow(
      "Invalid date format",
    );
  });

  it("handles very old dates", () => {
    const oldDate = new Date("1900-01-01T00:00:00Z");
    expect(formatDateForBooking(oldDate)).toBe("1900-01-01");
  });

  it("handles far future dates", () => {
    const futureDate = new Date("2100-12-31T00:00:00Z");
    expect(formatDateForBooking(futureDate)).toBe("2100-12-31");
  });
});
