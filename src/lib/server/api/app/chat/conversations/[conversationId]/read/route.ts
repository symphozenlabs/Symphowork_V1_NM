import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { markConversationAsRead } from "@/modules/collaboration/service";
import { conversationIdParamSchema } from "@/modules/collaboration/validation";

export async function POST(
  _request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }
    const { conversationId: rawId } = await context.params;
    const conversationId = conversationIdParamSchema.parse(rawId);

    const result = await markConversationAsRead({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      conversationId,
    });

    return NextResponse.json({
      success: true,
      lastReadAt: result.lastReadAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
