import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { searchMessages } from "@/modules/collaboration/service";
import { searchMessagesSchema } from "@/modules/collaboration/validation";

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    enforceRateLimit(`chat:search:${tenant.organization.id}:${tenant.user.id}`, 30, 60000);

    const url = new URL(request.url);
    const rawQuery = url.searchParams.get("query") ?? "";
    const rawLimit = url.searchParams.get("limit") ?? "20";

    const parsed = searchMessagesSchema.parse({
      query: rawQuery,
      limit: rawLimit,
    });

    const results = await searchMessages({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      query: parsed.query,
      limit: parsed.limit,
    });

    return NextResponse.json({
      success: true,
      query: parsed.query,
      results,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
