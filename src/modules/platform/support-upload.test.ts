import { beforeEach, describe, expect, it, vi } from "vitest";
import { supportAttachments, supportSubmissions } from "@/db/schema";
import { createSupportSubmission } from "./support-communication";
const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
  audit: vi.fn(),
  scan: vi.fn(),
  execute: vi.fn(),
}));
vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: async () => ({
    organization: { id: "org", name: "Workspace" },
    user: { id: "alice", fullName: "Alice", email: "alice@example.test" },
    membership: { status: "active" },
    role: { key: "EMPLOYEE" },
  }),
}));
vi.mock("@/lib/storage", () => ({
  getStorageProvider: () => ({ upload: mocks.upload, delete: mocks.remove }),
}));
vi.mock("@/lib/malware", () => ({
  getMalwareScanner: () => ({ scan: mocks.scan }),
}));
vi.mock("@/lib/audit", () => ({ recordAuditInTransaction: mocks.audit }));
vi.mock("@/db/client", () => ({
  withTenantTransaction: async (_org: string, run: Function) =>
    run({
      execute: mocks.execute,
      insert: (table: unknown) => ({
        values: (data: object) => ({
          returning: async () => [
            {
              ...data,
              id:
                table === supportSubmissions
                  ? "submission"
                  : table === supportAttachments
                    ? "attachment"
                    : "unknown",
            },
          ],
        }),
      }),
    }),
}));
const input = {
  organizationId: "org",
  submitterUserId: "alice",
  submitterName: "Spoof",
  submitterEmail: "invalid",
  organizationName: "Wrong",
  organizationRole: "OWNER",
  query: {
    queryType: "other",
    subject: "Private subject",
    description: "Private description",
  },
};
const file = {
  bytes: new TextEncoder().encode("%PDF-1.7 fixture"),
  mimeType: "application/pdf",
  fileName: "test.pdf",
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.remove.mockResolvedValue(undefined);
  mocks.scan.mockResolvedValue({ status: "clean" });
});
describe("private support uploads", () => {
  it("derives identity, scans before storage and records safe audit metadata", async () => {
    const result = await createSupportSubmission({ ...input, file });
    expect(result.submission).toMatchObject({
      submitterName: "Alice",
      organizationName: "Workspace",
    });
    expect(result.attachment).not.toHaveProperty("storageKey");
    expect(mocks.scan.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.upload.mock.invocationCallOrder[0],
    );
    const audits = mocks.audit.mock.calls.map(([, event]) => event);
    expect(audits.map((a) => a.action)).toEqual([
      "support_attachment_uploaded",
      "support_submission_created",
    ]);
    expect(audits.every((a) => a.metadata.actorRole === "EMPLOYEE")).toBe(true);
    expect(JSON.stringify(audits)).not.toMatch(
      /Private description|Private subject|test.pdf|example.test/,
    );
  });
  it("allows a query without a file", async () => {
    expect((await createSupportSubmission(input)).attachment).toBeNull();
    expect(mocks.scan).not.toHaveBeenCalled();
  });
  it("cleans the object when transactional audit fails", async () => {
    mocks.audit.mockRejectedValue(new Error("audit unavailable"));
    await expect(createSupportSubmission({ ...input, file })).rejects.toThrow(
      "audit unavailable",
    );
    expect(mocks.remove).toHaveBeenCalledWith(mocks.upload.mock.calls[0][0]);
  });
  it("rejects oversized and uncleared files before storage", async () => {
    await expect(
      createSupportSubmission({
        ...input,
        file: { ...file, bytes: new Uint8Array(2097153) },
      }),
    ).rejects.toMatchObject({ status: 400 });
    mocks.scan.mockResolvedValue({ status: "infected" });
    await expect(
      createSupportSubmission({ ...input, file }),
    ).rejects.toMatchObject({ status: 422 });
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
