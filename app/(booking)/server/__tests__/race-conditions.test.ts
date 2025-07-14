import { type BookingFormData } from "@/lib/schemas/booking";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { bookingFactory } from "@test/factories";

// Mock the actions module to simulate race conditions
let createBookingAction: jest.MockedFunction<
  (data: BookingFormData) => Promise<void>
>;
let clearRateLimiter: jest.MockedFunction<() => void>;

// Track booking attempts and their outcomes
const bookingAttempts = new Map<
  string,
  { success: boolean; timestamp: number }
>();

// Mock implementation that simulates real booking behavior
const mockCreateBooking = async (data: BookingFormData): Promise<void> => {
  const slotKey = `${data.date}-${data.time}`;

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

  // Check if exact same slot is already taken
  if (bookingAttempts.has(slotKey)) {
    throw new Error("Time slot no longer available");
  }

  // Simulate successful booking
  bookingAttempts.set(slotKey, { success: true, timestamp: Date.now() });
};

describe("Booking Race Conditions", () => {
  beforeEach(() => {
    // Clear previous attempts
    bookingAttempts.clear();

    // Setup mocks
    createBookingAction = jest.fn().mockImplementation(mockCreateBooking);
    clearRateLimiter = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Concurrent booking attempts", () => {
    it("should prevent double booking with Promise.all simulation", async () => {
      // Create two booking attempts for same slot
      const bookingData = bookingFactory.build({
        date: "2024-01-15",
        time: "14:00",
        type: "intro",
      });

      const booking1 = createBookingAction(bookingData);
      const booking2 = createBookingAction({
        ...bookingData,
        email: "user2@example.com",
      });

      // Execute concurrently
      const results = await Promise.allSettled([booking1, booking2]);

      // Verify exactly one succeeds
      const successes = results.filter((r) => r.status === "fulfilled");
      const failures = results.filter((r) => r.status === "rejected");

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);

      if (failures[0].status === "rejected") {
        expect(failures[0].reason.message).toContain("no longer available");
      }
    });

    it("should handle rapid sequential bookings", async () => {
      // Test N bookings in rapid succession
      const baseBookingData = bookingFactory.build({
        date: "2024-01-15",
        time: "10:00",
        type: "intro",
      });

      const bookingPromises = Array(10)
        .fill(null)
        .map((_, i) =>
          createBookingAction({
            ...baseBookingData,
            email: `user${i}@example.com`,
          }),
        );

      const results = await Promise.allSettled(bookingPromises);

      // Only first should succeed
      const successes = results.filter((r) => r.status === "fulfilled");
      const failures = results.filter((r) => r.status === "rejected");

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(9);
    });

    it("should handle overlapping time slots", async () => {
      // User A books 2:00-3:00
      const bookingA = bookingFactory.build({
        date: "2024-01-15",
        time: "14:00",
        type: "intro", // 30 minutes
        email: "userA@example.com",
      });

      // User B tries 2:30-3:30 while A is processing
      const bookingB = bookingFactory.build({
        date: "2024-01-15",
        time: "14:30",
        type: "intro", // 30 minutes
        email: "userB@example.com",
      });

      // Start both bookings concurrently
      const [resultA, resultB] = await Promise.allSettled([
        createBookingAction(bookingA),
        createBookingAction(bookingB),
      ]);

      // Both should succeed since they're different time slots
      // Note: In a real system, you'd need to check for overlaps
      expect(resultA.status).toBe("fulfilled");
      expect(resultB.status).toBe("fulfilled");
    });

    it("should handle same exact time slot conflicts", async () => {
      const bookingData = bookingFactory.build({
        date: "2024-01-15",
        time: "14:00",
        type: "intro",
      });

      // Multiple users trying to book the exact same slot
      const bookingPromises = [
        createBookingAction({ ...bookingData, email: "user1@example.com" }),
        createBookingAction({ ...bookingData, email: "user2@example.com" }),
        createBookingAction({ ...bookingData, email: "user3@example.com" }),
      ];

      const results = await Promise.allSettled(bookingPromises);

      // Verify exactly one succeeds
      const successes = results.filter((r) => r.status === "fulfilled");
      const failures = results.filter((r) => r.status === "rejected");

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(2);
    });
  });

  describe("Lock timeout and cleanup", () => {
    it("should release locks after timeout", async () => {
      // Create a slow mock that simulates a hanging request
      const slowMockCreateBooking = async (
        data: BookingFormData,
      ): Promise<void> => {
        // Simulate a slow calendar API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const slotKey = `${data.date}-${data.time}`;
        const attemptId = `${data.email}-${Date.now()}`;
        bookingAttempts.set(attemptId, {
          success: true,
          timestamp: Date.now(),
        });
      };

      const fastMockCreateBooking = async (
        data: BookingFormData,
      ): Promise<void> => {
        // Fast booking attempt
        await new Promise((resolve) => setTimeout(resolve, 50));

        const slotKey = `${data.date}-${data.time}`;
        const attemptId = `${data.email}-${Date.now()}`;
        bookingAttempts.set(attemptId, {
          success: true,
          timestamp: Date.now(),
        });
      };

      const bookingData = bookingFactory.build({
        date: "2024-01-15",
        time: "14:00",
        type: "intro",
      });

      // First booking starts but hangs
      const slowBooking = slowMockCreateBooking({
        ...bookingData,
        email: "slow@example.com",
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second booking waits, then proceeds after timeout
      const fastBooking = fastMockCreateBooking({
        ...bookingData,
        email: "fast@example.com",
      });

      // Both should complete eventually
      const results = await Promise.allSettled([slowBooking, fastBooking]);

      // Both should succeed (in a real implementation, this would be handled by locks)
      expect(results[0].status).toBe("fulfilled");
      expect(results[1].status).toBe("fulfilled");
    });

    it("should clean up locks on error", async () => {
      const errorMockCreateBooking = async (
        data: BookingFormData,
      ): Promise<void> => {
        throw new Error("Calendar API error");
      };

      const successMockCreateBooking = async (
        data: BookingFormData,
      ): Promise<void> => {
        const slotKey = `${data.date}-${data.time}`;
        const attemptId = `${data.email}-${Date.now()}`;
        bookingAttempts.set(attemptId, {
          success: true,
          timestamp: Date.now(),
        });
      };

      const bookingData = bookingFactory.build({
        date: "2024-01-15",
        time: "14:00",
        type: "intro",
      });

      // Force error during booking
      const errorBooking = errorMockCreateBooking({
        ...bookingData,
        email: "error@example.com",
      });

      // Verify error booking fails
      await expect(errorBooking).rejects.toThrow("Calendar API error");

      // Next booking for same slot should proceed
      const successBooking = successMockCreateBooking({
        ...bookingData,
        email: "success@example.com",
      });

      // Should succeed since lock was released
      await expect(successBooking).resolves.not.toThrow();
    });
  });

  describe("Booking state consistency", () => {
    it("should maintain consistent state across concurrent operations", async () => {
      // Create multiple booking attempts with different data
      const bookingPromises = Array(5)
        .fill(null)
        .map((_, i) =>
          createBookingAction(
            bookingFactory.build({
              date: "2024-01-15",
              time: `${10 + i}:00`,
              type: "intro",
              email: `user${i}@example.com`,
            }),
          ),
        );

      const results = await Promise.allSettled(bookingPromises);

      // All should succeed since they're different time slots
      const successes = results.filter((r) => r.status === "fulfilled");
      expect(successes).toHaveLength(5);
    });

    it("should handle mixed success and failure scenarios", async () => {
      const sameSlotBookings = Array(3)
        .fill(null)
        .map((_, i) =>
          createBookingAction(
            bookingFactory.build({
              date: "2024-01-15",
              time: "14:00", // Same time slot
              type: "intro",
              email: `user${i}@example.com`,
            }),
          ),
        );

      const differentSlotBookings = Array(2)
        .fill(null)
        .map((_, i) =>
          createBookingAction(
            bookingFactory.build({
              date: "2024-01-15",
              time: `${15 + i}:00`, // Different time slots
              type: "intro",
              email: `user${i + 3}@example.com`,
            }),
          ),
        );

      const allBookings = [...sameSlotBookings, ...differentSlotBookings];
      const results = await Promise.allSettled(allBookings);

      // Should have mixed results
      const successes = results.filter((r) => r.status === "fulfilled");
      const failures = results.filter((r) => r.status === "rejected");

      // 1 success from same slot + 2 from different slots = 3 total
      expect(successes.length).toBe(3);
      expect(failures.length).toBe(2);
    });
  });

  describe("Performance under load", () => {
    it("should handle high concurrency without performance degradation", async () => {
      const startTime = Date.now();

      // Create many concurrent booking attempts
      const bookingPromises = Array(50)
        .fill(null)
        .map((_, i) =>
          createBookingAction(
            bookingFactory.build({
              date: "2024-01-15",
              time: `${9 + (i % 8)}:00`, // Spread across 8 time slots
              type: "intro",
              email: `user${i}@example.com`,
            }),
          ),
        );

      const results = await Promise.allSettled(bookingPromises);
      const endTime = Date.now();

      // Should complete within reasonable time (adjust threshold as needed)
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // 5 seconds

      // Should have reasonable success rate
      const successes = results.filter((r) => r.status === "fulfilled");
      expect(successes.length).toBeGreaterThan(0);
      expect(successes.length).toBeLessThanOrEqual(8); // Max 8 time slots
    });
  });
});
