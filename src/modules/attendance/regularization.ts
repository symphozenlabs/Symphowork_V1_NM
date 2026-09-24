import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { attendanceRecords, attendanceRegularizationRequests, employees } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { authorize } from "@/modules/tenancy/authorization";
import { createWorkflowInstance, ensureDefaultWorkflow } from "@/modules/workflows/service";

export async function createRegularizationRequest(input: { organizationId: string; userId: string; attendanceId: string; requestedIn?: string; requestedOut?: string; reason: string }) {
  await authorize({ organizationId: input.organizationId, permission: "attendance.regularization.create" });
  if (!input.reason.trim()) throw new AppError("VALIDATION_ERROR", "A regularization reason is required.", 400);
  const [employee] = await db.select().from(employees).where(and(eq(employees.organizationId, input.organizationId), eq(employees.userId, input.userId)));
  if (!employee) throw new AppError("NOT_FOUND", "Your employee profile is not linked.", 404);
  const [attendance] = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.id, input.attendanceId), eq(attendanceRecords.organizationId, input.organizationId), eq(attendanceRecords.employeeId, employee.id)));
  if (!attendance) throw new AppError("NOT_FOUND", "Attendance record was not found.", 404);
  const [pending] = await db.select({ id: attendanceRegularizationRequests.id }).from(attendanceRegularizationRequests).where(and(eq(attendanceRegularizationRequests.organizationId, input.organizationId), eq(attendanceRegularizationRequests.attendanceId, attendance.id), eq(attendanceRegularizationRequests.status, "pending")));
  if (pending) throw new AppError("VALIDATION_ERROR", "A regularization request is already pending for this record.", 409);
  const [request] = await db.insert(attendanceRegularizationRequests).values({ organizationId: input.organizationId, employeeId: employee.id, attendanceId: attendance.id, requestedIn: input.requestedIn ? new Date(input.requestedIn) : attendance.actualFirstIn, requestedOut: input.requestedOut ? new Date(input.requestedOut) : attendance.actualLastOut, reason: input.reason.trim(), status: "pending" }).returning();
  try { await ensureDefaultWorkflow(input.organizationId, "attendance_regularization", input.userId); const workflow = await createWorkflowInstance({ organizationId: input.organizationId, workflowType: "attendance_regularization", entityType: "attendance_regularization", entityId: request.id, subjectEmployeeId: employee.id, submittedByUserId: input.userId }); const [updated] = await db.update(attendanceRegularizationRequests).set({ workflowInstanceId: workflow.id, updatedAt: new Date() }).where(eq(attendanceRegularizationRequests.id, request.id)).returning(); await recordAudit({ actorUserId: input.userId, organizationId: input.organizationId, action: "attendance_regularization_submitted", resource: "attendance_regularization", resourceId: request.id }); return updated; } catch (error) { await db.delete(attendanceRegularizationRequests).where(eq(attendanceRegularizationRequests.id, request.id)); throw error; }
}
