import { beforeAll, describe, expect, it } from "@jest/globals";

import { type BookingFormData } from "../schemas/booking";

let createBookingAction: (data: BookingFormData) => Promise<void>;

beforeAll(async () => {
  Object.assign(process.env, { NODE_ENV: "development" });
  process.env.ENCRYPTION_KEY =
    "C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148";
  process.env.SQLITE_PATH = ":memory:";
  ({ createBookingAction } = await import("../actions"));
});

describe("createBookingAction", () => {
  it("validates input data", async () => {
    await expect(
      createBookingAction({} as unknown as BookingFormData),
    ).rejects.toThrow();
  });
});
