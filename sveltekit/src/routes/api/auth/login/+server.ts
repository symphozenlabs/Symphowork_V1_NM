import { errorResponse } from "@/lib/errors";
import { clientRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { authInputSchema } from "@/modules/platform/validation";
import { authenticateUser, SESSION_COOKIE } from "@/modules/identity/session-core";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    enforceRateLimit(clientRateLimitKey(request, "login"), 10, 15 * 60_000);
    const result = await authenticateUser(authInputSchema.parse(await request.json()));
    cookies.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: result.expiresAt,
      path: "/"
    });
    return Response.json({ success: true, user: { id: result.user.id, email: result.user.email, fullName: result.user.fullName, platformRole: result.user.platformRole, mustChangePassword: result.user.mustChangePassword } });
  } catch (cause) {
    return errorResponse(cause);
  }
};
