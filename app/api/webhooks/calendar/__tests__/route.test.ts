import { describe, expect, it, beforeAll } from "@jest/globals";
import { createHmac } from "crypto";

// Set up environment variables before importing modules
beforeAll(() => {
  Object.assign(process.env, {
    NODE_ENV: 'development',
    ENCRYPTION_KEY: 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148',
    SQLITE_PATH: ':memory:',
    WEBHOOK_SECRET: 'test-webhook-secret-key-that-is-long-enough',
  });
});

// Import after setting up environment
let POST: (request: Request) => Promise<Response>;

beforeAll(async () => {
  const route = await import("@/app/api/webhooks/calendar/route");
  POST = route.POST;
});

describe("POST /api/webhooks/calendar", () => {
  const testSecret = "test-webhook-secret-key-that-is-long-enough";
  const testPayload = '{"event": "calendar.updated", "data": {"id": "123"}}';

  function createValidSignature(payload: string, secret: string): string {
    const hmac = createHmac("sha256", secret);
    hmac.update(payload, "utf8");
    return hmac.digest("hex");
  }

  function createMockRequest(body: string, signature: string): Request {
    return {
      headers: {
        get: (name: string) => {
          if (name === "x-webhook-signature") {
            return signature;
          }
          return null;
        },
      },
      text: async () => body,
    } as Request;
  }

  it("should return 200 for valid signature", async () => {
    const validSignature = createValidSignature(testPayload, testSecret);
    const request = createMockRequest(testPayload, validSignature);

    const response = await POST(request);
    const data = await response.json() as { ok: boolean };

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });
  });

  it("should return 200 for valid signature with sha256= prefix", async () => {
    const validSignature = createValidSignature(testPayload, testSecret);
    const request = createMockRequest(testPayload, `sha256=${validSignature}`);

    const response = await POST(request);
    const data = await response.json() as { ok: boolean };

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });
  });

  it("should return 401 for invalid signature", async () => {
    const invalidSignature = "invalid-signature";
    const request = createMockRequest(testPayload, invalidSignature);

    const response = await POST(request);
    const data = await response.json() as { error: string };

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Invalid webhook signature" });
  });

  it("should return 401 for missing signature", async () => {
    const request = createMockRequest(testPayload, "");

    const response = await POST(request);
    const data = await response.json() as { error: string };

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Invalid webhook signature" });
  });

  it("should return 401 for signature computed with wrong secret", async () => {
    const wrongSecret = "wrong-secret-key";
    const invalidSignature = createValidSignature(testPayload, wrongSecret);
    const request = createMockRequest(testPayload, invalidSignature);

    const response = await POST(request);
    const data = await response.json() as { error: string };

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Invalid webhook signature" });
  });
});