import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dispatchApi, matchRoute, ROUTE_ENTRIES } from "./api-dispatch";

type ApiManifestEntry = { route: string; methods: string[] };
const manifest = JSON.parse(
  readFileSync(new URL("./api-manifest.json", import.meta.url), "utf8")
) as ApiManifestEntry[];

describe("SvelteKit API registry", () => {
  it("matches every inventoried original route and exported method", () => {
    expect(ROUTE_ENTRIES).toHaveLength(131);
    expect(manifest).toHaveLength(131);

    for (const source of manifest) {
      const concretePath = source.route.replace(/\[[^\]]+\]/g, "fixture-id");
      const matched = matchRoute(concretePath);
      expect(matched, source.route).not.toBeNull();
      expect(Object.keys(matched!.entry.handlers).sort(), source.route).toEqual([...source.methods].sort());
    }
  });

  it("returns controlled 404 and 405 responses without calling a route handler", async () => {
    const unknown = await dispatchApi(new Request("http://svelte.local/api/not-a-real-route"));
    const unsupported = await dispatchApi(new Request("http://svelte.local/api/auth/login"));

    expect(unknown.status).toBe(404);
    expect((await unknown.json()).error.code).toBe("NOT_FOUND");
    expect(unsupported.status).toBe(405);
    expect((await unsupported.json()).error.code).toBe("METHOD_NOT_ALLOWED");
    expect(unknown.headers.get("cache-control")).toBe("no-store");
    expect(unsupported.headers.get("cache-control")).toBe("no-store");
  });
});
