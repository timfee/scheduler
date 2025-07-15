import { DURATION } from "@/lib/constants";
import {
  cleanupTestDb,
  createTestDb,
} from "@/lib/database/__tests__/helpers/db";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";

// prettier-ignore
import type * as adminActions from "../../admin/event-types/server/actions";
// prettier-ignore
import type * as bookingDataModule from "../data";

let db: ReturnType<typeof createTestDb>["db"];
let sqlite: ReturnType<typeof createTestDb>["sqlite"];
let data: typeof bookingDataModule;
let actions: typeof adminActions;

beforeAll(async () => {
  const testDb = createTestDb();
  db = testDb.db;
  sqlite = testDb.sqlite;
  jest.unstable_mockModule("@/lib/database", () => ({ db }));

  data = await import("@/app/(booking)/server/data");
  actions = await import("@/app/admin/event-types/server/actions");
});

afterAll(() => {
  cleanupTestDb(sqlite);
  jest.resetModules();
});

describe("booking data", () => {
  it("fetches appointment types from database", async () => {
    // Use the proper action to create appointment types
    await actions.createAppointmentTypeAction({
      name: "Intro",
      durationMinutes: DURATION.DEFAULT_APPOINTMENT_MINUTES,
    });

    // Create an inactive appointment type
    await actions.createAppointmentTypeAction({
      name: "Old",
      durationMinutes: DURATION.DEFAULT_APPOINTMENT_MINUTES,
    });

    // Toggle the second one to inactive
    const allTypes = await actions.getAllAppointmentTypesAction();
    const oldType = allTypes.find((t) => t.name === "Old");
    if (oldType) {
      await actions.toggleAppointmentTypeAction(oldType.id);
    }

    const list = await data.listAppointmentTypes();
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe("Intro");

    const single = await data.getAppointmentType(list[0]!.id);
    expect(single?.name).toBe("Intro");
  });
});
