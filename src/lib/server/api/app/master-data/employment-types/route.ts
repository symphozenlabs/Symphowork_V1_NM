import { eq } from "drizzle-orm";
import { z } from "zod";
import { withTenantTransaction } from "@/db/client";
import { employmentTypes } from "@/db/schema";
import { AppError, errorResponse } from "@/lib/errors";
import { authorize, authorizeAny } from "@/modules/tenancy/authorization";
import { resolveTenantContext } from "@/modules/tenancy/context";

import { tenantApiRead } from "@/lib/server/tenant-api-read";

const schema = z.object({ name: z.string().trim().min(2).max(80), code: z.string().trim().toUpperCase().min(2).max(40) });

export async function GET() {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) return Response.json({ success: true, items: [] });
    await authorizeAny({
      organizationId: tenant.organization.id,
      permissions: [
        "organization.settings.read",
        "employee.create",
        "employee.read",
      ],
    });

    const organizationId = tenant.organization.id;
    const items = await tenantApiRead(tenant, (executor) => {
      if (executor) {
        return executor.select().from(employmentTypes).where(eq(employmentTypes.organizationId, organizationId));
      }
      return withTenantTransaction(organizationId, async (tx) =>
        tx.select().from(employmentTypes).where(eq(employmentTypes.organizationId, organizationId))
      );
    });

    return Response.json({ success: true, items });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    await authorize({ organizationId: tenant.organization.id, permission: "organization.settings.update" });
    const organizationId = tenant.organization.id;
    const input = schema.parse(await request.json());
    const [item] = await withTenantTransaction(organizationId, async (tx) =>
      tx.insert(employmentTypes).values({ organizationId, ...input }).returning()
    );
    return Response.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
