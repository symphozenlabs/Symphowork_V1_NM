import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { clientRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/modules/identity/auth";
import { sendEmailIfConfigured } from "@/lib/email";

export async function POST(request: Request) {
  try {
    enforceRateLimit(clientRateLimitKey(request, "forgot-password"), 5, 15 * 60_000);
    const body = (await request.json()) as { email?: string };
    if (!body.email) return NextResponse.json({ success: true });
    const token = await requestPasswordReset(body.email);
    const delivery = token && process.env.APP_URL ? await sendEmailIfConfigured({ to: body.email.trim().toLowerCase(), subject: "Reset your SymphoWork password", html: `<p>Reset your password by opening <a href="${process.env.APP_URL}/reset-password?token=${encodeURIComponent(token)}">this link</a>.</p>` }) : "not_configured";
    return NextResponse.json({ success: true, delivery, message: "If that email is registered, reset instructions will be sent." });
  } catch (error) {
    return errorResponse(error);
  }
}
