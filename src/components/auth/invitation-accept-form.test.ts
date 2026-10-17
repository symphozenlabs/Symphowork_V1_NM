import { describe, expect, it } from "vitest";
import { getPasswordStrength } from "./invitation-accept-form";

describe("getPasswordStrength", () => {
  it("returns empty score 0 for empty password", () => {
    const res = getPasswordStrength("");
    expect(res.level).toBe("empty");
    expect(res.score).toBe(0);
    expect(res.label).toBe("");
  });

  it("returns weak for short passwords (< 8 characters)", () => {
    const res = getPasswordStrength("short1!");
    expect(res.level).toBe("weak");
    expect(res.score).toBe(1);
    expect(res.label).toBe("Weak");
  });

  it("returns fair for 8-11 character passwords with variety", () => {
    const res = getPasswordStrength("Pass1234");
    expect(res.level).toBe("fair");
    expect(res.score).toBe(2);
    expect(res.label).toBe("Fair");
  });

  it("returns fair for 12+ characters missing required policy characteristics (e.g. no uppercase)", () => {
    const res = getPasswordStrength("password12345");
    expect(res.level).toBe("fair");
    expect(res.score).toBe(2);
    expect(res.label).toBe("Fair");
  });

  it("returns good for passwords meeting base policy (12+ chars, upper, lower, digit)", () => {
    const res = getPasswordStrength("StrongPass12");
    expect(res.level).toBe("good");
    expect(res.score).toBe(3);
    expect(res.label).toBe("Good");
  });

  it("returns strong for passwords meeting base policy with special characters", () => {
    const res = getPasswordStrength("StrongPass12#");
    expect(res.level).toBe("strong");
    expect(res.score).toBe(4);
    expect(res.label).toBe("Strong");
  });

  it("returns strong for passwords meeting base policy with 16+ characters", () => {
    const res = getPasswordStrength("VeryLongPassword123");
    expect(res.level).toBe("strong");
    expect(res.score).toBe(4);
    expect(res.label).toBe("Strong");
  });
});
