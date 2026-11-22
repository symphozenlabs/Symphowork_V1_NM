import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { sendEmailIfConfigured } from "@/lib/email";
import { clientRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { normalizeEmail, resendVerification } from "@/modules/identity/auth";

export async function POST(request: Request) {
  try {
    enforceRateLimit(clientRateLimitKey(request, "verify-email-resend"), 5, 15 * 60_000);
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = normalizeEmail(body.email ?? "");
    const result = email ? await resendVerification(email) : undefined;
    const delivery = result && process.env.APP_URL ? await sendEmailIfConfigured({ to: result.email, subject: "Verify your SymphoWork email", html: `<p>Verify your email by opening <a href="${process.env.APP_URL}/verify-email?token=${encodeURIComponent(result.token)}">this link</a>.</p>` }) : "not_configured";
    return NextResponse.json({ success: true, delivery, message: "If the account is eligible, verification instructions will be sent." });
  } catch (error) { return errorResponse(error); }
}
