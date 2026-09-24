import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { locations } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { z } from "zod";
const schema = z.object({ name: z.string().trim().min(2).max(120), code: z.string().trim().toUpperCase().min(2).max(40), city: z.string().max(120).optional(), state: z.string().max(120).optional(), country: z.string().max(120).optional(), timezone: z.string().max(80).default("UTC") });
export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) return NextResponse.json({ success: true, items: [] }); await authorize({ organizationId: tenant.organization.id, permission: "location.read" }); return NextResponse.json({ success: true, items: await db.select().from(locations).where(eq(locations.organizationId, tenant.organization.id)) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new Error("organization required"); await authorize({ organizationId: tenant.organization.id, permission: "location.create" }); const [item] = await db.insert(locations).values({ organizationId: tenant.organization.id, ...schema.parse(await request.json()) }).returning(); return NextResponse.json({ success: true, item }, { status: 201 }); } catch (error) { return errorResponse(error); } }
