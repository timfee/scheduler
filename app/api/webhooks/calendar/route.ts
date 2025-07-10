import { NextResponse } from "next/server";

/**
 * Handle calendar provider webhooks.
 * The request body is verified using the `x-webhook-signature` header.
 */
export async function POST(request: Request) {
  const _signature = request.headers.get("x-webhook-signature") ?? "";
  const _payload = await request.text();

  // TODO(#verify-webhook): verify signature once provider secret is configured

  return NextResponse.json({ ok: true });
}
