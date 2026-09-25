import type { StorageProvider } from "@/lib/providers";
import { AppError } from "@/lib/errors";

let configuredProvider: StorageProvider | undefined;
export function configureStorageProvider(provider: StorageProvider) { configuredProvider = provider; }
export function getStorageProvider() { if (!configuredProvider) throw new AppError("PROVISIONING_FAILED", "Document storage is not configured.", 503); return configuredProvider; }
