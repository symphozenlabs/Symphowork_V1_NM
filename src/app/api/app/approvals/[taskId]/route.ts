import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { attendanceRecords, attendanceRegularizationRequests, employees, expenseClaims, expenseHistory, leaveApplications, leaveBalances, leaveTransactions, payrollRuns } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { notifyUsers } from "@/modules/notifications/service";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { actOnApprovalTask, type WorkflowAction } from "@/modules/workflows/service";

export async function POST(request: Request, context: { params: Promise<{ taskId: string }> }) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const body = await request.json() as { action?: WorkflowAction; comment?: string };
    if (!body.action || !["approve", "reject", "cancel"].includes(body.action)) throw new AppError("VALIDATION_ERROR", "A valid approval action is required.", 400);
    const { taskId } = await context.params;
    const result = await actOnApprovalTask({ organizationId: tenant.organization.id, taskId, actorUserId: tenant.user.id, action: body.action, comment: body.comment });
    let recipientUserId: string | undefined;
    await db.transaction(async (tx) => {
      if (result.entityType === "expense_claim" && result.status !== "in_progress") {
        const [claim] = await tx.select().from(expenseClaims).where(and(eq(expenseClaims.id, result.entityId), eq(expenseClaims.organizationId, tenant.organization!.id)));
        if (claim) { const approved = result.status === "approved"; await tx.update(expenseClaims).set({ status: approved ? "approved" : "rejected", approvedAt: approved ? new Date() : undefined, rejectedAt: approved ? undefined : new Date(), updatedAt: new Date() }).where(eq(expenseClaims.id, claim.id)); await tx.insert(expenseHistory).values({ organizationId: tenant.organization!.id, claimId: claim.id, actorUserId: tenant.user.id, action: approved ? "approved" : "rejected", previousStatus: claim.status, newStatus: approved ? "approved" : "rejected", comment: body.comment }); const [employee] = await tx.select({ userId: employees.userId }).from(employees).where(eq(employees.id, claim.employeeId)); recipientUserId = employee?.userId ?? undefined; }
      } else if (result.entityType === "leave_application") {
        const [application] = await tx.select().from(leaveApplications).where(and(eq(leaveApplications.id, result.entityId), eq(leaveApplications.organizationId, tenant.organization!.id)));
        if (application && result.status !== "in_progress") { const [balance] = await tx.select().from(leaveBalances).where(and(eq(leaveBalances.organizationId, tenant.organization!.id), eq(leaveBalances.employeeId, application.employeeId), eq(leaveBalances.leaveTypeId, application.leaveTypeId), eq(leaveBalances.leaveYear, Number(application.startDate.slice(0, 4))))); if (balance) { const approved = result.status === "approved"; await tx.update(leaveApplications).set({ status: approved ? "approved" : result.status === "cancelled" ? "cancelled" : "rejected", approvedAt: approved ? new Date() : undefined, rejectedAt: !approved ? new Date() : undefined, updatedAt: new Date() }).where(eq(leaveApplications.id, application.id)); await tx.update(leaveBalances).set({ pending: Math.max(0, balance.pending - application.requestedDays), consumed: approved ? balance.consumed + application.requestedDays : balance.consumed, updatedAt: new Date() }).where(eq(leaveBalances.id, balance.id)); await tx.insert(leaveTransactions).values({ organizationId: tenant.organization!.id, employeeId: application.employeeId, leaveTypeId: application.leaveTypeId, leaveBalanceId: balance.id, transactionType: approved ? "consumption" : "reservation_release", amount: application.requestedDays, referenceId: application.id, actorUserId: tenant.user.id }); } const [employee] = await tx.select({ userId: employees.userId }).from(employees).where(eq(employees.id, application.employeeId)); recipientUserId = employee?.userId ?? undefined; }
      } else if (result.entityType === "attendance_regularization" && result.status !== "in_progress") {
        const [regularization] = await tx.select().from(attendanceRegularizationRequests).where(and(eq(attendanceRegularizationRequests.id, result.entityId), eq(attendanceRegularizationRequests.organizationId, tenant.organization!.id)));
        if (regularization) { const approved = result.status === "approved"; await tx.update(attendanceRegularizationRequests).set({ status: approved ? "approved" : "rejected", resolvedAt: new Date(), resolvedByUserId: tenant.user.id, updatedAt: new Date() }).where(eq(attendanceRegularizationRequests.id, regularization.id)); if (approved) await tx.update(attendanceRecords).set({ actualFirstIn: regularization.requestedIn, actualLastOut: regularization.requestedOut, status: "regularized", updatedAt: new Date() }).where(eq(attendanceRecords.id, regularization.attendanceId)); const [employee] = await tx.select({ userId: employees.userId }).from(employees).where(eq(employees.id, regularization.employeeId)); recipientUserId = employee?.userId ?? undefined; }
      } else if (result.entityType === "payroll_run" && result.status !== "in_progress") {
        const [run] = await tx.select().from(payrollRuns).where(and(eq(payrollRuns.id, result.entityId), eq(payrollRuns.organizationId, tenant.organization!.id)));
        if (run) { const approved = result.status === "approved"; await tx.update(payrollRuns).set({ status: approved ? "approved" : "rejected", approvedAt: approved ? new Date() : undefined, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(payrollRuns.id, run.id)); recipientUserId = run.createdByUserId ?? undefined; }
      }
    });
    if (recipientUserId && result.status !== "in_progress") await notifyUsers({ organizationId: tenant.organization.id, recipientUserIds: [recipientUserId], category: result.entityType === "expense_claim" ? "expense" : result.entityType === "leave_application" ? "leave" : result.entityType === "attendance_regularization" ? "attendance" : "approvals", type: `${result.entityType}.${result.status}`, title: "Approval decision recorded", message: `Your ${result.entityType.replaceAll("_", " ")} is ${result.status}.`, entityType: result.entityType, entityId: result.entityId, actionUrl: result.entityType === "payroll_run" ? "/app/payroll" : result.entityType === "expense_claim" ? "/app/expenses" : result.entityType === "leave_application" ? "/app/leave" : "/app/attendance", idempotencyKey: `approval:${result.instanceId}:${result.status}` });
    return NextResponse.json({ success: true, result });
  } catch (error) { return errorResponse(error); }
}
