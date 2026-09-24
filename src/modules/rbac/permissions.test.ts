import { describe, expect, it } from "vitest";
import { ALL_PERMISSION_KEYS, PERMISSIONS, ROLE_PERMISSIONS } from "@/modules/rbac/permissions";

describe("permission registry", () => {
  it("uses stable resource.action keys", () => {
    expect(ALL_PERMISSION_KEYS).toContain("organization.manage");
    expect(Object.values(PERMISSIONS).every((key) => /^[a-z]+(?:\.[a-z]+)+$/.test(key))).toBe(true);
  });
  it("gives the owner role the complete registry", () => {
    expect(ROLE_PERMISSIONS.ORGANIZATION_OWNER).toHaveLength(ALL_PERMISSION_KEYS.length);
  });
});
