import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { createEmployee, listEmployees } from "@/modules/employees/service";
import { employeeInputSchema } from "@/modules/employees/validation";

export async function GET(request: Request) { try { const context = await resolveTenantContext(); if (!context.organization) return NextResponse.json({ success: true, employees: [] }); const url = new URL(request.url); const result = await listEmployees(context.organization.id, { search: url.searchParams.get("search") ?? undefined, status: url.searchParams.get("status") ?? undefined, page: Number(url.searchParams.get("page") ?? "1"), pageSize: Number(url.searchParams.get("pageSize") ?? "25") }); return NextResponse.json({ success: true, ...result }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const context = await resolveTenantContext(); if (!context.organization) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Organization context is required." } }, { status: 403 }); const result = await createEmployee(context.organization.id, context.user.id, employeeInputSchema.parse(await request.json())); return NextResponse.json({ success: true, employee: result.employee, onboarding: result.onboarding }, { status: 201 }); } catch (error) { return errorResponse(error); } }
