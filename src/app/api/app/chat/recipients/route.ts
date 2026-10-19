import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { listChatRecipients } from "@/modules/collaboration/service";

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const url = new URL(request.url);
    const search = url.searchParams.get("q") ?? url.searchParams.get("search") ?? undefined;

    const recipients = await listChatRecipients({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      search: search?.trim() || undefined,
    });

    return NextResponse.json({ success: true, recipients });
  } catch (error) {
    return errorResponse(error);
  }
}
