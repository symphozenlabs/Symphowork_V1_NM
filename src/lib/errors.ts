export type ErrorCode = "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_ERROR" | "SERVICE_UNAVAILABLE" | "AUTH_INVALID_CREDENTIALS" | "AUTH_EMAIL_NOT_VERIFIED" | "AUTH_SESSION_EXPIRED" | "ORG_NOT_FOUND" | "ORG_ACCESS_DENIED" | "ORG_ALREADY_EXISTS" | "MEMBERSHIP_ALREADY_EXISTS" | "INVITATION_INVALID" | "INVITATION_EXPIRED" | "INVITATION_ALREADY_ACCEPTED" | "INVITATION_REVOKED" | "INVITATION_EMAIL_MISMATCH" | "USER_ALREADY_IN_ORGANIZATION" | "PROVISIONING_FAILED" | "INVALID_STATUS_TRANSITION" | "LAST_PLATFORM_OWNER" | "RATE_LIMITED";

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

function getDriverCode(error: unknown): string | undefined {
  const seen = new Set<object>();
  let current: unknown = error;
  for (let depth = 0; depth < 5 && typeof current === "object" && current !== null && !seen.has(current); depth++) {
    seen.add(current);
    if ("code" in current && typeof (current as { code?: unknown }).code === "string") {
      return (current as { code: string }).code;
    }
    current = "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }
  return undefined;
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    const headers: Record<string, string> = {};
    if (error.code === "RATE_LIMITED" && typeof error.metadata?.retryAfterSeconds === "number") {
      headers["Retry-After"] = String(error.metadata.retryAfterSeconds);
    }
    return Response.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status, headers: Object.keys(headers).length > 0 ? headers : undefined }
    );
  }

  // Keep malformed input on the client-error path. Do not return Zod issue
  // details: Zod v4 may include the rejected input, which can contain secrets.
  if (error instanceof SyntaxError) {
    return Response.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }

  if (error instanceof Error && error.name === "ZodError") {
    return Response.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Request validation failed." } },
      { status: 400 }
    );
  }

  if (error instanceof Error && error.name === "DatabaseConfigurationError") {
    const message = error.message.includes("sympowork_app")
      ? error.message
      : "The application database is not configured.";
    return Response.json(
      { success: false, error: { code: "SERVICE_UNAVAILABLE", message } },
      { status: 503 }
    );
  }

  // PostgreSQL invalid-text-representation (commonly malformed UUID input)
  // is a controlled client error. Do not expose the driver message.
  const driverCode = getDriverCode(error);
  if (driverCode === "22P02") {
    return Response.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "A request identifier is invalid." } },
      { status: 400 }
    );
  }

  if (["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENETUNREACH", "EHOSTUNREACH", "ENOTFOUND", "08000", "08001", "08003", "08004", "08006", "57P03"].includes(driverCode ?? "")) {
    return Response.json(
      { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "The application data service is unavailable." } },
      { status: 503 }
    );
  }

  // Driver errors can contain SQL, connection details, and submitted values.
  // Record only the error class; keep details out of responses and logs.
  console.error("unhandled_application_error", error instanceof Error ? error.name : "UnknownError");
  return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong." } }, { status: 500 });
}
