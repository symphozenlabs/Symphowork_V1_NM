import { afterEach, describe, expect, it, vi } from "vitest";

const postgresFactory = vi.hoisted(() => vi.fn());
vi.mock("node:fs", () => ({ existsSync: () => false, readFileSync: () => "" }));
vi.mock("postgres", () => ({ default: postgresFactory }));

describe("database client configuration", () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
    vi.resetModules();
  });

  it("fails closed without DATABASE_URL and never constructs a localhost client", async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();

    const { db, isDatabaseConfigured } = await import("./client");

    expect(isDatabaseConfigured()).toBe(false);
    expect(() => Reflect.get(db, "select")).toThrow("DATABASE_URL is required for database-backed application features.");
    expect(postgresFactory).not.toHaveBeenCalled();
  }, 15_000);
});
