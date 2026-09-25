import type { BillingProvider } from "@/lib/providers";
import { AppError } from "@/lib/errors";
let configuredProvider: BillingProvider | undefined;
export function configureBillingProvider(provider: BillingProvider) { configuredProvider = provider; }
export function getBillingProvider() { if (!configuredProvider) throw new AppError("PROVISIONING_FAILED", "Billing provider is not configured.", 503); return configuredProvider; }
export function billingProviderConfigured() { return Boolean(configuredProvider); }
