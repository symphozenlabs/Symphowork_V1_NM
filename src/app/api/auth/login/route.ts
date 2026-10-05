import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { authenticate, setSessionCookie } from "@/modules/identity/auth";
import { authInputSchema } from "@/modules/platform/validation";
import { clientRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) { try { enforceRateLimit(clientRateLimitKey(request, "login"), 10, 15 * 60_000); const result = await authenticate(authInputSchema.parse(await request.json())); await setSessionCookie(result.token); return NextResponse.json({ success: true, user: { id: result.user.id, email: result.user.email, fullName: result.user.fullName, platformRole: result.user.platformRole, mustChangePassword: result.user.mustChangePassword } }); } catch (error) { return errorResponse(error); } }
