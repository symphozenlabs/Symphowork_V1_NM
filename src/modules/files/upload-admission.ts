import { createHash } from "node:crypto";
import type { StorageProvider } from "@/lib/providers";
import { AppError } from "@/lib/errors";
import { getMalwareScanner, type MalwareScanStatus } from "@/lib/malware";

export type UploadFileKind = "document" | "resume";
export type UploadAdmissionInput = { kind: UploadFileKind; fileName: string; mimeType: string; bytes: Uint8Array };
export type AdmittedUpload = { contentHash: string; scanStatus: Extract<MalwareScanStatus, "clean"> };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const documentTypes = new Map([["application/pdf", [".pdf"]], ["image/jpeg", [".jpg", ".jpeg"]], ["image/png", [".png"]]]);
const resumeTypes = new Map([["application/pdf", ".pdf"], ["application/msword", ".doc"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"]]);

function extension(fileName: string) {
  return fileName.toLowerCase().slice(fileName.lastIndexOf("."));
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function hasMagicBytes(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (mimeType === "image/jpeg") return startsWith(bytes, [0xff, 0xd8, 0xff]);
  if (mimeType === "image/png") return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mimeType === "application/msword") return startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
  return false;
}

function validateInput(input: UploadAdmissionInput) {
  if (input.bytes.byteLength <= 0 || input.bytes.byteLength > MAX_FILE_SIZE) throw new AppError("VALIDATION_ERROR", "The file size is invalid.", 400);
  const expectedExtension = input.kind === "resume" ? resumeTypes.get(input.mimeType) : documentTypes.get(input.mimeType)?.[0];
  if (!expectedExtension) throw new AppError("VALIDATION_ERROR", "The file type is not supported.", 400);
  if (input.kind === "resume" && extension(input.fileName) !== expectedExtension) throw new AppError("VALIDATION_ERROR", "The file extension does not match its type.", 400);
  if (input.kind === "document" && !documentTypes.get(input.mimeType)?.includes(extension(input.fileName))) throw new AppError("VALIDATION_ERROR", "The file extension does not match its type.", 400);
  if (!hasMagicBytes(input.mimeType, input.bytes)) throw new AppError("VALIDATION_ERROR", "The file signature is invalid.", 400);
}

export function requireCleanFile(scanStatus: string) {
  if (scanStatus !== "clean") throw new AppError("FORBIDDEN", "File access is unavailable until security scanning completes.", 403);
}

export async function admitUpload(input: UploadAdmissionInput): Promise<AdmittedUpload> {
  validateInput(input);
  const contentHash = createHash("sha256").update(input.bytes).digest("hex");
  const result = await getMalwareScanner().scan({ bytes: input.bytes, fileName: input.fileName, mimeType: input.mimeType, contentHash });
  if (result.status === "infected") throw new AppError("VALIDATION_ERROR", "The file was rejected by security scanning.", 422);
  if (result.status !== "clean") throw new AppError("PROVISIONING_FAILED", "The file could not be cleared by security scanning.", 503);
  return { contentHash, scanStatus: "clean" };
}

export async function admitAndUploadFile(input: UploadAdmissionInput & { storage: StorageProvider; storageKey: string }) {
  const admission = await admitUpload(input);
  try {
    await input.storage.upload(input.storageKey, input.bytes, input.mimeType);
    return admission;
  } catch (error) {
    try { await input.storage.delete(input.storageKey); } catch { /* best-effort cleanup */ }
    throw error;
  }
}
