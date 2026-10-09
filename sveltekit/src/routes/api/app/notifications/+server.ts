import { AppError, errorResponse } from "@/lib/errors";
import { listNotifications, markAllNotificationsRead, unreadNotificationCount } from "@/modules/notifications/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      const url = new URL(event.request.url);
      const notifications = await listNotifications({
        organizationId: tenant.organization.id,
        userId: user.id,
        unreadOnly: url.searchParams.get("unread") === "true",
        limit: Number(url.searchParams.get("limit") ?? 50)
      });
      return { success: true, notifications, unreadCount: await unreadNotificationCount(tenant.organization.id, user.id) };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const PATCH: RequestHandler = async (event) => {
  try {
    const body = await event.request.json() as { markAllRead?: boolean };
    if (!body.markAllRead) throw new AppError("VALIDATION_ERROR", "markAllRead is required.", 400);
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      return { success: true, result: await markAllNotificationsRead(tenant.organization.id, user.id) };
    }));
  } catch (cause) { return errorResponse(cause); }
};
