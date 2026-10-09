import { errorResponse } from "@/lib/errors";
import { billingProviderConfigured } from "@/lib/billing";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withPlatformRequest(event, async () => { await authorizePlatform(PLATFORM_PERMISSIONS.billingView); const configured = billingProviderConfigured(); return { success: true, providerConfigured: configured, provider: configured ? "configured" : null }; })); } catch (cause) { return errorResponse(cause); } };
