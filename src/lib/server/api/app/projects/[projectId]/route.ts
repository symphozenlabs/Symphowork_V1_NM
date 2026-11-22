import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { addProjectMember, getProject, removeProjectMember, updateProject } from "@/modules/collaboration/service";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Organization context is required." } }, { status: 403 });
    const { projectId } = await context.params;
    return NextResponse.json({ success: true, ...(await getProject({ organizationId: tenant.organization.id, userId: tenant.user.id, projectId })) });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Organization context is required." } }, { status: 403 });
    const { projectId } = await context.params;
    return NextResponse.json({ success: true, project: await updateProject({ organizationId: tenant.organization.id, userId: tenant.user.id, projectId, data: await request.json() }) });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Organization context is required." } }, { status: 403 });
    const { projectId } = await context.params;
    const body = await request.json() as { action?: "add_member" | "remove_member"; employeeId?: string; role?: "manager" | "member" | "viewer" };
    if (!body.employeeId || !body.action || !["add_member", "remove_member"].includes(body.action)) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "A supported member action and employee are required." } }, { status: 400 });
    const result = body.action === "add_member"
      ? await addProjectMember({ organizationId: tenant.organization.id, userId: tenant.user.id, projectId, employeeId: body.employeeId, role: body.role })
      : await removeProjectMember({ organizationId: tenant.organization.id, userId: tenant.user.id, projectId, employeeId: body.employeeId });
    return NextResponse.json({ success: true, member: result });
  } catch (error) { return errorResponse(error); }
}
