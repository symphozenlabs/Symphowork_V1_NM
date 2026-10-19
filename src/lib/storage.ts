import type { StorageProvider } from "@/lib/providers";
import { AppError } from "@/lib/errors";
import { createR2StorageProvider, r2ConfigFromEnvironment } from "@/lib/storage/r2";
import { createLocalStorageProvider } from "@/lib/storage/local";

let configuredProvider: StorageProvider | undefined;
export function configureStorageProvider(provider: StorageProvider) { configuredProvider = provider; }
function providerFromEnvironment() {
  const provider = process.env.OBJECT_STORAGE_PROVIDER?.trim().toLowerCase();
  if (provider === "r2" || provider === "cloudflare-r2") {
    return createR2StorageProvider(r2ConfigFromEnvironment());
  }
  if (provider === "local" || process.env.NODE_ENV !== "production") {
    return createLocalStorageProvider();
  }
  return undefined;
}
export function getStorageProvider() {
  if (!configuredProvider) configuredProvider = providerFromEnvironment();
  if (!configuredProvider) throw new AppError("PROVISIONING_FAILED", "Document storage is not configured.", 503);
  return configuredProvider;
}
export async function checkStorageProvider() {
  const provider = getStorageProvider() as StorageProvider & { healthCheck?: () => Promise<void> };
  if (provider.healthCheck) await provider.healthCheck();
}
export function omitStorageKey<T extends { storageKey?: unknown }>(record: T): Omit<T, "storageKey"> {
  const sanitized = { ...record } as T & { storageKey?: unknown };
  delete sanitized.storageKey;
  return sanitized;
}
