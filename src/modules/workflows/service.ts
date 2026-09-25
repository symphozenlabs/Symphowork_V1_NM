import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { approvalHistory, approvalTasks, employees, memberships, roles, workflowDefinitions, workflowInstances, workflowSteps, workflowVersions } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";

export type WorkflowAction = "approve" | "reject" | "cancel";
export function nextWorkflowStatus(action: WorkflowAction, hasNextStep: boolean) { if (action === "reject") return "rejected" as const; if (action === "cancel") return "cancelled" as const; return hasNextStep ? "in_progress" as const : "approved" as const; }

export async function ensureDefaultWorkflow(organizationId: string, workflowType: string, createdByUserId: string) {
  const [existing] = await db.select().from(workflowDefinitions).where(and(eq(workflowDefinitions.organizationId, organizationId), eq(workflowDefinitions.workflowType, workflowType), eq(workflowDefinitions.active, true)));
  if (existing) return existing;
  return db.transaction(async (tx) => {
    const name = workflowType === "leave" ? "Leave approval" : workflowType === "expense" ? "Expense approval" : workflowType === "payroll" ? "Payroll approval" : "Attendance regularization approval";
    const [definition] = await tx.insert(workflowDefinitions).values({ organizationId, name, code: `${workflowType.toUpperCase()}_STANDARD`, workflowType, description: "Default sequential approval workflow", active: true, createdByUserId }).returning();
    const [version] = await tx.insert(workflowVersions).values({ organizationId, definitionId: definition.id, version: 1, active: true }).returning();
    await tx.insert(workflowSteps).values({ organizationId, versionId: version.id, stepOrder: 1, name: "Reporting manager", actorType: "reporting_manager", mode: "sequential" });
    return definition;
  });
}

async function resolveApprover(organizationId: string, employeeId: string, step: typeof workflowSteps.$inferSelect) {
  if (step.actorType === "specific_user" && step.actorUserId) return step.actorUserId;
  if (step.actorType === "reporting_manager") { const [employee] = await db.select({ managerId: employees.reportingManagerId }).from(employees).where(and(eq(employees.id, employeeId), eq(employees.organizationId, organizationId))); if (!employee?.managerId) throw new AppError("PROVISIONING_FAILED", "Workflow requires a reporting manager, but none is configured.", 422); const [manager] = await db.select({ userId: employees.userId }).from(employees).where(and(eq(employees.id, employee.managerId), eq(employees.organizationId, organizationId))); if (!manager?.userId) throw new AppError("PROVISIONING_FAILED", "The reporting manager does not have an account.", 422); return manager.userId; }
  const roleKeys = step.actorType === "hr_admin" ? ["HR_ADMIN", "ORGANIZATION_ADMIN", "ORGANIZATION_OWNER"] : step.actorRoleKey ? [step.actorRoleKey] : [];
  if (roleKeys.length) { const [actor] = await db.select({ userId: memberships.userId }).from(memberships).innerJoin(roles, eq(memberships.roleId, roles.id)).where(and(eq(memberships.organizationId, organizationId), eq(memberships.status, "active"), inArray(roles.key, roleKeys))); if (actor) return actor.userId; }
  throw new AppError("PROVISIONING_FAILED", "No approver is configured for this workflow step.", 422);
}

export async function createWorkflowInstance(input: { organizationId: string; workflowType: string; entityType: string; entityId: string; subjectEmployeeId: string; submittedByUserId: string }) {
  const [definition] = await db.select().from(workflowDefinitions).where(and(eq(workflowDefinitions.organizationId, input.organizationId), eq(workflowDefinitions.workflowType, input.workflowType), eq(workflowDefinitions.active, true)));
  if (!definition) throw new AppError("PROVISIONING_FAILED", `No active ${input.workflowType} workflow is configured.`, 422);
  const [version] = await db.select().from(workflowVersions).where(and(eq(workflowVersions.definitionId, definition.id), eq(workflowVersions.active, true)));
  if (!version) throw new AppError("PROVISIONING_FAILED", "Workflow has no active version.", 422);
  const [step] = await db.select().from(workflowSteps).where(eq(workflowSteps.versionId, version.id)).orderBy(asc(workflowSteps.stepOrder));
  if (!step) throw new AppError("PROVISIONING_FAILED", "Workflow has no approval steps.", 422);
  const approverUserId = await resolveApprover(input.organizationId, input.subjectEmployeeId, step);
  if (approverUserId === input.submittedByUserId) throw new AppError("FORBIDDEN", "A requester cannot approve their own request.", 403);
  const result = await db.transaction(async (tx) => { const [instance] = await tx.insert(workflowInstances).values({ organizationId: input.organizationId, workflowVersionId: version.id, entityType: input.entityType, entityId: input.entityId, subjectEmployeeId: input.subjectEmployeeId, status: "in_progress", currentStepOrder: step.stepOrder, submittedByUserId: input.submittedByUserId }).returning(); await tx.insert(approvalTasks).values({ organizationId: input.organizationId, workflowInstanceId: instance.id, workflowStepId: step.id, approverUserId }); return instance; });
  await recordAudit({ actorUserId: input.submittedByUserId, organizationId: input.organizationId, action: "approval_assigned", resource: "workflow_instance", resourceId: result.id, metadata: { workflowType: input.workflowType } }); return result;
}

export async function actOnApprovalTask(input: { organizationId: string; taskId: string; actorUserId: string; action: WorkflowAction; comment?: string }) {
  return db.transaction(async (tx) => {
    const [task] = await tx.select().from(approvalTasks).where(and(eq(approvalTasks.id, input.taskId), eq(approvalTasks.organizationId, input.organizationId), eq(approvalTasks.approverUserId, input.actorUserId), eq(approvalTasks.status, "pending")));
    if (!task) throw new AppError("FORBIDDEN", "This approval task is not assigned to you or is no longer pending.", 403);
    const [instance] = await tx.select().from(workflowInstances).where(and(eq(workflowInstances.id, task.workflowInstanceId), eq(workflowInstances.organizationId, input.organizationId), eq(workflowInstances.status, "in_progress")));
    if (!instance) throw new AppError("NOT_FOUND", "Workflow instance is no longer actionable.", 404);
    const [step] = await tx.select().from(workflowSteps).where(eq(workflowSteps.id, task.workflowStepId));
    if (!step) throw new AppError("NOT_FOUND", "Workflow step was not found.", 404);
    const nextSteps = await tx.select().from(workflowSteps).where(and(eq(workflowSteps.versionId, instance.workflowVersionId), eq(workflowSteps.stepOrder, step.stepOrder + 1)));
    const newStatus = nextWorkflowStatus(input.action, nextSteps.length > 0);
    await tx.update(approvalTasks).set({ status: input.action === "approve" ? "approved" : input.action === "reject" ? "rejected" : "cancelled", actedAt: new Date(), comments: input.comment }).where(eq(approvalTasks.id, task.id));
    await tx.insert(approvalHistory).values({ organizationId: input.organizationId, workflowInstanceId: instance.id, workflowStepId: step.id, taskId: task.id, actorUserId: input.actorUserId, action: input.action, comment: input.comment, previousStatus: instance.status, newStatus });
    if (newStatus === "in_progress" && nextSteps[0]) { const approverUserId = await resolveApprover(input.organizationId, instance.subjectEmployeeId, nextSteps[0]); await tx.update(workflowInstances).set({ currentStepOrder: nextSteps[0].stepOrder, updatedAt: new Date() }).where(eq(workflowInstances.id, instance.id)); await tx.insert(approvalTasks).values({ organizationId: input.organizationId, workflowInstanceId: instance.id, workflowStepId: nextSteps[0].id, approverUserId }); } else await tx.update(workflowInstances).set({ status: newStatus, updatedAt: new Date() }).where(eq(workflowInstances.id, instance.id));
    return { instanceId: instance.id, entityType: instance.entityType, entityId: instance.entityId, status: newStatus };
  });
}
