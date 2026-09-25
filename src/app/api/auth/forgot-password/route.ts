import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { clientRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/modules/identity/auth";

export async function POST(request: Request) {
  try {
    enforceRateLimit(clientRateLimitKey(request, "forgot-password"), 5, 15 * 60_000);
    const body = (await request.json()) as { email?: string };
    if (!body.email) return NextResponse.json({ success: true });
    await requestPasswordReset(body.email);
    return NextResponse.json({ success: true, message: "If that email is registered, reset instructions will be sent." });
  } catch (error) {
    return errorResponse(error);
  }
}
