import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { clientRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { registerUser } from "@/modules/identity/auth";
import { registrationInputSchema } from "@/modules/platform/validation";

export async function POST(request: Request) {
  try {
    enforceRateLimit(clientRateLimitKey(request, "register"), 5, 15 * 60_000);
    const input = registrationInputSchema.parse(await request.json());
    const result = await registerUser(input);
    return NextResponse.json({ success: true, user: { id: result.user.id, email: result.user.email }, verificationRequired: true });
  } catch (error) {
    return errorResponse(error);
  }
}
