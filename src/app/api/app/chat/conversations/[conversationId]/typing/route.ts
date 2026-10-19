import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { signalTyping } from "@/modules/collaboration/service";
import { conversationIdParamSchema, parseBody, signalTypingSchema } from "@/modules/collaboration/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }
    const { conversationId: rawId } = await context.params;
    const conversationId = conversationIdParamSchema.parse(rawId);
    const body = parseBody(signalTypingSchema, await request.json());

    await signalTyping({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      conversationId,
      isTyping: body.isTyping,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
