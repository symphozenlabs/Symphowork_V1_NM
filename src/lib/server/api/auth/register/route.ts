import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { clientRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { registerUser } from "@/modules/identity/auth";
import { registrationInputSchema } from "@/modules/platform/validation";
import { sendEmailIfConfigured } from "@/lib/email";

export async function POST(request: Request) {
  try {
    enforceRateLimit(clientRateLimitKey(request, "register"), 5, 15 * 60_000);
    const input = registrationInputSchema.parse(await request.json());
    const result = await registerUser(input);
    const delivery = process.env.APP_URL ? await sendEmailIfConfigured({ to: result.user.email, subject: "Verify your SymphoWork email", html: `<p>Verify your email by opening <a href="${process.env.APP_URL}/verify-email?token=${encodeURIComponent(result.verificationToken)}">this link</a>.</p>` }) : "not_configured";
    return NextResponse.json({ success: true, user: { id: result.user.id, email: result.user.email }, verificationRequired: true, delivery });
  } catch (error) {
    return errorResponse(error);
  }
}
