import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { employmentTypes } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { authorize, authorizeAny } from "@/modules/tenancy/authorization";
import { resolveTenantContext } from "@/modules/tenancy/context";

const STANDARD_EMPLOYMENT_TYPES = [
  { name: "Full-time Regular", code: "FULL_TIME" },
  { name: "Part-time", code: "PART_TIME" },
  { name: "Contract", code: "CONTRACT" },
  { name: "Internship", code: "INTERN" },
  { name: "Probationary", code: "PROBATION" },
] as const;

const schema = z.object({ name: z.string().trim().min(2).max(80), code: z.string().trim().toUpperCase().min(2).max(40) });

export async function GET() {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) return NextResponse.json({ success: true, items: [] });
    await authorizeAny({
      organizationId: tenant.organization.id,
      permissions: [
        "organization.settings.read",
        "employee.create",
        "employee.read",
      ],
    });

    let items = await db
      .select()
      .from(employmentTypes)
      .where(eq(employmentTypes.organizationId, tenant.organization.id));

    if (items.length === 0) {
      // Auto-populate standard employment types if not configured
      await db
        .insert(employmentTypes)
        .values(
          STANDARD_EMPLOYMENT_TYPES.map((t) => ({
            organizationId: tenant.organization.id,
            name: t.name,
            code: t.code,
          }))
        )
        .onConflictDoNothing();

      items = await db
        .select()
        .from(employmentTypes)
        .where(eq(employmentTypes.organizationId, tenant.organization.id));
    }

    return NextResponse.json({ success: true, items });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new Error("organization required");
    await authorize({ organizationId: tenant.organization.id, permission: "organization.settings.update" });
    const [item] = await db
      .insert(employmentTypes)
      .values({ organizationId: tenant.organization.id, ...schema.parse(await request.json()) })
      .returning();
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
