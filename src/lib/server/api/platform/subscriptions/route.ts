import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { listSubscriptions, updateSubscription } from "@/modules/platform/commercial";
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const result = await listSubscriptions({
      query: url.searchParams.get("query") ?? url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      billingInterval: url.searchParams.get("billing") ?? url.searchParams.get("billingInterval") ?? url.searchParams.get("billingCycle") ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1"),
      pageSize: Number(url.searchParams.get("pageSize") ?? "10"),
    });
    return NextResponse.json({
      success: true,
      ...result,
      subscriptions: result.rows,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) { try { const user = await requireSession(); return NextResponse.json({ success: true, subscription: await updateSubscription(await request.json(), user.id) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
