import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { shifts } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { z } from "zod";
const schema = z.object({ name: z.string().trim().min(2).max(100), code: z.string().trim().toUpperCase().min(2).max(40), startTime: z.string().regex(/^\d{2}:\d{2}$/), endTime: z.string().regex(/^\d{2}:\d{2}$/), breakMinutes: z.number().int().min(0).default(0), graceMinutes: z.number().int().min(0).default(0), overnight: z.boolean().default(false) });
export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) return NextResponse.json({ success: true, items: [] }); await authorize({ organizationId: tenant.organization.id, permission: "organization.settings.read" }); return NextResponse.json({ success: true, items: await db.select().from(shifts).where(eq(shifts.organizationId, tenant.organization.id)) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new Error("organization required"); await authorize({ organizationId: tenant.organization.id, permission: "organization.settings.update" }); const [item] = await db.insert(shifts).values({ organizationId: tenant.organization.id, ...schema.parse(await request.json()) }).returning(); return NextResponse.json({ success: true, item }, { status: 201 }); } catch (error) { return errorResponse(error); } }
