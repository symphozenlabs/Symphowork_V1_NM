import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { billingProviderConfigured } from "@/lib/billing";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
export async function GET() { try { await authorizePlatform(PLATFORM_PERMISSIONS.billingView); return NextResponse.json({ success: true, providerConfigured: billingProviderConfigured(), provider: billingProviderConfigured() ? "configured" : null }); } catch (error) { return errorResponse(error); } }
