import { requireSession } from "@/modules/identity/auth";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";

export async function resolveTenantContext(organizationId?: string) {
  const user = await requireSession();
  return resolveTenantContextForUser(user, organizationId);
}
