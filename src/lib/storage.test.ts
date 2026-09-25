import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { createR2StorageProvider, r2ConfigFromEnvironment, validateStorageKey, type StorageClient } from "@/lib/storage/r2";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async (_client: unknown, command: { input: unknown }, options: { expiresIn: number }) => `signed:${JSON.stringify(command.input)}:${options.expiresIn}`),
}));

const config = { bucket: "private-bucket", endpoint: "https://r2.example.test", accessKeyId: "access-key", secretAccessKey: "secret-key" };

describe("Cloudflare R2 storage provider", () => {
  it("uploads, downloads, deletes, signs, and health-checks through the S3 client", async () => {
    const commands: Array<{ input: Record<string, unknown> }> = [];
    const client: StorageClient = { send: vi.fn(async (command: { input: Record<string, unknown> }) => { commands.push(command); return { Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) } }; }) };
    const provider = createR2StorageProvider(config, client);

    await provider.upload("org-a/employees/employee-a/documents/file.pdf", new Uint8Array([4]), "application/pdf");
    await expect(provider.download("org-a/employees/employee-a/documents/file.pdf")).resolves.toEqual(new Uint8Array([1, 2, 3]));
    await provider.delete("org-a/employees/employee-a/documents/file.pdf");
    await expect(provider.getSignedUrl("org-a/employees/employee-a/documents/file.pdf")).resolves.toContain(":300");
    await expect(provider.healthCheck()).resolves.toBeUndefined();

    expect(commands).toHaveLength(4);
    expect(commands[0].input).toMatchObject({ Bucket: config.bucket, Key: "org-a/employees/employee-a/documents/file.pdf", ContentType: "application/pdf" });
    expect(commands[1].input).toMatchObject({ Bucket: config.bucket, Key: "org-a/employees/employee-a/documents/file.pdf" });
  });

  it("rejects traversal, malformed, and cross-root escape keys", () => {
    expect(() => validateStorageKey("../org-b/file.pdf")).toThrow(AppError);
    expect(() => validateStorageKey("org-a/../org-b/file.pdf")).toThrow(AppError);
    expect(() => validateStorageKey("/org-a/file.pdf")).toThrow(AppError);
    expect(() => validateStorageKey("org-a\\file.pdf")).toThrow(AppError);
    expect(validateStorageKey("org-a/employees/employee-a/file.pdf")).toBe("org-a/employees/employee-a/file.pdf");
    expect(validateStorageKey("org-b/employees/employee-b/file.pdf")).toBe("org-b/employees/employee-b/file.pdf");
  });

  it("fails safely when R2 configuration is incomplete", () => {
    vi.stubEnv("OBJECT_STORAGE_BUCKET", "private-bucket");
    vi.stubEnv("OBJECT_STORAGE_ENDPOINT", "");
    vi.stubEnv("OBJECT_STORAGE_ACCESS_KEY", "access-key");
    vi.stubEnv("OBJECT_STORAGE_SECRET_KEY", "");
    expect(() => r2ConfigFromEnvironment()).toThrow(AppError);
    vi.unstubAllEnvs();
  });

  it("caps signed URL lifetime and rejects empty object bodies", async () => {
    const client: StorageClient = { send: vi.fn(async () => ({ Body: undefined })) };
    const provider = createR2StorageProvider(config, client);
    await expect(provider.getSignedUrl("org-a/file.pdf", 3600)).resolves.toContain(":900");
    await expect(provider.download("org-a/file.pdf")).rejects.toThrow(AppError);
  });
});
