import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { listMessages, sendMessage } from "@/modules/collaboration/service";
import { conversationIdParamSchema, parseBody, sendMessageSchema } from "@/modules/collaboration/validation";

export async function GET(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const { conversationId: rawId } = await context.params;
    const conversationId = conversationIdParamSchema.parse(rawId);
    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit") ?? 50);
    const limit = Math.min(Math.max(isNaN(limitParam) ? 50 : limitParam, 1), 100);
    const beforeParam = url.searchParams.get("before");
    const before = beforeParam ? new Date(beforeParam) : undefined;
    const afterParam = url.searchParams.get("after");
    const after = afterParam ? new Date(afterParam) : undefined;
    const markRead = url.searchParams.get("markRead") === "true";

    const result = await listMessages({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      conversationId,
      limit,
      before,
      after,
      markRead,
    });

    return NextResponse.json({
      success: true,
      messages: result.messages,
      typers: result.typers,
      recipientPresence: result.recipientPresence,
      memberLastReadAt: result.memberLastReadAt,
      otherMemberLastReadAt: result.otherMemberLastReadAt,
      otherMemberSyncedAt: result.otherMemberSyncedAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    enforceRateLimit(`chat:msg:${tenant.organization.id}:${tenant.user.id}`, 60, 60000);
    const { conversationId: rawId } = await context.params;
    const conversationId = conversationIdParamSchema.parse(rawId);
    const body = parseBody(sendMessageSchema, await request.json());

    return NextResponse.json(
      {
        success: true,
        message: await sendMessage({
          organizationId: tenant.organization.id,
          userId: tenant.user.id,
          conversationId,
          content: body.content,
          type: body.type,
          replyToMessageId: body.replyToMessageId ?? undefined,
          clientIdempotencyKey: body.clientIdempotencyKey ?? undefined,
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

