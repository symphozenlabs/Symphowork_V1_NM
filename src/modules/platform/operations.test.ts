import { describe, expect, it } from "vitest";
import { canTransitionOrganizationStatus } from "./operations";

describe("platform operations policy", () => {
  it("allows only supported organization lifecycle transitions", () => {
    expect(canTransitionOrganizationStatus("pending", "active")).toBe(true);
    expect(canTransitionOrganizationStatus("active", "suspended")).toBe(true);
    expect(canTransitionOrganizationStatus("suspended", "active")).toBe(true);
    expect(canTransitionOrganizationStatus("rejected", "active")).toBe(false);
    expect(canTransitionOrganizationStatus("archived", "active")).toBe(false);
  });
});
