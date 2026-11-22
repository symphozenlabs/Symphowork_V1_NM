import { afterEach, describe, expect, it, vi } from "vitest";
import { signLocalStorageUrl, verifyLocalStorageUrl } from "@/lib/storage/local-signature";
import { createLocalStorageProvider } from "@/lib/storage/local";

describe("local storage download signatures", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("signs a key and expiry with the configured server secret", () => {
    vi.stubEnv("AUTH_SECRET", "isolated-test-secret");
    const signature = signLocalStorageUrl("org-a/employees/e-1/documents/a.pdf", 1_800_000_300);

    expect(verifyLocalStorageUrl({ key: "org-a/employees/e-1/documents/a.pdf", expiresAt: 1_800_000_300, signature, nowSeconds: 1_800_000_000 })).toBe(true);
    expect(verifyLocalStorageUrl({ key: "org-b/employees/e-1/documents/a.pdf", expiresAt: 1_800_000_300, signature, nowSeconds: 1_800_000_000 })).toBe(false);
    expect(verifyLocalStorageUrl({ key: "org-a/employees/e-1/documents/a.pdf", expiresAt: 1_800_000_301, signature, nowSeconds: 1_800_000_000 })).toBe(false);
  });

  it("rejects expired and overlong URLs", () => {
    vi.stubEnv("AUTH_SECRET", "isolated-test-secret");
    const signature = signLocalStorageUrl("org-a/file.pdf", 1_800_000_300);

    expect(verifyLocalStorageUrl({ key: "org-a/file.pdf", expiresAt: 1_800_000_300, signature, nowSeconds: 1_800_000_300 })).toBe(false);
    expect(verifyLocalStorageUrl({ key: "org-a/file.pdf", expiresAt: 1_800_000_300, signature, nowSeconds: 1_800_000_000 - 601 })).toBe(false);
  });

  it("fails closed when signing configuration is missing", () => {
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => signLocalStorageUrl("org-a/file.pdf", 1_800_000_300)).toThrow("Local file delivery is not configured.");
  });

  it("returns a signed, expiring same-origin route from the local provider", async () => {
    vi.stubEnv("AUTH_SECRET", "isolated-test-secret");
    const provider = createLocalStorageProvider("C:/temporary/symphowork-test-storage");
    const before = Math.floor(Date.now() / 1000);
    const value = await provider.getSignedUrl("org-a/employees/e-1/documents/a.pdf", 300);
    const url = new URL(value, "http://localhost");
    const expiresAt = Number(url.searchParams.get("expires"));
    const key = url.searchParams.get("key") ?? "";

    expect(url.pathname).toBe("/api/app/storage/file");
    expect(expiresAt).toBeGreaterThanOrEqual(before + 300);
    expect(expiresAt).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 300);
    expect(verifyLocalStorageUrl({ key, expiresAt, signature: url.searchParams.get("signature") ?? "" })).toBe(true);
  });
});
