import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { validatePassword } from "@/modules/identity/auth";

describe("identity security primitives", () => {
  it("accepts strong passwords and never stores them as plaintext", async () => {
    const password = "SecurePassword123";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
  it("requires a strong password shape", () => {
    expect(validatePassword("weak")).toBe(false);
    expect(validatePassword("SecurePassword123")).toBe(true);
  });
});
