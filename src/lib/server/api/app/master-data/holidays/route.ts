import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { holidays } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { z } from "zod";
const schema = z.object({ name: z.string().trim().min(2).max(160), holidayDate: z.string().date(), category: z.string().max(60).default("public"), description: z.string().max(500).optional() });
export async function GET(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) return NextResponse.json({ success: true, items: [] }); await authorize({ organizationId: tenant.organization.id, permission: "organization.settings.read" }); const year = new URL(request.url).searchParams.get("year"); const items = await db.select().from(holidays).where(eq(holidays.organizationId, tenant.organization.id)); return NextResponse.json({ success: true, items: year ? items.filter((item) => item.holidayDate.startsWith(year)) : items }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new Error("organization required"); await authorize({ organizationId: tenant.organization.id, permission: "organization.settings.update" }); const [item] = await db.insert(holidays).values({ organizationId: tenant.organization.id, ...schema.parse(await request.json()) }).returning(); return NextResponse.json({ success: true, item }, { status: 201 }); } catch (error) { return errorResponse(error); } }
