import { describe, expect, it } from "@jest/globals";
import {
  appointmentTypeFactory,
  appointmentTypeVariants,
  bookingFactory,
  bookingVariants,
  calendarEventFactory,
  calendarEventVariants,
  calendarIntegrationFactory,
  calendarIntegrationVariants,
  connectionFactory,
  connectionVariants,
  Factory,
} from "@test/factories";

describe("Test Factories", () => {
  describe("Base Factory", () => {
    it("should create a factory instance", () => {
      const factory = Factory.define(() => ({ name: "test" }));
      expect(factory).toBeDefined();
    });

    it("should build a single instance", () => {
      const factory = Factory.define(() => ({ name: "test", count: 1 }));
      const instance = factory.build();
      expect(instance).toEqual({ name: "test", count: 1 });
    });

    it("should build with overrides", () => {
      const factory = Factory.define(() => ({ name: "test", count: 1 }));
      const instance = factory.build({ name: "overridden" });
      expect(instance).toEqual({ name: "overridden", count: 1 });
    });

    it("should build a list of instances", () => {
      const factory = Factory.define(() => ({ name: "test", count: 1 }));
      const instances = factory.buildList(3);
      expect(instances).toHaveLength(3);
      expect(instances[0]).toEqual({ name: "test", count: 1 });
    });

    it("should build with sequence", () => {
      const factory = Factory.define(() => ({ name: "test", count: 1 }));
      const instances = factory.buildStringSequence({
        count: 3,
        sequenceField: "name",
        prefix: "item-",
      });
      expect(instances).toHaveLength(3);
      expect(instances[0]?.name).toBe("item-1");
      expect(instances[1]?.name).toBe("item-2");
      expect(instances[2]?.name).toBe("item-3");
    });
  });

  describe("Booking Factory", () => {
    it("should create booking data", () => {
      const booking = bookingFactory.build();
      expect(booking).toHaveProperty("type");
      expect(booking).toHaveProperty("selectedDate");
      expect(booking).toHaveProperty("selectedTime");
      expect(booking).toHaveProperty("name");
      expect(booking).toHaveProperty("email");
      expect(booking.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it("should create booking variants", () => {
      const intro = bookingVariants.intro();
      expect(intro.type).toBe("intro");

      const followUp = bookingVariants.followUp();
      expect(followUp.type).toBe("follow-up");
    });

    it("should create booking with custom time", () => {
      const booking = bookingVariants.withCustomTime("14:30");
      expect(booking.selectedTime).toBe("14:30");
    });
  });

  describe("Calendar Event Factory", () => {
    it("should create calendar event data", () => {
      const event = calendarEventFactory.build();
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("startUtc");
      expect(event).toHaveProperty("endUtc");
      expect(event).toHaveProperty("ownerTimeZone");
    });

    it("should create event with duration", () => {
      const event = calendarEventVariants.withDuration(60);
      const start = new Date(event.startUtc);
      const end = new Date(event.endUtc);
      const durationMs = end.getTime() - start.getTime();
      expect(durationMs).toBe(60 * 60 * 1000); // 60 minutes in milliseconds
    });
  });

  describe("Connection Factory", () => {
    it("should create connection data", () => {
      const connection = connectionFactory.build();
      expect(connection).toHaveProperty("provider");
      expect(connection).toHaveProperty("displayName");
      expect(connection).toHaveProperty("authMethod");
      expect(connection).toHaveProperty("capabilities");
      expect(connection.capabilities).toHaveLength(1);
    });

    it("should create provider variants", () => {
      const google = connectionVariants.google();
      expect(google.provider).toBe("google");
      expect(google.authMethod).toBe("Oauth");
      expect(google.refreshToken).toBeDefined();

      const apple = connectionVariants.apple();
      expect(apple.provider).toBe("apple");
      expect(apple.authMethod).toBe("Basic");
      expect(apple.serverUrl).toBeUndefined();
    });
  });

  describe("Appointment Type Factory", () => {
    it("should create appointment type data", () => {
      const appointmentType = appointmentTypeFactory.build();
      expect(appointmentType).toHaveProperty("id");
      expect(appointmentType).toHaveProperty("name");
      expect(appointmentType).toHaveProperty("durationMinutes");
      expect(appointmentType).toHaveProperty("isActive");
    });

    it("should create appointment type variants", () => {
      const intro = appointmentTypeVariants.intro();
      expect(intro.name).toBe("Intro");
      expect(intro.durationMinutes).toBe(30);

      const consultation = appointmentTypeVariants.consultation();
      expect(consultation.name).toBe("Consultation");
      expect(consultation.durationMinutes).toBe(60);
    });

    it("should create with custom duration", () => {
      const appointmentType = appointmentTypeVariants.withDuration(45);
      expect(appointmentType.durationMinutes).toBe(45);
    });
  });

  describe("Calendar Integration Factory", () => {
    it("should create calendar integration data", () => {
      const integration = calendarIntegrationFactory.build();
      expect(integration).toHaveProperty("id");
      expect(integration).toHaveProperty("provider");
      expect(integration).toHaveProperty("displayName");
      expect(integration).toHaveProperty("encryptedConfig");
      expect(integration).toHaveProperty("displayOrder");
      expect(integration).toHaveProperty("createdAt");
      expect(integration).toHaveProperty("updatedAt");
    });

    it("should create calendar integration variants", () => {
      const google = calendarIntegrationVariants.google();
      expect(google.provider).toBe("google");
      expect(google.displayName).toBe("Google Calendar");

      const apple = calendarIntegrationVariants.apple();
      expect(apple.provider).toBe("apple");
      expect(apple.displayName).toBe("iCloud Calendar");

      const caldav = calendarIntegrationVariants.caldav();
      expect(caldav.provider).toBe("caldav");
      expect(caldav.displayName).toBe("CalDAV Server");
    });

    it("should create with custom display order", () => {
      const integration = calendarIntegrationVariants.withDisplayOrder(5);
      expect(integration.displayOrder).toBe(5);
    });
  });
});
