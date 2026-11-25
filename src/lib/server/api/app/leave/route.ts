import { authorize } from "@/modules/tenancy/authorization";
import { and, desc, eq } from "drizzle-orm";
import { withTenantTransaction } from "@/db/client";
import { leaveApplications, leaveBalances, leaveTypes } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { applyLeave } from "@/modules/leave/service";
import { requireLinkedEmployee } from "@/modules/employees/service";

export async function GET() {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const organizationId = tenant.organization.id;
    await authorize({ organizationId, permission: "leave.read" });
    return await withTenantTransaction(organizationId, async (tx) => {
      const employee = await requireLinkedEmployee(organizationId, tenant.user.id, tx);
      const [applications, balances] = await Promise.all([
        tx.select({ application: leaveApplications, typeName: leaveTypes.name })
          .from(leaveApplications).leftJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
          .where(and(eq(leaveApplications.organizationId, organizationId), eq(leaveApplications.employeeId, employee.id)))
          .orderBy(desc(leaveApplications.submittedAt)),
        tx.select({ balance: leaveBalances, typeName: leaveTypes.name })
          .from(leaveBalances).leftJoin(leaveTypes, eq(leaveBalances.leaveTypeId, leaveTypes.id))
          .where(and(eq(leaveBalances.organizationId, organizationId), eq(leaveBalances.employeeId, employee.id),
            eq(leaveBalances.leaveYear, new Date().getFullYear())))
      ]);
      return Response.json({ success: true, applications, balances });
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const body = await request.json() as { leaveTypeId?: string; startDate?: string; endDate?: string; halfDay?: boolean; reason?: string }; if (!body.leaveTypeId || !body.startDate || !body.endDate || !body.reason) throw new AppError("VALIDATION_ERROR", "Leave type, dates, and reason are required.", 400); const application = await applyLeave({ organizationId: tenant.organization.id, userId: tenant.user.id, leaveTypeId: body.leaveTypeId, startDate: body.startDate, endDate: body.endDate, halfDay: Boolean(body.halfDay), reason: body.reason }); return Response.json({ success: true, application }, { status: 201 }); } catch (error) { return errorResponse(error); } }
