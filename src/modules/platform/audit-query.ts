import { and, ilike, inArray, isNull, or } from "drizzle-orm";
import { auditLogs, users } from "@/db/schema";
import { PLATFORM_AUDIT_ROLES } from "@/lib/auth/platform";

// The audit schema has no durable event-scope column. Restrict the stream to
// unscoped events performed by a currently assigned built-in platform role.
// Organization-scoped actions are intentionally excluded, even when initiated
// by a platform operator.
export function platformAuditWhere(query?: string) {
  const platformScope = and(
    isNull(auditLogs.organizationId),
    inArray(users.platformRole, [...PLATFORM_AUDIT_ROLES]),
  );
  const normalizedQuery = query?.trim();
  if (!normalizedQuery) return platformScope;

  return and(
    platformScope,
    or(
      ilike(auditLogs.action, `%${normalizedQuery}%`),
      ilike(auditLogs.resource, `%${normalizedQuery}%`),
      ilike(users.fullName, `%${normalizedQuery}%`),
    ),
  );
}
