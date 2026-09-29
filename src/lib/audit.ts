import { db, withPlatformTransaction } from "@/db/client";
import { auditLogs } from "@/db/schema";
import { logger } from "@/lib/logger";

export async function recordAudit(input: { actorUserId?: string; organizationId?: string; action: string; resource: string; resourceId?: string; requestId?: string; metadata?: Record<string, unknown>; platform?: boolean }) {
  try {
    const { platform, ...values } = input;
    if (platform) await withPlatformTransaction((tx) => tx.insert(auditLogs).values({ ...values, metadata: input.metadata ? JSON.stringify(input.metadata) : undefined }));
    else await db.insert(auditLogs).values({ ...values, metadata: input.metadata ? JSON.stringify(input.metadata) : undefined });
  } catch (error) {
    logger.error("audit_log_write_failed", { action: input.action, resource: input.resource, error: error instanceof Error ? error.message : "unknown" });
  }
}
