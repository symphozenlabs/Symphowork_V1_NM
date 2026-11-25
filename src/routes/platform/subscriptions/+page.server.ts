import { loadApiData } from "$lib/server/load-api-data";
import type { SerializedSubscriptionUsageRow } from "$lib/components/platform/SubscriptionUsageManagement.svelte";

export const load: import("./$types").PageServerLoad = async ({ request, url, parent }) => {
  await parent();
  const query = url.searchParams.get("q") ?? url.searchParams.get("query") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const status = url.searchParams.get("status") ?? "all";
  const plan = url.searchParams.get("plan") ?? "all";
  const billing = url.searchParams.get("billing") ?? "all";
  const params = new URLSearchParams({ query, page: String(page), pageSize: "10", status, plan, billing });
  const result = await loadApiData<{
    rows: SerializedSubscriptionUsageRow[];
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
    availablePlans: Array<{ id: string; code: string; name: string }>;
  }>(request, `/api/platform/subscriptions-usage?${params}`);
  return { result, query, status, plan, billing };
};
