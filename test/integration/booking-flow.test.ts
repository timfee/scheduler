import { type BookingFormData } from "@/lib/schemas/booking";
import { type CalDavProvider } from "@/lib/providers/caldav";
import { type CalendarEvent } from "@/lib/schemas/calendar-event";
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

// Mock the data module using jest.mock
jest.mock("@/app/(booking)/server/data", () => ({
  getAppointmentType: jest.fn(async () => ({
    id: "intro",
    name: "Intro",  
    durationMinutes: 30,
    isActive: true,
    createdAt: 0,
    updatedAt: 0,
  })),
}));

// Mock the database integrations module
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

// Import the module after mocking
import { getAppointmentType } from "@/app/(booking)/server/data";

let createBookingAction: (d: BookingFormData) => Promise<void>;

const mockCalendarEvent: CalendarEvent = {
  id: "test-id",
  title: "Test Event",
  startUtc: "2024-01-01T10:00:00.000Z",
  endUtc: "2024-01-01T10:30:00.000Z",
  createdUtc: "2024-01-01T09:00:00.000Z",
  updatedUtc: "2024-01-01T09:00:00.000Z",
  ownerTimeZone: "UTC",
  metadata: {},
};

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: "development",
    ENCRYPTION_KEY:
      "C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148",
    SQLITE_PATH: ":memory:",
    WEBHOOK_SECRET: "test-webhook-secret-key-that-is-long-enough",
  });

  provider = {
    createAppointment: jest.fn(async () => mockCalendarEvent),
    listBusyTimes: jest.fn(async () => []),
  };

  ({ createBookingAction } = await import("@/app/(booking)/server/actions"));
});

describe("booking flow integration", () => {
  it("creates a calendar event", async () => {
    const data: BookingFormData = {
      type: "intro",
      selectedDate: "2024-01-01",
      selectedTime: "10:00",
      name: "Tester",
      email: "test@example.com",
    };

    await createBookingAction(data);
    expect(provider.createAppointment).toHaveBeenCalled();
  });
});
