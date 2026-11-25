import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { tenantApiRead } from "@/lib/server/tenant-api-read";
import { listNotifications, markAllNotificationsRead, unreadNotificationCount } from "@/modules/notifications/service";

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unread") === "true";
    const organizationId = tenant.organization.id;
    const [notifications, unreadCount] = await tenantApiRead(tenant, tx => Promise.all([
      listNotifications(tx, {
        organizationId,
        userId: tenant.user.id,
        unreadOnly,
        limit: Number(url.searchParams.get("limit") ?? 50),
      }),
      unreadNotificationCount(tx, organizationId, tenant.user.id),
    ]));
    return Response.json({ success: true, notifications, unreadCount });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PATCH(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const body = await request.json() as { markAllRead?: boolean }; if (!body.markAllRead) throw new AppError("VALIDATION_ERROR", "markAllRead is required.", 400); return Response.json({ success: true, result: await markAllNotificationsRead(tenant.organization.id, tenant.user.id) }); } catch (error) { return errorResponse(error); } }
