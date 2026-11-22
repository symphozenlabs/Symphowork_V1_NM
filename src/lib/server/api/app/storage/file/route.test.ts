import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { signLocalStorageUrl } from "@/lib/storage/local-signature";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  resolveTenantContext: vi.fn(),
  readAuthorizedLocalFile: vi.fn()
}));

vi.mock("@/modules/tenancy/context", () => ({ resolveTenantContext: mocks.resolveTenantContext }));
vi.mock("@/modules/files/private-download", () => ({ readAuthorizedLocalFile: mocks.readAuthorizedLocalFile }));

describe("authenticated local private-file route", () => {
  const storageKey = "org-qa/employees/employee-qa/documents/document.pdf";
  const expiresAt = () => Math.floor(Date.now() / 1000) + 300;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AUTH_SECRET", "isolated-test-secret");
  });

  it("rejects forged and expired links before resolving a session", async () => {
    const expiry = expiresAt();
    const forged = new Request(`http://localhost/api/app/storage/file?key=${encodeURIComponent(storageKey)}&expires=${expiry}&signature=${"A".repeat(43)}`);
    const expiredAt = Math.floor(Date.now() / 1000) - 1;
    const expiredSignature = signLocalStorageUrl(storageKey, expiredAt);
    const expired = new Request(`http://localhost/api/app/storage/file?key=${encodeURIComponent(storageKey)}&expires=${expiredAt}&signature=${expiredSignature}`);

    const forgedResponse = await GET(forged);
    const expiredResponse = await GET(expired);

    expect(forgedResponse.status).toBe(403);
    expect(expiredResponse.status).toBe(403);
    expect(mocks.resolveTenantContext).not.toHaveBeenCalled();
    expect(mocks.readAuthorizedLocalFile).not.toHaveBeenCalled();
  });

  it("requires tenant context and returns private bytes without caching", async () => {
    const expiry = expiresAt();
    const signature = signLocalStorageUrl(storageKey, expiry);
    mocks.resolveTenantContext.mockResolvedValue({ organization: { id: "org-qa" }, user: { id: "user-qa" } });
    mocks.readAuthorizedLocalFile.mockResolvedValue({ bytes: new Uint8Array([1, 2, 3]), fileName: "document.pdf", mimeType: "application/pdf" });

    const response = await GET(new Request(`http://localhost/api/app/storage/file?key=${encodeURIComponent(storageKey)}&expires=${expiry}&signature=${signature}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    expect(mocks.readAuthorizedLocalFile).toHaveBeenCalledWith({ organizationId: "org-qa", userId: "user-qa", storageKey });
  });

  it("denies authenticated requests without organization context before storage access", async () => {
    const expiry = expiresAt();
    const signature = signLocalStorageUrl(storageKey, expiry);
    mocks.resolveTenantContext.mockResolvedValue({ organization: null, user: { id: "user-qa" } });

    const response = await GET(new Request(`http://localhost/api/app/storage/file?key=${encodeURIComponent(storageKey)}&expires=${expiry}&signature=${signature}`));

    expect(response.status).toBe(403);
    expect(mocks.readAuthorizedLocalFile).not.toHaveBeenCalled();
  });

  it("revalidates session context on every retrieval so a revoked session cannot reuse a valid link", async () => {
    const expiry = expiresAt();
    const signature = signLocalStorageUrl(storageKey, expiry);
    mocks.resolveTenantContext.mockRejectedValue(new AppError("UNAUTHORIZED", "Please sign in.", 401));

    const response = await GET(new Request(`http://localhost/api/app/storage/file?key=${encodeURIComponent(storageKey)}&expires=${expiry}&signature=${signature}`));

    expect(response.status).toBe(401);
    expect(mocks.resolveTenantContext).toHaveBeenCalledOnce();
    expect(mocks.readAuthorizedLocalFile).not.toHaveBeenCalled();
  });
});
