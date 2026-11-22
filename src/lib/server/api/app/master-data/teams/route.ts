import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { departments, teams } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().toUpperCase().min(2).max(40),
  description: z.string().max(500).optional(),
  departmentId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) return NextResponse.json({ success: true, items: [] });
    await authorize({ organizationId: tenant.organization.id, permission: "team.read" });

    let departmentId: string | null = null;
    let statusParam: string | null = null;

    if (request?.url) {
      const url = new URL(request.url);
      const rawDeptId = url.searchParams.get("departmentId")?.trim();
      if (rawDeptId && rawDeptId !== "undefined" && rawDeptId !== "null") {
        departmentId = rawDeptId;
      }
      const rawStatus = url.searchParams.get("status")?.trim();
      if (rawStatus && rawStatus !== "undefined" && rawStatus !== "null") {
        statusParam = rawStatus;
      }
    }

    const conditions = [eq(teams.organizationId, tenant.organization.id)];

    if (departmentId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(departmentId);
      if (!isUuid) {
        return NextResponse.json({ success: true, items: [] });
      }

      // Enforce organization/tenant isolation on department
      const [dept] = await db
        .select({ id: departments.id })
        .from(departments)
        .where(
          and(
            eq(departments.id, departmentId),
            eq(departments.organizationId, tenant.organization.id)
          )
        )
        .limit(1);

      if (!dept) {
        return NextResponse.json({ success: true, items: [] });
      }

      conditions.push(eq(teams.departmentId, departmentId));

      // When filtering by department, default to active teams unless an explicit status filter is requested
      if (statusParam === "active" || statusParam === "inactive") {
        conditions.push(eq(teams.status, statusParam));
      } else if (!statusParam) {
        conditions.push(eq(teams.status, "active"));
      }
    } else if (statusParam === "active" || statusParam === "inactive") {
      conditions.push(eq(teams.status, statusParam));
    }

    const items = await db
      .select()
      .from(teams)
      .where(and(...conditions))
      .orderBy(teams.name);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new Error("organization required");
    await authorize({ organizationId: tenant.organization.id, permission: "team.create" });
    const parsed = schema.parse(await request.json());

    if (parsed.departmentId) {
      const [dept] = await db
        .select({ id: departments.id })
        .from(departments)
        .where(
          and(
            eq(departments.id, parsed.departmentId),
            eq(departments.organizationId, tenant.organization.id)
          )
        )
        .limit(1);

      if (!dept) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Department does not belong to this organization.",
            },
          },
          { status: 400 }
        );
      }
    }

    const [item] = await db
      .insert(teams)
      .values({ organizationId: tenant.organization.id, ...parsed })
      .returning();
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
