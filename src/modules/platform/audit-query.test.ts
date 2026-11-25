import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { platformAuditWhere } from "./audit-query";

describe("platform audit database filter", () => {
  const dialect = new PgDialect();

  it("fails closed to unscoped events performed by the five platform roles", () => {
    const where = platformAuditWhere();
    const compiled = dialect.sqlToQuery(where!);

    expect(compiled.sql).toContain('"audit_logs"."organization_id" is null');
    expect(compiled.sql).toContain('"users"."platform_role" in');
    expect(compiled.params).toEqual(["PLATFORM_OWNER", "PRODUCT_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT", "PLATFORM_BILLING"]);
  });

  it("keeps search inside the platform-only predicate and never references tenant data", () => {
    const compiled = dialect.sqlToQuery(platformAuditWhere("tenant@example.com")!);

    expect(compiled.sql).toContain('"audit_logs"."organization_id" is null');
    expect(compiled.sql).toContain('"users"."platform_role" in');
    expect(compiled.sql).toContain('"users"."full_name" ilike');
    expect(compiled.sql).not.toContain("organizations");
    expect(compiled.sql).not.toContain('"users"."email"');
    expect(compiled.params).toContain("%tenant@example.com%");
  });
});
