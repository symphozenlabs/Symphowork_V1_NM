import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { expenseCategories } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); await authorize({ organizationId: tenant.organization.id, permission: "expense.read" }); return NextResponse.json({ success: true, categories: await db.select().from(expenseCategories).where(and(eq(expenseCategories.organizationId, tenant.organization.id), eq(expenseCategories.status, "active"))) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); await authorize({ organizationId: tenant.organization.id, permission: "expense.category.manage" }); const body = await request.json() as { name?: string; code?: string; description?: string }; if (!body.name || !body.code) throw new AppError("VALIDATION_ERROR", "Category name and code are required.", 400); const [category] = await db.insert(expenseCategories).values({ organizationId: tenant.organization.id, name: body.name.trim(), code: body.code.trim().toUpperCase(), description: body.description?.trim() }).returning(); return NextResponse.json({ success: true, category }, { status: 201 }); } catch (error) { return errorResponse(error); } }
