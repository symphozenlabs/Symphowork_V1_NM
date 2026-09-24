import { describe, expect, it } from "vitest";
import { AppError, errorResponse } from "@/lib/errors";

describe("errorResponse", () => {
  it("returns a safe, machine-readable application error", async () => {
    const response = errorResponse(new AppError("VALIDATION_ERROR", "The submitted data is invalid.", 400));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ success: false, error: { code: "VALIDATION_ERROR", message: "The submitted data is invalid." } });
  });
});
