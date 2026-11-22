import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { createConversation, listConversations } from "@/modules/collaboration/service";
import { createConversationSchema, parseBody } from "@/modules/collaboration/validation";

export async function GET() {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const conversations = await listConversations({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
    });
    const unreadConversationCount = conversations.filter((c) => (c.unreadCount ?? 0) > 0).length;
    return NextResponse.json({ success: true, conversations, unreadConversationCount });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const body = parseBody(createConversationSchema, await request.json());
    const conversation = await createConversation({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      type: body.type,
      name: body.name,
      employeeIds: body.employeeIds,
    });
    return NextResponse.json({ success: true, conversation }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

