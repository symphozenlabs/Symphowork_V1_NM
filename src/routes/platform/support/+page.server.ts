import { AppError, isMissingRelationError } from "$lib/errors";
import { error, redirect } from "@sveltejs/kit";
import { hasPlatformPermission, PLATFORM_PERMISSIONS as p } from "$lib/auth/platform";
import * as support from "@/modules/platform/support-communication";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, url, depends }) => {
  const { context } = await parent();
  const role = context.user.platformRole;
  if (!hasPlatformPermission(role, p.supportSubmissionView)) {
    if (hasPlatformPermission(role, p.supportView)) redirect(307, "/platform/support/troubleshooting");
    error(403, "Support communication access is required.");
  }
  depends("support:workspace");
  const tab = url.searchParams.get("tab");
  const q = url.searchParams.get("q") ?? "";
  const queryType = url.searchParams.get("type") ?? "";
  const organization = url.searchParams.get("organization") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const parsedPage = Number(url.searchParams.get("page"));
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const id = url.searchParams.get("submission");
  if (id && !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) error(404, "Submission was not found.");
  try {
    const [inbox, detail, announcements, stats] = await Promise.all([
      tab !== "announcements" ? support.listPlatformSupportSubmissions({ query: q, page, queryType, organization, status, includeHistory: tab === "history" }) : null,
      id && tab !== "announcements" ? support.getPlatformSupportSubmission(id) : null,
      tab === "announcements" || tab === "history" ? support.listPlatformSupportAnnouncements() : [],
      support.getPlatformSupportStats(),
    ]);
    if (id && tab !== "announcements" && !detail) error(404, "Submission was not found.");
    return { tab: tab === "announcements" || tab === "history" ? tab : "inbox", q, queryType, organization, status, inbox, detail, announcements, stats, troubleshooting: hasPlatformPermission(role, p.supportView) };
  } catch (cause) {
    if (cause instanceof AppError && cause.status === 404) error(404, cause.message);
    if (isMissingRelationError(cause))
      error(503, "Customer Support is unavailable until its database migration is applied.");
    throw cause;
  }
};
