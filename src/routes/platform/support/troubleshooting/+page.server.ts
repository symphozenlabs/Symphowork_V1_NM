import { error } from "@sveltejs/kit";
import { hasPlatformPermission, PLATFORM_PERMISSIONS } from "$lib/auth/platform";
import { loadApiData } from "$lib/server/load-api-data";

type Organization = { id: string; name: string; slug: string; status: string };

export const load: import("./$types").PageServerLoad = async ({ request, url, parent }) => {
  const { context } = await parent();
  if (!hasPlatformPermission(context.user.platformRole, PLATFORM_PERMISSIONS.supportView)) {
    error(403, "Support troubleshooting access is required.");
  }
  const query = url.searchParams.get("q") ?? url.searchParams.get("query") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const params = new URLSearchParams({ query, page: String(page), pageSize: "10" });
  const result = await loadApiData<{
    organizations: Organization[];
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  }>(request, "/api/platform/support?" + params);
  return {
    communication: hasPlatformPermission(
      context.user.platformRole,
      PLATFORM_PERMISSIONS.supportSubmissionView
    ),
    result,
    query,
    serializedRows: result.organizations,
  };
};
