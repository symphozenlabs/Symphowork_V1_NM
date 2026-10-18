import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { shifts } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize, authorizeAny } from "@/modules/tenancy/authorization";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Shift name must be at least 2 characters.").max(100),
  code: z.string().trim().toUpperCase().min(2, "Shift code must be at least 2 characters.").max(40),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid start time format (use HH:MM).").default("09:00"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid end time format (use HH:MM).").default("18:00"),
  breakMinutes: z.number().int().min(0).default(60),
  graceMinutes: z.number().int().min(0).default(15),
  overnight: z.boolean().default(false)
}).refine((data) => {
  const start = data.startTime.slice(0, 5);
  const end = data.endTime.slice(0, 5);
  return start !== end;
}, {
  message: "Start time and end time cannot be identical.",
  path: ["endTime"]
}).refine((data) => {
  const start = data.startTime.slice(0, 5);
  const end = data.endTime.slice(0, 5);
  if (!data.overnight && end < start) return false;
  return true;
}, {
  message: "End time must be after start time unless marked as an overnight shift.",
  path: ["endTime"]
});

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) return NextResponse.json({ success: true, items: [] });
    await authorizeAny({
      organizationId: tenant.organization.id,
      permissions: [
        "organization.settings.read",
        "employee.create",
        "employee.read",
        "attendance.read",
      ],
    });

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");

    return NextResponse.json({
      success: true,
      items: await db
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.organizationId, tenant.organization.id),
            ...(statusParam ? [eq(shifts.status, statusParam as "active" | "inactive")] : [])
          )
        )
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    await authorize({ organizationId: tenant.organization.id, permission: "organization.settings.update" });

    const raw = (await request.json()) as Record<string, unknown>;
    const normalized = {
      ...raw,
      startTime: raw.startTime ?? raw.start_time,
      endTime: raw.endTime ?? raw.end_time,
      breakMinutes: raw.breakMinutes ?? raw.break_minutes,
      graceMinutes: raw.graceMinutes ?? raw.grace_minutes,
    };

    const parsedResult = schema.safeParse(normalized);
    if (!parsedResult.success) {
      const msg = parsedResult.error.issues?.[0]?.message || "Validation failed.";
      throw new AppError("VALIDATION_ERROR", msg, 400);
    }
    const parsed = parsedResult.data;
    const [item] = await db.insert(shifts).values({ organizationId: tenant.organization.id, ...parsed }).returning();
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
