import { NextResponse } from "next/server";
import env from "@/env.config";
import { verifyWebhookSignature } from "@/lib/webhook-signature";

/**
 * Handle calendar provider webhooks.
 * The request body is verified using the `x-webhook-signature` header.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const payload = await request.text();

  // Verify webhook signature
  const isValid = verifyWebhookSignature(payload, signature, env.WEBHOOK_SECRET);
  
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
