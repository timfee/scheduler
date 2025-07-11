import {
  cleanupTestDb,
  createTestDb,
} from "@/infrastructure/database/__tests__/helpers/db";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { sql } from "drizzle-orm";

import type * as bookingData from "../data";

let db: ReturnType<typeof createTestDb>["db"];
let sqlite: ReturnType<typeof createTestDb>["sqlite"];
let data: typeof bookingData;

beforeAll(async () => {
  const testDb = createTestDb();
  db = testDb.db;
  sqlite = testDb.sqlite;
  jest.unstable_mockModule("@/infrastructure/database", () => ({ db }));

  data = await import("@/app/(booking)/server/data");
});

afterAll(() => {
  cleanupTestDb(sqlite);
  jest.resetModules();
});

describe("booking data", () => {
  it("fetches appointment types from database", async () => {
    db.run(
      sql`INSERT INTO appointment_types (id, name, duration_minutes, is_active, created_at, updated_at) VALUES ('1', 'Intro', 30, 1, 0, 0)`,
    );
    db.run(
      sql`INSERT INTO appointment_types (id, name, duration_minutes, is_active, created_at, updated_at) VALUES ('2', 'Old', 30, 0, 0, 0)`,
    );

    const list = await data.listAppointmentTypes();
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe("Intro");

    const single = await data.getAppointmentType("1");
    expect(single?.name).toBe("Intro");
  });
});
