import { afterEach, describe, expect, it, vi } from "vitest";
import { error as kitError } from "@sveltejs/kit";
import { z } from "zod";
import { AppError, errorResponse } from "./errors";

describe("errorResponse", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns stable 400 validation envelopes for Zod errors without reflecting rejected values", async () => {
    const rejectedSecret = "private-test-input";
    let cause: unknown;
    try {
      z.string().email().parse(rejectedSecret);
    } catch (error) {
      cause = error;
    }

    const response = errorResponse(cause);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ success: false, error: { code: "VALIDATION_ERROR", message: "Request validation failed." } });
    expect(JSON.stringify(body)).not.toContain(rejectedSecret);
  });

  it("maps malformed JSON and PostgreSQL invalid identifiers to 400", async () => {
    const malformedJson = errorResponse(new SyntaxError("unexpected input"));
    const invalidIdentifier = errorResponse(Object.assign(new Error("database detail"), { code: "22P02" }));

    expect(malformedJson.status).toBe(400);
    expect((await malformedJson.json()).error.code).toBe("VALIDATION_ERROR");
    expect(invalidIdentifier.status).toBe(400);
    expect((await invalidIdentifier.json()).error.message).toBe("A request identifier is invalid.");
  });

  it("maps wrapped database connection failures to a sanitized 503", async () => {
    const cause = Object.assign(new Error("connection parameters must not escape"), { code: "ECONNREFUSED" });
    const wrapped = Object.assign(new Error("driver wrapper must not escape"), { cause });
    const response = errorResponse(wrapped);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toEqual({ code: "SERVICE_UNAVAILABLE", message: "The application data service is unavailable." });
    expect(JSON.stringify(body)).not.toContain("connection parameters");
    expect(JSON.stringify(body)).not.toContain("driver wrapper");
  });

  it("maps missing database configuration to a sanitized 503", async () => {
    const response = errorResponse(Object.assign(new Error("configuration details"), { name: "DatabaseConfigurationError" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toEqual({ code: "SERVICE_UNAVAILABLE", message: "The application database is not configured." });
    expect(JSON.stringify(body)).not.toContain("configuration details");
  });

  it.each([
    [401, "UNAUTHORIZED", "Please sign in."],
    [403, "FORBIDDEN", "You are not authorized to access this resource."],
    [503, "SERVICE_UNAVAILABLE", "Verified tenant context is unavailable."]
  ] as const)("preserves SvelteKit HTTP status %s with a sanitized API envelope", async (status, code, message) => {
    let cause: unknown;
    try {
      kitError(status, "sensitive implementation detail");
    } catch (error) {
      cause = error;
    }

    const response = errorResponse(cause);
    const body = await response.json();

    expect(response.status).toBe(status);
    expect(body).toEqual({ success: false, error: { code, message } });
    expect(JSON.stringify(body)).not.toContain("sensitive implementation detail");
  });

  it("preserves sanitized role guard errors for DatabaseConfigurationError", async () => {
    const roleError = "DATABASE_URL must authenticate directly as sympowork_app; owner and administrative roles are not allowed for application runtime.";
    const response = errorResponse(Object.assign(new Error(roleError), { name: "DatabaseConfigurationError" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toEqual({ code: "SERVICE_UNAVAILABLE", message: roleError });
  });

  it("preserves explicit AppError statuses and does not expose unexpected error details", async () => {
    const expected = errorResponse(new AppError("NOT_FOUND", "Record not found.", 404));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const internal = errorResponse(new Error("database password and query details"));
    const internalBody = await internal.json();

    expect(expected.status).toBe(404);
    expect((await expected.json()).error).toEqual({ code: "NOT_FOUND", message: "Record not found." });
    expect(internal.status).toBe(500);
    expect(JSON.stringify(internalBody)).not.toContain("database password");
    expect(log).toHaveBeenCalledWith("unhandled_application_error", "Error");
  });
});
