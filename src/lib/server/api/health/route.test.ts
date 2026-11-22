import { beforeEach, describe, expect, it, vi } from "vitest";
const databaseStatus = vi.hoisted(() => ({ configured: false, sql: vi.fn() }));
vi.mock("@/db/client", () => ({
  isDatabaseConfigured: () => databaseStatus.configured,
  sql: databaseStatus.sql
}));
import { GET } from "./route";

describe("health readiness", () => {
  beforeEach(() => { databaseStatus.configured = false; databaseStatus.sql.mockReset(); });

  it("does not report ready when database configuration is missing", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("not_configured");
    expect(databaseStatus.sql).not.toHaveBeenCalled();
  });
});
