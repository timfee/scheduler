import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies webhook signature using HMAC-SHA256
 * @param payload - The raw request body as a string
 * @param signature - The signature from the x-webhook-signature header
 * @param secret - The webhook secret
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret || !payload) {
    return false;
  }

  // Create HMAC-SHA256 hash of the payload
  const hmac = createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  const expectedSignature = hmac.digest("hex");

  // Compare with provided signature (remove any 'sha256=' prefix if present)
  const providedSignature = signature.trim().replace(/^sha256=/i, "");

  // Use timing-safe comparison to prevent timing attacks
  if (expectedSignature.length !== providedSignature.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(providedSignature, "hex"),
  );
}