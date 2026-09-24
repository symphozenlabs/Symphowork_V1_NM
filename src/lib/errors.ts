export type ErrorCode = "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_ERROR";

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
  return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong." } }, { status: 500 });
}
