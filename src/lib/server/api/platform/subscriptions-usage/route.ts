import { errorResponse } from "@/lib/errors";
import { listPlatformSubscriptionsUsage } from "@/modules/platform/commercial";
import type { ListSubscriptionsUsageInput } from "@/modules/platform/subscriptions-usage";

const supportedStatuses = new Set([
  "all", "active", "trialing", "attention_required", "suspended", "inactive",
  "within_limit", "near_limit", "limit_reached", "over_limit",
]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawStatus = url.searchParams.get("status") ?? "all";
    const input: ListSubscriptionsUsageInput = {
      query: url.searchParams.get("query") ?? url.searchParams.get("q") ?? undefined,
      status: supportedStatuses.has(rawStatus) ? rawStatus as ListSubscriptionsUsageInput["status"] : "all",
      plan: url.searchParams.get("plan") ?? undefined,
      billing: url.searchParams.get("billing") ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1"),
      pageSize: Number(url.searchParams.get("pageSize") ?? "10"),
    };
    return Response.json({ success: true, ...await listPlatformSubscriptionsUsage(input) });
  } catch (error) {
    return errorResponse(error);
  }
}
