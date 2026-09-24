import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { z } from "zod";
const schema = z.object({ name: z.string().trim().min(2).max(120), code: z.string().trim().toUpperCase().min(2).max(40), description: z.string().max(500).optional(), departmentId: z.string().uuid().optional() });
export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) return NextResponse.json({ success: true, items: [] }); await authorize({ organizationId: tenant.organization.id, permission: "team.read" }); return NextResponse.json({ success: true, items: await db.select().from(teams).where(eq(teams.organizationId, tenant.organization.id)) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new Error("organization required"); await authorize({ organizationId: tenant.organization.id, permission: "team.create" }); const [item] = await db.insert(teams).values({ organizationId: tenant.organization.id, ...schema.parse(await request.json()) }).returning(); return NextResponse.json({ success: true, item }, { status: 201 }); } catch (error) { return errorResponse(error); } }
