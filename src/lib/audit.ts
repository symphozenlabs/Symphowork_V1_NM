import { db } from "@/db/client";
import { auditLogs } from "@/db/schema";
import { logger } from "@/lib/logger";

export async function recordAudit(input: { actorUserId?: string; organizationId?: string; action: string; resource: string; resourceId?: string; requestId?: string; metadata?: Record<string, unknown> }) {
  try {
    await db.insert(auditLogs).values({ ...input, metadata: input.metadata ? JSON.stringify(input.metadata) : undefined });
  } catch (error) {
    logger.error("audit_log_write_failed", { action: input.action, resource: input.resource, error: error instanceof Error ? error.message : "unknown" });
  }
}
