import { recordAudit } from "@/lib/audit";

export type NotificationEvent = "attendance.regularization.submitted" | "leave.submitted" | "approval.assigned" | "approval.completed";

/** Notification boundary: delivery providers can subscribe here without coupling domain writes to email/push infrastructure. */
export async function emitNotificationEvent(input: { organizationId: string; event: NotificationEvent; recipientUserIds: string[]; subject: string; resource: string; resourceId: string }) {
  await recordAudit({ organizationId: input.organizationId, action: "notification_event_queued", resource: input.resource, resourceId: input.resourceId, metadata: { event: input.event, recipientUserIds: input.recipientUserIds, subject: input.subject } });
  return { queued: true, event: input.event };
}
