import { errorResponse, AppError } from "@/lib/errors";
import { authenticate, revokePresentedSession, setSessionCookie } from "@/modules/identity/auth";
import { authInputSchema } from "@/modules/platform/validation";
import { hasPlatformPermission, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { clientRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
export async function POST(request: Request) { try { enforceRateLimit(clientRateLimitKey(request, "platform-login"), 10, 15 * 60_000); const result = await authenticate(authInputSchema.parse(await request.json())); if (!hasPlatformPermission(result.user.platformRole, PLATFORM_PERMISSIONS.organizationView)) { await revokePresentedSession(result.token); throw new AppError("FORBIDDEN", "A platform role is required for console access.", 403); } await setSessionCookie(result.token); return Response.json({ success: true, user: { id: result.user.id, email: result.user.email, fullName: result.user.fullName, platformRole: result.user.platformRole } }); } catch (error) { return errorResponse(error); } }
