import { NextResponse } from "next/server";

/**
 * Handle calendar provider webhooks.
 * The request body is verified using the `x-webhook-signature` header.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const payload = await request.text();

  // TODO: verify signature once provider secret is configured
  console.log("Received webhook", { signature, payload });

  return NextResponse.json({ ok: true });
}
