import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { getUnreadConversationCount } from "@/modules/collaboration/service";

export async function GET() {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const count = await getUnreadConversationCount({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    return errorResponse(error);
  }
}
