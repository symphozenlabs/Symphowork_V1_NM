import fs from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "@/lib/providers";
import { AppError } from "@/lib/errors";

const MAX_KEY_LENGTH = 500;

export function validateStorageKey(key: string) {
  if (!key || key.length > MAX_KEY_LENGTH || key.startsWith("/") || key.includes("\\") || key.includes("//")) {
    throw new AppError("VALIDATION_ERROR", "The storage key is invalid.", 400);
  }

  const segments = key.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new AppError("VALIDATION_ERROR", "The storage key is invalid.", 400);
  }

  if ([...key].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
    throw new AppError("VALIDATION_ERROR", "The storage key is invalid.", 400);
  }

  return key;
}

export function createLocalStorageProvider(baseDir: string = path.join(process.cwd(), ".storage")): StorageProvider & { healthCheck(): Promise<void> } {
  const resolvePath = (key: string) => {
    const safeKey = validateStorageKey(key);
    const resolved = path.resolve(baseDir, safeKey);
    if (!resolved.startsWith(path.resolve(baseDir))) {
      throw new AppError("VALIDATION_ERROR", "Invalid storage path traversal.", 400);
    }
    return resolved;
  };

  return {
    async upload(key, body) {
      const filePath = resolvePath(key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, Buffer.from(body));
    },
    async download(key) {
      const filePath = resolvePath(key);
      try {
        const buffer = await fs.readFile(filePath);
        return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          throw new AppError("NOT_FOUND", "The requested document was not found in storage.", 404);
        }
        throw new AppError("PROVISIONING_FAILED", "Failed to retrieve document from storage.", 500);
      }
    },
    async delete(key) {
      const filePath = resolvePath(key);
      try {
        await fs.unlink(filePath);
      } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          throw new AppError("PROVISIONING_FAILED", "Failed to delete document from storage.", 500);
        }
      }
    },
    async getSignedUrl(key) {
      validateStorageKey(key);
      return `/api/app/storage/file?key=${encodeURIComponent(key)}`;
    },
    async healthCheck() {
      await fs.mkdir(baseDir, { recursive: true });
    },
  };
}
