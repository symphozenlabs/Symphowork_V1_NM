import { error, redirect } from "@sveltejs/kit";
import { hasPlatformPermission, PLATFORM_PERMISSIONS as p } from "$lib/auth/platform";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, url }) => {
  const { context } = await parent();
  if (!hasPlatformPermission(context.user.platformRole, p.supportSubmissionView))
    error(403, "Support communication access is required.");
  redirect(308, "/platform/support" + url.search);
};
