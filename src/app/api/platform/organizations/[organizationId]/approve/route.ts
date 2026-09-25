import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { changeOrganizationStatus, retryProvisioning } from "@/modules/platform/operations";
export async function POST(_: Request, context: { params: Promise<{ organizationId: string }> }) { try { const user = await requireSession(); await authorizePlatform(PLATFORM_PERMISSIONS.organizationSuspend); const { organizationId } = await context.params; const organization = await changeOrganizationStatus(organizationId, "active", user.id); const provisioning = await retryProvisioning(organizationId, user.id); return NextResponse.json({ success: true, organization, provisioning }); } catch (error) { return errorResponse(error); } }
