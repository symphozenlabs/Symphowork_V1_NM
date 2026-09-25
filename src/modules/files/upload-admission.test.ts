import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { configureMalwareScanner, resetMalwareScannerForTests } from "@/lib/malware";
import type { StorageProvider } from "@/lib/providers";
import { admitAndUploadFile, admitUpload, requireCleanFile } from "@/modules/files/upload-admission";

const pdf = new TextEncoder().encode("%PDF-1.7\nSymphoWork test document");
const docx = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x53, 0x79, 0x6d, 0x70, 0x68, 0x6f]);

function scanner(status: "clean" | "infected" | "failed") {
  return { scan: vi.fn(async () => ({ status })) };
}

function storage(): StorageProvider & { upload: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> } {
  return { upload: vi.fn(async () => undefined), download: vi.fn(), delete: vi.fn(async () => undefined), getSignedUrl: vi.fn() };
}

afterEach(() => resetMalwareScannerForTests());

describe("file upload admission", () => {
  it("fails closed when no real scanner is configured", async () => {
    await expect(admitUpload({ kind: "document", fileName: "file.pdf", mimeType: "application/pdf", bytes: pdf })).rejects.toMatchObject({ code: "PROVISIONING_FAILED" });
  });

  it("admits clean content and calculates a SHA-256 hash", async () => {
    const configured = scanner("clean");
    configureMalwareScanner(configured);
    await expect(admitUpload({ kind: "document", fileName: "file.pdf", mimeType: "application/pdf", bytes: pdf })).resolves.toMatchObject({ scanStatus: "clean", contentHash: expect.stringMatching(/^[a-f0-9]{64}$/) });
    expect(configured.scan).toHaveBeenCalledOnce();
  });

  it.each([["infected", "VALIDATION_ERROR"], ["failed", "PROVISIONING_FAILED"]] as const)("rejects %s scanner results", async (status, code) => {
    configureMalwareScanner(scanner(status));
    await expect(admitUpload({ kind: "resume", fileName: "resume.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: docx })).rejects.toMatchObject({ code });
  });

  it.each([
    ["invalid MIME", { fileName: "file.exe", mimeType: "application/octet-stream", bytes: pdf }],
    ["invalid extension", { fileName: "file.png", mimeType: "application/pdf", bytes: pdf }],
    ["invalid magic bytes", { fileName: "file.pdf", mimeType: "application/pdf", bytes: new TextEncoder().encode("not a pdf") }],
    ["oversized file", { fileName: "file.pdf", mimeType: "application/pdf", bytes: new Uint8Array(10 * 1024 * 1024 + 1) }],
  ] as const)("rejects %s before storage admission", async (_name, input) => {
    const configured = scanner("clean");
    configureMalwareScanner(configured);
    await expect(admitUpload({ kind: "document", ...input })).rejects.toBeInstanceOf(AppError);
    expect(configured.scan).not.toHaveBeenCalled();
  });

  it("rejects a public ATS resume before it can reach storage", async () => {
    configureMalwareScanner(scanner("infected"));
    const target = storage();
    await expect(admitAndUploadFile({ kind: "resume", fileName: "resume.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: docx, storage: target, storageKey: "org/candidates/candidate/resumes/file.docx" })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(target.upload).not.toHaveBeenCalled();
  });

  it("rejects an employee document before it can reach storage", async () => {
    configureMalwareScanner(scanner("failed"));
    const target = storage();
    await expect(admitAndUploadFile({ kind: "document", fileName: "employee.pdf", mimeType: "application/pdf", bytes: pdf, storage: target, storageKey: "org/employees/employee/documents/file.pdf" })).rejects.toMatchObject({ code: "PROVISIONING_FAILED" });
    expect(target.upload).not.toHaveBeenCalled();
  });

  it("uploads only clean content", async () => {
    configureMalwareScanner(scanner("clean"));
    const target = storage();
    await expect(admitAndUploadFile({ kind: "document", fileName: "receipt.pdf", mimeType: "application/pdf", bytes: pdf, storage: target, storageKey: "org/expenses/item/receipt.pdf" })).resolves.toMatchObject({ scanStatus: "clean" });
    expect(target.upload).toHaveBeenCalledOnce();
  });

  it("cleans up when storage upload fails", async () => {
    configureMalwareScanner(scanner("clean"));
    const target = storage();
    target.upload.mockRejectedValueOnce(new Error("storage unavailable"));
    await expect(admitAndUploadFile({ kind: "document", fileName: "file.pdf", mimeType: "application/pdf", bytes: pdf, storage: target, storageKey: "org/file.pdf" })).rejects.toThrow("storage unavailable");
    expect(target.delete).toHaveBeenCalledWith("org/file.pdf");
  });

  it("blocks signed URL and processing access unless scan status is clean", () => {
    expect(() => requireCleanFile("pending")).toThrow(AppError);
    expect(() => requireCleanFile("infected")).toThrow(AppError);
    expect(() => requireCleanFile("scan_failed")).toThrow(AppError);
    expect(() => requireCleanFile("clean")).not.toThrow();
  });
});
