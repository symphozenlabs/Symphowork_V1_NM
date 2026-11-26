import * as service from "@/modules/platform/support-communication";
import { endpoint } from "$lib/server/support-http";
import { PLATFORM_PERMISSIONS as p } from "@/modules/platform/authorization";

export const GET = endpoint(
  ({ url }) =>
    service.listPlatformSupportSubmissions({
      queryType: url.searchParams.get("type") ?? "",
      query: url.searchParams.get("q") ?? "",
      page: Number(url.searchParams.get("page")) || 1,
    }),
  p.supportSubmissionView,
);
