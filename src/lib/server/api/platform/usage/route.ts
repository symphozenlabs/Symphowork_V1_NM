import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listOrganizationUsage } from "@/modules/platform/commercial";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const result = await listOrganizationUsage({
      query: url.searchParams.get("query") ?? url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      plan: url.searchParams.get("plan") ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1"),
      pageSize: Number(url.searchParams.get("pageSize") ?? "10"),
    });

    if (Array.isArray(result)) {
      return NextResponse.json({ success: true, usage: result });
    }

    return NextResponse.json({
      success: true,
      ...result,
      usage: result.rows,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
