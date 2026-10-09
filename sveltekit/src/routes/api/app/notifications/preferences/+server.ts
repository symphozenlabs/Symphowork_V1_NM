import { AppError, errorResponse } from "@/lib/errors";
import { listNotificationPreferences, updateNotificationPreference } from "@/modules/notifications/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";
import type { NotificationInput } from "@/modules/notifications/service";

type Category = NotificationInput["category"];

export const GET: RequestHandler = async (event) => {
  try {
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      return { success: true, preferences: await listNotificationPreferences(tenant.organization.id, user.id) };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    const body = await event.request.json() as { category?: Category; inAppEnabled?: boolean; emailEnabled?: boolean };
    if (!body.category) throw new AppError("VALIDATION_ERROR", "Notification category is required.", 400);
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      return { success: true, preference: await updateNotificationPreference({ organizationId: tenant.organization.id, userId: user.id, category: body.category!, inAppEnabled: body.inAppEnabled, emailEnabled: body.emailEnabled }) };
    }));
  } catch (cause) { return errorResponse(cause); }
};
