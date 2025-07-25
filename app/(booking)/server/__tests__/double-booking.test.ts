import { DURATION, TEST_CONSTANTS } from "@/lib/constants";
import { type CalDavProvider } from "@/lib/providers/caldav";
import { type BookingFormData } from "@/lib/schemas/booking";
import { type CalendarEvent } from "@/lib/schemas/calendar-event";
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  appointmentTypeFactory,
  bookingFactory,
  calendarEventFactory,
} from "@test/factories";

import "@test/setup/jest.setup";

// Mock the appointment type data
jest.mock("@/app/(booking)/server/data", () => ({
  getAppointmentType: jest.fn(async () =>
    appointmentTypeFactory.build({
      id: "intro",
      name: "Intro",
      durationMinutes: DURATION.DEFAULT_APPOINTMENT_MINUTES,
      isActive: true,
    }),
  ),
}));

// Mock the database integrations
jest.mock("@/lib/database/integrations", () => ({
  getBookingCalendar: jest.fn(async () => ({
    id: "1",
    provider: "caldav",
    displayName: "Main",
    encryptedConfig: "",
    displayOrder: 0,
    createdAt: 0,
    updatedAt: 0,
    config: {
      calendarUrl: "https://cal",
      serverUrl: "https://cal",
      authMethod: "Basic",
      username: "u",
      password: "p",
      capabilities: ["booking"],
    },
  })),
  createDAVClientFromIntegration: jest.fn(async () => ({})),
}));

// Mock the CalDAV provider
let provider: Pick<CalDavProvider, "listBusyTimes" | "createAppointment">;

jest.mock("@/lib/providers/caldav", () => ({
  createCalDavProvider: jest.fn(() => provider),
}));

let createBookingAction: (data: BookingFormData) => Promise<void>;
let clearRateLimiter: () => void;
let clearBookingLocks: () => void;

const mockCalendarEvent: CalendarEvent = calendarEventFactory.build({
  id: "test-id",
  title: "Test Event",
  startUtc: "2024-01-01T10:00:00.000Z",
  endUtc: "2024-01-01T10:30:00.000Z",
  createdUtc: "2024-01-01T09:00:00.000Z",
  updatedUtc: "2024-01-01T09:00:00.000Z",
});

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: "development",
    ENCRYPTION_KEY: TEST_CONSTANTS.ENCRYPTION_KEY,
    SQLITE_PATH: TEST_CONSTANTS.SQLITE_PATH,
    WEBHOOK_SECRET: TEST_CONSTANTS.WEBHOOK_SECRET,
  });

  provider = {
    listBusyTimes: jest.fn(async () => []),
    createAppointment: jest.fn(async () => mockCalendarEvent),
  };
  ({ createBookingAction, clearRateLimiter, clearBookingLocks } = await import(
    "@/app/(booking)/server/actions"
  ));
});

afterEach(() => {
  clearRateLimiter();
  clearBookingLocks();
  jest.clearAllMocks();
});

describe("Double Booking Race Condition Prevention", () => {
  it("prevents double booking when two users book the same time slot simultaneously", async () => {
    const bookingData1 = bookingFactory.build({
      email: "user1@example.com",
      date: "2024-01-01",
      time: "10:00",
    });
    const bookingData2 = bookingFactory.build({
      email: "user2@example.com",
      date: "2024-01-01",
      time: "10:00",
    });

    // Mock the provider to simulate a race condition scenario
    let busyTimesCalled = 0;
    let appointmentsCalled = 0;

    provider.listBusyTimes = jest.fn(async () => {
      busyTimesCalled++;
      // First call: slot is available
      if (busyTimesCalled === 1) {
        return [];
      }
      // Second and subsequent calls: slot is taken
      return [
        {
          startUtc: "2024-01-01T10:00:00.000Z",
          endUtc: "2024-01-01T10:30:00.000Z",
        },
      ];
    });

    provider.createAppointment = jest.fn(async () => {
      appointmentsCalled++;
      return mockCalendarEvent;
    });

    // Start both booking attempts simultaneously
    const promise1 = createBookingAction(bookingData1);
    const promise2 = createBookingAction(bookingData2);

    // Wait for both promises to settle
    const results = await Promise.allSettled([promise1, promise2]);

    // One should succeed, one should fail
    const successes = results.filter((r) => r.status === "fulfilled");
    const failures = results.filter((r) => r.status === "rejected");

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.status).toBe("rejected");
    if (failures[0]?.status === "rejected") {
      expect(failures[0].reason).toBeInstanceOf(Error);
      expect((failures[0].reason as Error).message).toBe(
        "Selected time is not available",
      );
    }

    // Only one appointment should be created
    expect(appointmentsCalled).toBe(1);
  });

  it("allows sequential bookings for different time slots", async () => {
    const bookingData1 = bookingFactory.build({
      email: "user1@example.com",
      date: "2024-01-01",
      time: "10:00",
    });
    const bookingData2 = bookingFactory.build({
      email: "user2@example.com",
      date: "2024-01-01",
      time: "11:00",
    });

    // Reset the mock to always return empty (no conflicts)
    provider.listBusyTimes = jest.fn(async () => []);

    // Both bookings should succeed since they're for different time slots
    await createBookingAction(bookingData1);
    await createBookingAction(bookingData2);

    expect(provider.createAppointment).toHaveBeenCalledTimes(2);
  });

  it("properly cleans up booking locks after completion", async () => {
    const bookingData = bookingFactory.build({
      email: "user@example.com",
      date: "2024-01-01",
      time: "10:00",
    });

    // Reset the mock to always return empty (no conflicts)
    provider.listBusyTimes = jest.fn(async () => []);

    // First booking
    await createBookingAction(bookingData);

    // Second booking for same time slot should succeed since lock was cleaned up
    const differentUserData = bookingFactory.build({
      email: "differentuser@example.com",
      date: "2024-01-01",
      time: "10:00",
    });

    await createBookingAction(differentUserData);

    expect(provider.createAppointment).toHaveBeenCalledTimes(2);
  });
});
