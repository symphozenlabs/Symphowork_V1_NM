import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { hashToken } from "@/lib/crypto";
import { clientRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { authenticateUser, SESSION_COOKIE } from "@/modules/identity/session-core";
import { authInputSchema } from "@/modules/platform/validation";
import { hasPlatformPermission, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    enforceRateLimit(clientRateLimitKey(request, "platform-login"), 10, 15 * 60_000);
    const result = await authenticateUser(authInputSchema.parse(await request.json()));
    if (!hasPlatformPermission(result.user.platformRole, PLATFORM_PERMISSIONS.organizationView)) {
      await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(result.token)));
      throw new AppError("FORBIDDEN", "A platform role is required for console access.", 403);
    }
    cookies.set(SESSION_COOKIE, result.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", expires: result.expiresAt, path: "/" });
    return Response.json({ success: true, user: { id: result.user.id, email: result.user.email, fullName: result.user.fullName, platformRole: result.user.platformRole } });
  } catch (cause) { return errorResponse(cause); }
};
