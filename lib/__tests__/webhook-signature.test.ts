import { describe, expect, it } from "@jest/globals";
import { createHmac } from "crypto";
import { verifyWebhookSignature } from "@/lib/webhook-signature";

describe("verifyWebhookSignature", () => {
  const testSecret = "test-secret-key-that-is-long-enough";
  const testPayload = '{"event": "test", "data": {"id": "123"}}';

  function createValidSignature(payload: string, secret: string): string {
    const hmac = createHmac("sha256", secret);
    hmac.update(payload, "utf8");
    return hmac.digest("hex");
  }

  it("should return true for valid signature", () => {
    const validSignature = createValidSignature(testPayload, testSecret);
    
    expect(verifyWebhookSignature(testPayload, validSignature, testSecret)).toBe(true);
  });

  it("should return true for valid signature with sha256= prefix", () => {
    const validSignature = createValidSignature(testPayload, testSecret);
    
    expect(verifyWebhookSignature(testPayload, `sha256=${validSignature}`, testSecret)).toBe(true);
  });

  it("should return false for invalid signature", () => {
    const invalidSignature = "invalid-signature";
    
    expect(verifyWebhookSignature(testPayload, invalidSignature, testSecret)).toBe(false);
  });

  it("should return false for empty signature", () => {
    expect(verifyWebhookSignature(testPayload, "", testSecret)).toBe(false);
  });

  it("should return false for empty secret", () => {
    const validSignature = createValidSignature(testPayload, testSecret);
    
    expect(verifyWebhookSignature(testPayload, validSignature, "")).toBe(false);
  });

  it("should return false for empty payload", () => {
    const validSignature = createValidSignature(testPayload, testSecret);
    
    expect(verifyWebhookSignature("", validSignature, testSecret)).toBe(false);
  });

  it("should return false for signature computed with different secret", () => {
    const wrongSecret = "wrong-secret-key";
    const signatureWithWrongSecret = createValidSignature(testPayload, wrongSecret);
    
    expect(verifyWebhookSignature(testPayload, signatureWithWrongSecret, testSecret)).toBe(false);
  });

  it("should return false for signature computed with different payload", () => {
    const differentPayload = '{"event": "different", "data": {"id": "456"}}';
    const signatureWithDifferentPayload = createValidSignature(differentPayload, testSecret);
    
    expect(verifyWebhookSignature(testPayload, signatureWithDifferentPayload, testSecret)).toBe(false);
  });
});