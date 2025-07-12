import { TEST_CONSTANTS } from "@/lib/constants";
import { describe, expect, it, beforeAll, jest } from "@jest/globals";
import { createHmac } from "crypto";
import { z } from "zod";

// Mock the webhook signature verification function
jest.mock("@/lib/webhook-signature", () => ({
  verifyWebhookSignature: jest.fn(),
}));

// Now import the route module
import { POST } from "@/app/api/webhooks/calendar/route";
import { verifyWebhookSignature } from "@/lib/webhook-signature";

// Response schemas for type-safe API testing
const successResponseSchema = z.object({
  ok: z.literal(true),
});

const errorResponseSchema = z.object({
  error: z.string(),
});

const apiResponseSchema = z.union([successResponseSchema, errorResponseSchema]);

// Helper function to safely parse API responses
async function parseApiResponse(response: Response) {
  const data = await response.json() as unknown;
  return apiResponseSchema.parse(data);
}

// Set up environment variables before running tests
beforeAll(() => {
  Object.assign(process.env, {
    NODE_ENV: 'development',
    ENCRYPTION_KEY: 'C726D901D86543855E6F0FA9F0CF142FEC4431F3A98ECC521DA0F67F88D75148',
    SQLITE_PATH: TEST_CONSTANTS.SQLITE_PATH,
    WEBHOOK_SECRET: 'test-webhook-secret-key-that-is-long-enough',
  });
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
    // Create a partial mock of Request that implements only the methods we need
    const mockRequest = {
      headers: {
        get: (name: string) => {
          if (name === "x-webhook-signature") {
            return signature;
          }
          return null;
        },
      },
      text: async () => body,
    };
    
    // Return as Request - this is acceptable for testing as we're only mocking used methods
    return mockRequest as Request;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 for valid signature", async () => {
    const validSignature = createValidSignature(testPayload, testSecret);
    const request = createMockRequest(testPayload, validSignature);

    // Mock the signature verification to return true
    (verifyWebhookSignature as jest.MockedFunction<typeof verifyWebhookSignature>).mockReturnValue(true);

    const response = await POST(request);
    const data = await parseApiResponse(response);

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });
  });

  it("should return 200 for valid signature with sha256= prefix", async () => {
    const validSignature = createValidSignature(testPayload, testSecret);
    const request = createMockRequest(testPayload, `sha256=${validSignature}`);

    // Mock the signature verification to return true
    (verifyWebhookSignature as jest.MockedFunction<typeof verifyWebhookSignature>).mockReturnValue(true);

    const response = await POST(request);
    const data = await parseApiResponse(response);

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });
  });

  it("should return 401 for invalid signature", async () => {
    const request = createMockRequest(testPayload, "invalid-signature");

    // Mock the signature verification to return false
    (verifyWebhookSignature as jest.MockedFunction<typeof verifyWebhookSignature>).mockReturnValue(false);

    const response = await POST(request);
    const data = await parseApiResponse(response);

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Invalid webhook signature" });
  });

  it("should return 401 for missing signature", async () => {
    const request = createMockRequest(testPayload, "");

    // Mock the signature verification to return false
    (verifyWebhookSignature as jest.MockedFunction<typeof verifyWebhookSignature>).mockReturnValue(false);

    const response = await POST(request);
    const data = await parseApiResponse(response);

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Invalid webhook signature" });
  });

  it("should return 401 for signature computed with wrong secret", async () => {
    const wrongSecret = "wrong-secret-key";
    const invalidSignature = createValidSignature(testPayload, wrongSecret);
    const request = createMockRequest(testPayload, invalidSignature);

    // Mock the signature verification to return false
    (verifyWebhookSignature as jest.MockedFunction<typeof verifyWebhookSignature>).mockReturnValue(false);

    const response = await POST(request);
    const data = await parseApiResponse(response);

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Invalid webhook signature" });
  });
});