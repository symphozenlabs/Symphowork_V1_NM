import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { workingDays } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { authorize } from "@/modules/tenancy/authorization";
import { resolveTenantContext } from "@/modules/tenancy/context";
const schema = z.object({ dayOfWeek: z.number().int().min(0).max(6), isWorkingDay: z.boolean() });
export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) return NextResponse.json({ success: true, items: [] }); await authorize({ organizationId: tenant.organization.id, permission: "organization.settings.read" }); return NextResponse.json({ success: true, items: await db.select().from(workingDays).where(eq(workingDays.organizationId, tenant.organization.id)).orderBy(asc(workingDays.dayOfWeek)) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new Error("organization required"); await authorize({ organizationId: tenant.organization.id, permission: "organization.settings.update" }); const [item] = await db.insert(workingDays).values({ organizationId: tenant.organization.id, ...schema.parse(await request.json()) }).returning(); return NextResponse.json({ success: true, item }, { status: 201 }); } catch (error) { return errorResponse(error); } }
