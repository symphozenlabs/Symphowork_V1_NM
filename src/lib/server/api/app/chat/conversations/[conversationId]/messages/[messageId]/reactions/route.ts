import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { toggleMessageReaction } from "@/modules/collaboration/service";
import {
  conversationIdParamSchema,
  messageIdParamSchema,
  parseBody,
  toggleReactionSchema,
} from "@/modules/collaboration/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    enforceRateLimit(`chat:react:${tenant.organization.id}:${tenant.user.id}`, 120, 60000);

    const { conversationId: rawConvId, messageId: rawMsgId } = await context.params;
    conversationIdParamSchema.parse(rawConvId);
    const messageId = messageIdParamSchema.parse(rawMsgId);

    const body = parseBody(toggleReactionSchema, await request.json());

    const result = await toggleMessageReaction({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      messageId,
      emoji: body.emoji,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
