import { eq } from "drizzle-orm";
import { withTenantTransaction } from "@/db/client";
import { designations } from "@/db/schema";
import { AppError, errorResponse } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize, authorizeAny } from "@/modules/tenancy/authorization";
import { z } from "zod";
const schema = z.object({ name: z.string().trim().min(2).max(120), code: z.string().trim().toUpperCase().min(2).max(40), description: z.string().max(500).optional(), level: z.number().int().positive().optional() });
export async function GET() {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) return Response.json({ success: true, items: [] });
    await authorizeAny({
      organizationId: tenant.organization.id,
      permissions: ["designation.read", "employee.create", "employee.read"],
    });
    return Response.json({
      success: true,
      items: await withTenantTransaction(tenant.organization.id, async (tx) => tx.select().from(designations).where(eq(designations.organizationId, tenant.organization!.id)))
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const organizationId = tenant.organization.id;
    await authorize({ organizationId, permission: "designation.create" });
    const input = schema.parse(await request.json());
    const [item] = await withTenantTransaction(organizationId, (tx) =>
      tx.insert(designations).values({ organizationId, ...input }).returning()
    );
    return Response.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
