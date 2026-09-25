export type ErrorCode = "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_ERROR" | "AUTH_INVALID_CREDENTIALS" | "AUTH_EMAIL_NOT_VERIFIED" | "AUTH_SESSION_EXPIRED" | "ORG_NOT_FOUND" | "ORG_ACCESS_DENIED" | "ORG_ALREADY_EXISTS" | "MEMBERSHIP_ALREADY_EXISTS" | "INVITATION_INVALID" | "INVITATION_EXPIRED" | "INVITATION_ALREADY_ACCEPTED" | "USER_ALREADY_IN_ORGANIZATION" | "PROVISIONING_FAILED" | "INVALID_STATUS_TRANSITION" | "LAST_PLATFORM_OWNER";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status = 500,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
  }
  console.error(JSON.stringify({ event: "unhandled_application_error", timestamp: new Date().toISOString() }));
  return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong." } }, { status: 500 });
}
