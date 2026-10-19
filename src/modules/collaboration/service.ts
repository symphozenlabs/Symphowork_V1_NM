import path from "node:path";
import crypto from "node:crypto";
import { and, asc, desc, eq, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db, withTenantTransaction, type DbTransaction } from "@/db/client";
import { collaborationActivity, collaborationAttachments, collaborationConversationMembers, collaborationConversations, collaborationMessageReactions, collaborationMessages, collaborationMessageTaskLinks, collaborationPresence, collaborationProjectMembers, collaborationProjects, collaborationTaskComments, collaborationTaskDependencies, collaborationTasks, departments, designations, employees, projectNumberCounters, taskNumberCounters, teams } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getStorageProvider } from "@/lib/storage";
import { authorize } from "@/modules/tenancy/authorization";
import { getActiveTypers, setTypingIndicator } from "./typing";
import { projectNumber, sanitizeCollaborationText, taskNumber, validateDateRange, wouldCreateDependencyCycle } from "./policy";
import { createNotification } from "@/modules/notifications/service";
import { parseMentionNames } from "./policy";
import { getOrEnsureEmployeeForUser } from "@/modules/employees/service";
import { detectAttachmentCategory, validateUploadedFile } from "./file-validation";

async function employeeForUser(organizationId: string, userId: string, executor?: DbTransaction | typeof db) { return getOrEnsureEmployeeForUser(organizationId, userId, executor); }
async function ensureEmployee(organizationId: string, employeeId: string, executor?: DbTransaction | typeof db) { const client = executor ?? db; const [employee] = await client.select().from(employees).where(and(eq(employees.organizationId, organizationId), eq(employees.id, employeeId))); if (!employee) throw new AppError("NOT_FOUND", "Employee is not part of this organization.", 404); return employee; }
async function nextNumber(counter: typeof projectNumberCounters | typeof taskNumberCounters, organizationId: string) { await db.insert(counter).values({ organizationId }).onConflictDoNothing(); const [row] = await db.update(counter).set({ nextNumber: sql`${counter.nextNumber} + 1`, updatedAt: new Date() }).where(eq(counter.organizationId, organizationId)).returning(); return row.nextNumber; }
async function addActivity(organizationId: string, actorEmployeeId: string, activityType: string, projectId?: string, taskId?: string, metadata?: unknown) { await db.insert(collaborationActivity).values({ organizationId, actorEmployeeId, activityType, projectId, taskId, metadata: metadata ? JSON.stringify(metadata) : undefined }); }

export async function createProject(input: { organizationId: string; userId: string; data: { name: string; description?: string; ownerEmployeeId?: string; managerEmployeeId?: string; teamId?: string; status?: "planning" | "active" | "on_hold" | "completed" | "cancelled" | "archived"; priority?: "low" | "medium" | "high" | "urgent"; startDate?: string; targetEndDate?: string; visibility?: string } }) { await authorize({ organizationId: input.organizationId, permission: "project.create" }); const actor = await employeeForUser(input.organizationId, input.userId); validateDateRange(input.data.startDate, input.data.targetEndDate); const owner = await ensureEmployee(input.organizationId, input.data.ownerEmployeeId ?? actor.id); if (input.data.managerEmployeeId) await ensureEmployee(input.organizationId, input.data.managerEmployeeId); if (input.data.teamId) { const [team] = await db.select({ id: teams.id }).from(teams).where(and(eq(teams.id, input.data.teamId), eq(teams.organizationId, input.organizationId))); if (!team) throw new AppError("NOT_FOUND", "Team is not part of this organization.", 404); } const [project] = await db.insert(collaborationProjects).values({ organizationId: input.organizationId, projectNumber: projectNumber(await nextNumber(projectNumberCounters, input.organizationId)), name: sanitizeCollaborationText(input.data.name), description: input.data.description ? sanitizeCollaborationText(input.data.description) : undefined, ownerEmployeeId: owner.id, managerEmployeeId: input.data.managerEmployeeId, teamId: input.data.teamId, status: input.data.status, priority: input.data.priority, startDate: input.data.startDate, targetEndDate: input.data.targetEndDate, visibility: input.data.visibility ?? "organization", createdByUserId: input.userId }).returning(); await db.insert(collaborationProjectMembers).values({ organizationId: input.organizationId, projectId: project.id, employeeId: owner.id, role: "owner" }); await addActivity(input.organizationId, actor.id, "project_created", project.id, undefined, { projectNumber: project.projectNumber }); await recordAudit({ actorUserId: input.userId, organizationId: input.organizationId, action: "project_created", resource: "collaboration_project", resourceId: project.id }); return project; }
export async function listProjects(input: { organizationId: string; userId: string; query?: string; limit?: number; offset?: number }) { await authorize({ organizationId: input.organizationId, permission: "project.view" }); const actor = await employeeForUser(input.organizationId, input.userId); const membership = await db.select({ projectId: collaborationProjectMembers.projectId }).from(collaborationProjectMembers).where(and(eq(collaborationProjectMembers.organizationId, input.organizationId), eq(collaborationProjectMembers.employeeId, actor.id), isNull(collaborationProjectMembers.removedAt))); return db.select().from(collaborationProjects).where(and(eq(collaborationProjects.organizationId, input.organizationId), input.query ? ilike(collaborationProjects.name, `%${input.query}%`) : undefined, or(eq(collaborationProjects.visibility, "organization"), membership.length ? inArray(collaborationProjects.id, membership.map((item) => item.projectId)) : sql`false`))).orderBy(desc(collaborationProjects.updatedAt)).limit(Math.min(input.limit ?? 50, 100)).offset(input.offset ?? 0); }
export async function getProject(input: { organizationId: string; userId: string; projectId: string }) { await authorize({ organizationId: input.organizationId, permission: "project.view" }); const actor = await employeeForUser(input.organizationId, input.userId); const [project] = await db.select().from(collaborationProjects).where(and(eq(collaborationProjects.id, input.projectId), eq(collaborationProjects.organizationId, input.organizationId))); if (!project) throw new AppError("NOT_FOUND", "Project was not found.", 404); const [membership] = await db.select().from(collaborationProjectMembers).where(and(eq(collaborationProjectMembers.organizationId, input.organizationId), eq(collaborationProjectMembers.projectId, project.id), eq(collaborationProjectMembers.employeeId, actor.id), isNull(collaborationProjectMembers.removedAt))); if (project.visibility !== "organization" && !membership) throw new AppError("FORBIDDEN", "You are not a member of this project.", 403); const [members, tasks, activity] = await Promise.all([db.select({ membership: collaborationProjectMembers, employee: employees }).from(collaborationProjectMembers).innerJoin(employees, eq(collaborationProjectMembers.employeeId, employees.id)).where(and(eq(collaborationProjectMembers.organizationId, input.organizationId), eq(collaborationProjectMembers.projectId, project.id), isNull(collaborationProjectMembers.removedAt))).orderBy(asc(collaborationProjectMembers.joinedAt)), db.select().from(collaborationTasks).where(and(eq(collaborationTasks.organizationId, input.organizationId), eq(collaborationTasks.projectId, project.id))).orderBy(desc(collaborationTasks.updatedAt)).limit(100), db.select().from(collaborationActivity).where(and(eq(collaborationActivity.organizationId, input.organizationId), eq(collaborationActivity.projectId, project.id))).orderBy(desc(collaborationActivity.createdAt)).limit(50)]); return { project, members, tasks, activity }; }
export async function updateProject(input: { organizationId: string; userId: string; projectId: string; data: Partial<{ name: string; description: string | null; status: "planning" | "active" | "on_hold" | "completed" | "cancelled" | "archived"; priority: "low" | "medium" | "high" | "urgent"; startDate: string | null; targetEndDate: string | null }> }) { await authorize({ organizationId: input.organizationId, permission: input.data.status === "archived" ? "project.archive" : "project.edit" }); const actor = await employeeForUser(input.organizationId, input.userId); const [existing] = await db.select().from(collaborationProjects).where(and(eq(collaborationProjects.id, input.projectId), eq(collaborationProjects.organizationId, input.organizationId))); if (!existing) throw new AppError("NOT_FOUND", "Project was not found.", 404); validateDateRange(input.data.startDate ?? existing.startDate, input.data.targetEndDate ?? existing.targetEndDate); const changes = { ...(input.data.name === undefined ? {} : { name: sanitizeCollaborationText(input.data.name) }), ...(input.data.description === undefined ? {} : { description: input.data.description === null ? null : sanitizeCollaborationText(input.data.description) }), ...(input.data.status === undefined ? {} : { status: input.data.status }), ...(input.data.priority === undefined ? {} : { priority: input.data.priority }), ...(input.data.startDate === undefined ? {} : { startDate: input.data.startDate }), ...(input.data.targetEndDate === undefined ? {} : { targetEndDate: input.data.targetEndDate }) }; if (Object.keys(changes).length === 0) throw new AppError("VALIDATION_ERROR", "At least one project field is required.", 400); const [project] = await db.update(collaborationProjects).set({ ...changes, updatedAt: new Date() }).where(and(eq(collaborationProjects.id, existing.id), eq(collaborationProjects.organizationId, input.organizationId))).returning(); await addActivity(input.organizationId, actor.id, input.data.status ? "project_status_changed" : "project_updated", project.id, undefined, changes); return project; }
export async function addProjectMember(input: { organizationId: string; userId: string; projectId: string; employeeId: string; role?: "manager" | "member" | "viewer" }) { await authorize({ organizationId: input.organizationId, permission: "project.manage.members" }); const actor = await employeeForUser(input.organizationId, input.userId); const [project] = await db.select({ id: collaborationProjects.id }).from(collaborationProjects).where(and(eq(collaborationProjects.id, input.projectId), eq(collaborationProjects.organizationId, input.organizationId))); if (!project) throw new AppError("NOT_FOUND", "Project was not found.", 404); await ensureEmployee(input.organizationId, input.employeeId); const [member] = await db.insert(collaborationProjectMembers).values({ organizationId: input.organizationId, projectId: project.id, employeeId: input.employeeId, role: input.role ?? "member" }).onConflictDoUpdate({ target: [collaborationProjectMembers.projectId, collaborationProjectMembers.employeeId], set: { role: input.role ?? "member", removedAt: null, status: "active", updatedAt: new Date() } }).returning(); await addActivity(input.organizationId, actor.id, "project_member_added", project.id, undefined, { employeeId: input.employeeId }); return member; }
export async function removeProjectMember(input: { organizationId: string; userId: string; projectId: string; employeeId: string }) { await authorize({ organizationId: input.organizationId, permission: "project.manage.members" }); const actor = await employeeForUser(input.organizationId, input.userId); const [member] = await db.update(collaborationProjectMembers).set({ removedAt: new Date(), status: "removed", updatedAt: new Date() }).where(and(eq(collaborationProjectMembers.organizationId, input.organizationId), eq(collaborationProjectMembers.projectId, input.projectId), eq(collaborationProjectMembers.employeeId, input.employeeId), eq(collaborationProjectMembers.role, "member"))).returning(); if (!member) throw new AppError("NOT_FOUND", "Project member was not found or cannot be removed.", 404); await addActivity(input.organizationId, actor.id, "project_member_removed", input.projectId, undefined, { employeeId: input.employeeId }); return member; }
export async function createTask(input: { organizationId: string; userId: string; data: { title: string; description?: string; projectId?: string; parentTaskId?: string; assigneeEmployeeId?: string; reporterEmployeeId?: string; status?: "todo" | "in_progress" | "blocked" | "in_review" | "completed" | "cancelled"; priority?: "low" | "medium" | "high" | "urgent"; type?: "task" | "bug" | "feature" | "improvement" | "request" | "maintenance" | "other"; startDate?: string; dueDate?: string; estimatedEffort?: number; effortUnit?: string; sourceType?: string } }) { await authorize({ organizationId: input.organizationId, permission: "task.create" }); const actor = await employeeForUser(input.organizationId, input.userId); validateDateRange(input.data.startDate, input.data.dueDate); if (input.data.assigneeEmployeeId) await ensureEmployee(input.organizationId, input.data.assigneeEmployeeId); if (input.data.reporterEmployeeId) await ensureEmployee(input.organizationId, input.data.reporterEmployeeId); if (input.data.projectId) { const [project] = await db.select().from(collaborationProjects).where(and(eq(collaborationProjects.id, input.data.projectId), eq(collaborationProjects.organizationId, input.organizationId))); if (!project) throw new AppError("NOT_FOUND", "Project was not found.", 404); } if (input.data.parentTaskId) { const [parent] = await db.select().from(collaborationTasks).where(and(eq(collaborationTasks.id, input.data.parentTaskId), eq(collaborationTasks.organizationId, input.organizationId))); if (!parent) throw new AppError("NOT_FOUND", "Parent task was not found.", 404); if (parent.id === input.data.parentTaskId) throw new AppError("VALIDATION_ERROR", "A task cannot be its own parent.", 400); }
  const [task] = await db.insert(collaborationTasks).values({ organizationId: input.organizationId, taskNumber: taskNumber(await nextNumber(taskNumberCounters, input.organizationId)), title: sanitizeCollaborationText(input.data.title), description: input.data.description ? sanitizeCollaborationText(input.data.description) : undefined, projectId: input.data.projectId, parentTaskId: input.data.parentTaskId, createdByEmployeeId: actor.id, reporterEmployeeId: input.data.reporterEmployeeId ?? actor.id, assigneeEmployeeId: input.data.assigneeEmployeeId, status: input.data.status, priority: input.data.priority, type: input.data.type, startDate: input.data.startDate, dueDate: input.data.dueDate, estimatedEffort: input.data.estimatedEffort, effortUnit: input.data.effortUnit, sourceType: input.data.sourceType ?? "manual" }).returning(); await addActivity(input.organizationId, actor.id, "task_created", input.data.projectId, task.id, { taskNumber: task.taskNumber }); await recordAudit({ actorUserId: input.userId, organizationId: input.organizationId, action: "task_created", resource: "collaboration_task", resourceId: task.id }); return task; }
export async function listTasks(input: { organizationId: string; userId: string; projectId?: string; assigneeEmployeeId?: string; status?: string; query?: string; limit?: number; offset?: number }) { await authorize({ organizationId: input.organizationId, permission: "task.read" }); return db.select().from(collaborationTasks).where(and(eq(collaborationTasks.organizationId, input.organizationId), input.projectId ? eq(collaborationTasks.projectId, input.projectId) : undefined, input.assigneeEmployeeId ? eq(collaborationTasks.assigneeEmployeeId, input.assigneeEmployeeId) : undefined, input.status ? eq(collaborationTasks.status, input.status as typeof collaborationTasks.status.enumValues[number]) : undefined, input.query ? ilike(collaborationTasks.title, `%${input.query}%`) : undefined)).orderBy(desc(collaborationTasks.updatedAt)).limit(Math.min(input.limit ?? 50, 100)).offset(input.offset ?? 0); }
export async function getTask(input: { organizationId: string; userId: string; taskId: string }) { await authorize({ organizationId: input.organizationId, permission: "task.read" }); const [task] = await db.select().from(collaborationTasks).where(and(eq(collaborationTasks.id, input.taskId), eq(collaborationTasks.organizationId, input.organizationId))); if (!task) throw new AppError("NOT_FOUND", "Task was not found.", 404); const [comments, activity] = await Promise.all([db.select({ comment: collaborationTaskComments, employee: employees }).from(collaborationTaskComments).innerJoin(employees, eq(collaborationTaskComments.authorEmployeeId, employees.id)).where(and(eq(collaborationTaskComments.organizationId, input.organizationId), eq(collaborationTaskComments.taskId, task.id), isNull(collaborationTaskComments.deletedAt))).orderBy(asc(collaborationTaskComments.createdAt)), db.select().from(collaborationActivity).where(and(eq(collaborationActivity.organizationId, input.organizationId), eq(collaborationActivity.taskId, task.id))).orderBy(desc(collaborationActivity.createdAt)).limit(50)]); return { task, comments, activity }; }
export async function updateTask(input: { organizationId: string; userId: string; taskId: string; data: Partial<{ status: "todo" | "in_progress" | "blocked" | "in_review" | "completed" | "cancelled"; priority: "low" | "medium" | "high" | "urgent"; assigneeEmployeeId: string | null; dueDate: string | null; description: string }> }) { const keys = Object.keys(input.data); if (!keys.length || keys.some((key) => !["status", "priority", "assigneeEmployeeId", "dueDate", "description"].includes(key))) throw new AppError("VALIDATION_ERROR", "Only supported task fields can be updated.", 400); const permissions = new Set<string>(["task.update"]); if (keys.includes("assigneeEmployeeId")) permissions.add("task.assign"); if (keys.includes("status")) permissions.add("task.change.status"); if (keys.includes("priority")) permissions.add("task.change.priority"); await Promise.all([...permissions].map((permission) => authorize({ organizationId: input.organizationId, permission: permission as "task.update" }))); const actor = await employeeForUser(input.organizationId, input.userId); const [existing] = await db.select().from(collaborationTasks).where(and(eq(collaborationTasks.id, input.taskId), eq(collaborationTasks.organizationId, input.organizationId))); if (!existing) throw new AppError("NOT_FOUND", "Task was not found.", 404); if (input.data.assigneeEmployeeId) await ensureEmployee(input.organizationId, input.data.assigneeEmployeeId); validateDateRange(existing.startDate, input.data.dueDate ?? existing.dueDate); const changes = { ...(input.data.description === undefined ? {} : { description: sanitizeCollaborationText(input.data.description) }), ...(input.data.status === undefined ? {} : { status: input.data.status }), ...(input.data.priority === undefined ? {} : { priority: input.data.priority }), ...(input.data.assigneeEmployeeId === undefined ? {} : { assigneeEmployeeId: input.data.assigneeEmployeeId }), ...(input.data.dueDate === undefined ? {} : { dueDate: input.data.dueDate }) }; const [updated] = await db.update(collaborationTasks).set({ ...changes, completedAt: input.data.status === "completed" ? new Date() : existing.completedAt, updatedAt: new Date() }).where(and(eq(collaborationTasks.id, existing.id), eq(collaborationTasks.organizationId, input.organizationId))).returning(); await addActivity(input.organizationId, actor.id, input.data.status ? "task_status_changed" : "task_updated", updated.projectId ?? undefined, updated.id, changes); return updated; }
export async function addTaskDependency(input: { organizationId: string; userId: string; predecessorTaskId: string; successorTaskId: string }) { await authorize({ organizationId: input.organizationId, permission: "task.manage.dependencies" }); const rows = await db.select().from(collaborationTaskDependencies).where(eq(collaborationTaskDependencies.organizationId, input.organizationId)); if (wouldCreateDependencyCycle(rows, input.predecessorTaskId, input.successorTaskId)) throw new AppError("VALIDATION_ERROR", "This dependency would create a cycle.", 400); const [predecessor] = await db.select().from(collaborationTasks).where(and(eq(collaborationTasks.id, input.predecessorTaskId), eq(collaborationTasks.organizationId, input.organizationId))); const [successor] = await db.select().from(collaborationTasks).where(and(eq(collaborationTasks.id, input.successorTaskId), eq(collaborationTasks.organizationId, input.organizationId))); if (!predecessor || !successor) throw new AppError("NOT_FOUND", "Both tasks must belong to this organization.", 404); const actor = await employeeForUser(input.organizationId, input.userId); const [dependency] = await db.insert(collaborationTaskDependencies).values({ organizationId: input.organizationId, predecessorTaskId: predecessor.id, successorTaskId: successor.id, createdByEmployeeId: actor.id }).onConflictDoNothing().returning(); await addActivity(input.organizationId, actor.id, "task_dependency_created", predecessor.projectId ?? undefined, successor.id, { predecessorTaskId: predecessor.id }); return dependency ?? { predecessorTaskId: predecessor.id, successorTaskId: successor.id }; }
export async function addTaskComment(input: { organizationId: string; userId: string; taskId: string; content: string }) { await authorize({ organizationId: input.organizationId, permission: "task.comment" }); const actor = await employeeForUser(input.organizationId, input.userId); const [task] = await db.select().from(collaborationTasks).where(and(eq(collaborationTasks.id, input.taskId), eq(collaborationTasks.organizationId, input.organizationId))); if (!task) throw new AppError("NOT_FOUND", "Task was not found.", 404); const content = sanitizeCollaborationText(input.content); if (!content) throw new AppError("VALIDATION_ERROR", "Comment content is required.", 400); const [comment] = await db.insert(collaborationTaskComments).values({ organizationId: input.organizationId, taskId: task.id, authorEmployeeId: actor.id, content }).returning(); await addActivity(input.organizationId, actor.id, "task_comment_added", task.projectId ?? undefined, task.id, { commentId: comment.id }); return comment; }
export async function convertMessageToTask(input: { organizationId: string; userId: string; messageId: string; title: string; assigneeEmployeeId?: string; projectId?: string; dueDate?: string; priority?: "low" | "medium" | "high" | "urgent"; description?: string }) {
  await authorize({ organizationId: input.organizationId, permission: "task.create" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const [message] = await tx.select().from(collaborationMessages).where(and(eq(collaborationMessages.id, input.messageId), eq(collaborationMessages.organizationId, input.organizationId)));
    if (!message) throw new AppError("NOT_FOUND", "Message was not found.", 404);
    const [membership] = await tx.select().from(collaborationConversationMembers).where(and(eq(collaborationConversationMembers.organizationId, input.organizationId), eq(collaborationConversationMembers.conversationId, message.conversationId), eq(collaborationConversationMembers.employeeId, actor.id), isNull(collaborationConversationMembers.leftAt)));
    if (!membership) throw new AppError("FORBIDDEN", "You cannot convert a message from this conversation.", 403);
    const [existingLink] = await tx.select().from(collaborationMessageTaskLinks).where(and(eq(collaborationMessageTaskLinks.organizationId, input.organizationId), eq(collaborationMessageTaskLinks.messageId, message.id)));
    if (existingLink) return { task: (await tx.select().from(collaborationTasks).where(eq(collaborationTasks.id, existingLink.taskId)))[0], duplicate: true };
    const task = await createTask({ organizationId: input.organizationId, userId: input.userId, data: { title: input.title, description: input.description ?? message.content ?? undefined, assigneeEmployeeId: input.assigneeEmployeeId, projectId: input.projectId, dueDate: input.dueDate, priority: input.priority, sourceType: "chat" } });
    await tx.insert(collaborationMessageTaskLinks).values({ organizationId: input.organizationId, messageId: message.id, taskId: task.id, createdByEmployeeId: actor.id });
    await tx.update(collaborationMessages).set({ type: "task_reference", updatedAt: new Date() }).where(eq(collaborationMessages.id, message.id));
    if (input.assigneeEmployeeId && input.assigneeEmployeeId !== actor.id) {
      const [assignee] = await tx.select().from(employees).where(and(eq(employees.id, input.assigneeEmployeeId), eq(employees.organizationId, input.organizationId)));
      if (assignee && assignee.userId) await createNotification({ organizationId: input.organizationId, recipientUserId: assignee.userId, category: "system", type: "collaboration.task_assigned_from_chat", title: "Task assigned from chat", message: `${task.taskNumber} was assigned to you from a chat conversation.`, entityType: "collaboration_task", entityId: task.id, actionUrl: `/app/work?taskId=${task.id}`, idempotencyKey: `task-chat-assigned:${task.id}:${assignee.id}` });
    }
    await recordAudit({ actorUserId: input.userId, organizationId: input.organizationId, action: "task_created_from_chat", resource: "collaboration_task", resourceId: task.id, metadata: { messageId: message.id, conversationId: message.conversationId } });
    return { task, duplicate: false, sourceMessageId: message.id };
  });
}

export async function createConversation(input: { organizationId: string; userId: string; type: "direct" | "group"; name?: string; employeeIds: string[] }) {
  await authorize({ organizationId: input.organizationId, permission: "chat.create" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const memberIds = [...new Set([actor.id, ...input.employeeIds])];
    const employeesFound = await tx.select({ id: employees.id }).from(employees).where(and(eq(employees.organizationId, input.organizationId), inArray(employees.id, memberIds)));
    if (employeesFound.length !== memberIds.length) throw new AppError("VALIDATION_ERROR", "All conversation members must belong to this organization.", 400);

    if (input.type === "direct") {
      if (memberIds.length !== 2) throw new AppError("VALIDATION_ERROR", "Direct conversations require exactly two employees.", 400);

      // Safe deduplication: check if active direct conversation already exists between these 2 employees
      const existingCandidates = await tx
        .select({ conversationId: collaborationConversationMembers.conversationId })
        .from(collaborationConversationMembers)
        .innerJoin(collaborationConversations, eq(collaborationConversations.id, collaborationConversationMembers.conversationId))
        .where(and(
          eq(collaborationConversations.organizationId, input.organizationId),
          eq(collaborationConversations.type, "direct"),
          isNull(collaborationConversations.archivedAt),
          inArray(collaborationConversationMembers.employeeId, memberIds)
        ))
        .groupBy(collaborationConversationMembers.conversationId)
        .having(sql`count(distinct ${collaborationConversationMembers.employeeId}) = 2`);

      if (existingCandidates.length > 0) {
        const [existing] = await tx
          .select()
          .from(collaborationConversations)
          .where(and(
            eq(collaborationConversations.id, existingCandidates[0].conversationId),
            eq(collaborationConversations.organizationId, input.organizationId)
          ));
        if (existing) {
          return existing;
        }
      }
    } else if (input.type === "group") {
      if (!input.name || input.name.trim().length === 0) {
        throw new AppError("VALIDATION_ERROR", "Group conversation name is required.", 400);
      }
    }

    const [conversation] = await tx.insert(collaborationConversations).values({
      organizationId: input.organizationId,
      type: input.type,
      name: input.name ? sanitizeCollaborationText(input.name) : undefined,
      createdByEmployeeId: actor.id,
    }).returning();

    await tx.insert(collaborationConversationMembers).values(memberIds.map((employeeId, index) => ({
      organizationId: input.organizationId,
      conversationId: conversation.id,
      employeeId,
      role: (index === 0 ? "owner" : "member") as "owner" | "member",
    })));

    await recordAudit({ actorUserId: input.userId, organizationId: input.organizationId, action: "conversation_created", resource: "collaboration_conversation", resourceId: conversation.id });
    return conversation;
  });
}

export async function listConversations(input: { organizationId: string; userId: string }) {
  await authorize({ organizationId: input.organizationId, permission: "chat.read" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);

    const myMemberships = await tx
      .select({
        conversation: collaborationConversations,
        member: collaborationConversationMembers,
      })
      .from(collaborationConversations)
      .innerJoin(collaborationConversationMembers, eq(collaborationConversations.id, collaborationConversationMembers.conversationId))
      .where(and(
        eq(collaborationConversations.organizationId, input.organizationId),
        eq(collaborationConversationMembers.organizationId, input.organizationId),
        eq(collaborationConversationMembers.employeeId, actor.id),
        isNull(collaborationConversationMembers.leftAt),
        isNull(collaborationConversations.archivedAt)
      ))
      .orderBy(desc(collaborationConversations.updatedAt));

    if (myMemberships.length === 0) {
      return [];
    }

    const conversationIds = myMemberships.map((m) => m.conversation.id);

    const allMembers = await tx
      .select({
        conversationId: collaborationConversationMembers.conversationId,
        member: collaborationConversationMembers,
        employee: {
          id: employees.id,
          displayName: employees.displayName,
          employeeId: employees.employeeId,
          status: employees.status,
          departmentName: departments.name,
          designationTitle: designations.name,
        },
      })
      .from(collaborationConversationMembers)
      .innerJoin(employees, eq(collaborationConversationMembers.employeeId, employees.id))
      .leftJoin(
        departments,
        and(eq(employees.departmentId, departments.id), eq(departments.organizationId, input.organizationId))
      )
      .leftJoin(
        designations,
        and(eq(employees.designationId, designations.id), eq(designations.organizationId, input.organizationId))
      )
      .where(and(
        eq(collaborationConversationMembers.organizationId, input.organizationId),
        inArray(collaborationConversationMembers.conversationId, conversationIds),
        isNull(collaborationConversationMembers.leftAt)
      ));

    const otherMembersByConv = new Map<string, typeof allMembers[0]["employee"]>();
    const memberCountByConv = new Map<string, number>();
    const otherEmployeeIds = new Set<string>();

    for (const row of allMembers) {
      memberCountByConv.set(row.conversationId, (memberCountByConv.get(row.conversationId) ?? 0) + 1);
      if (row.employee.id !== actor.id) {
        otherEmployeeIds.add(row.employee.id);
        if (!otherMembersByConv.has(row.conversationId)) {
          otherMembersByConv.set(row.conversationId, row.employee);
        }
      }
    }

    const presenceMap = new Map<string, { status: "online" | "offline" | "away"; lastSeenAt?: string | null }>();
    if (otherEmployeeIds.size > 0) {
      const presenceRows = await tx
        .select({
          employeeId: collaborationPresence.employeeId,
          status: collaborationPresence.status,
          lastSeenAt: collaborationPresence.lastSeenAt,
        })
        .from(collaborationPresence)
        .where(and(
          eq(collaborationPresence.organizationId, input.organizationId),
          inArray(collaborationPresence.employeeId, [...otherEmployeeIds])
        ));

      const now = Date.now();
      for (const p of presenceRows) {
        const diff = now - new Date(p.lastSeenAt).getTime();
        const isOnline = diff < 60000 && p.status === "online";
        const isAway = diff < 120000 && p.status === "away";
        presenceMap.set(p.employeeId, {
          status: isOnline ? "online" : isAway ? "away" : "offline",
          lastSeenAt: p.lastSeenAt ? p.lastSeenAt.toISOString() : null,
        });
      }
    }

    const messages = await tx
      .select({
        id: collaborationMessages.id,
        conversationId: collaborationMessages.conversationId,
        senderEmployeeId: collaborationMessages.senderEmployeeId,
        content: collaborationMessages.content,
        type: collaborationMessages.type,
        createdAt: collaborationMessages.createdAt,
        senderDisplayName: employees.displayName,
      })
      .from(collaborationMessages)
      .innerJoin(employees, eq(collaborationMessages.senderEmployeeId, employees.id))
      .where(and(
        eq(collaborationMessages.organizationId, input.organizationId),
        inArray(collaborationMessages.conversationId, conversationIds),
        isNull(collaborationMessages.deletedAt)
      ))
      .orderBy(desc(collaborationMessages.createdAt));

    const latestMessageByConv = new Map<string, {
      id: string;
      content: string | null;
      type: string;
      createdAt: string;
      senderDisplayName: string;
      senderEmployeeId: string;
    }>();
    const unreadCountByConv = new Map<string, number>();
    const membershipByConv = new Map(myMemberships.map((m) => [m.conversation.id, m.member]));

    for (const msg of messages) {
      if (!latestMessageByConv.has(msg.conversationId)) {
        latestMessageByConv.set(msg.conversationId, {
          id: msg.id,
          content: msg.content,
          type: msg.type,
          createdAt: msg.createdAt.toISOString(),
          senderDisplayName: msg.senderDisplayName,
          senderEmployeeId: msg.senderEmployeeId,
        });
      }

      if (msg.senderEmployeeId !== actor.id) {
        const myMem = membershipByConv.get(msg.conversationId);
        if (myMem) {
          const isUnread = !myMem.lastReadAt || new Date(msg.createdAt) > new Date(myMem.lastReadAt);
          if (isUnread) {
            unreadCountByConv.set(msg.conversationId, (unreadCountByConv.get(msg.conversationId) ?? 0) + 1);
          }
        }
      }
    }

    return myMemberships.map((row) => {
      const otherParticipant = otherMembersByConv.get(row.conversation.id);
      const recipientPresence = otherParticipant
        ? presenceMap.get(otherParticipant.id) ?? { status: "offline", lastSeenAt: null }
        : null;

      return {
        conversation: {
          ...row.conversation,
          memberCount: memberCountByConv.get(row.conversation.id) ?? 1,
        },
        member: row.member,
        employee: otherParticipant ?? {
          id: actor.id,
          displayName: row.conversation.name ?? actor.displayName,
          employeeId: actor.employeeId,
          status: actor.status,
          departmentName: null,
          designationTitle: null,
        },
        recipient: otherParticipant
          ? {
              id: otherParticipant.id,
              displayName: otherParticipant.displayName,
              employeeId: otherParticipant.employeeId,
              status: otherParticipant.status,
              departmentName: otherParticipant.departmentName,
              designationTitle: otherParticipant.designationTitle,
              presence: recipientPresence,
            }
          : null,
        unreadCount: unreadCountByConv.get(row.conversation.id) ?? 0,
        lastMessage: latestMessageByConv.get(row.conversation.id) ?? null,
      };
    });
  });
}

export async function getUnreadConversationCount(input: {
  organizationId: string;
  userId: string;
}): Promise<number> {
  await authorize({ organizationId: input.organizationId, permission: "chat.read" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const myMemberships = await tx
      .select({
        conversationId: collaborationConversationMembers.conversationId,
        lastReadAt: collaborationConversationMembers.lastReadAt,
      })
      .from(collaborationConversationMembers)
      .innerJoin(
        collaborationConversations,
        eq(collaborationConversationMembers.conversationId, collaborationConversations.id)
      )
      .where(and(
        eq(collaborationConversationMembers.organizationId, input.organizationId),
        eq(collaborationConversationMembers.employeeId, actor.id),
        isNull(collaborationConversationMembers.leftAt),
        isNull(collaborationConversations.archivedAt)
      ));

    if (myMemberships.length === 0) {
      return 0;
    }

    const conversationIds = myMemberships.map((m) => m.conversationId);
    const myMembershipMap = new Map(myMemberships.map((m) => [m.conversationId, m.lastReadAt]));

    const messages = await tx
      .select({
        conversationId: collaborationMessages.conversationId,
        createdAt: collaborationMessages.createdAt,
        senderEmployeeId: collaborationMessages.senderEmployeeId,
      })
      .from(collaborationMessages)
      .where(and(
        eq(collaborationMessages.organizationId, input.organizationId),
        inArray(collaborationMessages.conversationId, conversationIds),
        isNull(collaborationMessages.deletedAt),
        ne(collaborationMessages.senderEmployeeId, actor.id)
      ))
      .orderBy(desc(collaborationMessages.createdAt));

    const unreadConvs = new Set<string>();
    for (const msg of messages) {
      if (unreadConvs.has(msg.conversationId)) continue;
      const lastReadAt = myMembershipMap.get(msg.conversationId);
      if (!lastReadAt || new Date(msg.createdAt) > new Date(lastReadAt)) {
        unreadConvs.add(msg.conversationId);
      }
    }

    return unreadConvs.size;
  });
}

export async function listMessages(input: {
  organizationId: string;
  userId: string;
  conversationId: string;
  limit?: number;
  before?: Date;
  after?: Date;
  markRead?: boolean;
}) {
  await authorize({ organizationId: input.organizationId, permission: "chat.read" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const [member] = await tx.select().from(collaborationConversationMembers).where(and(
      eq(collaborationConversationMembers.organizationId, input.organizationId),
      eq(collaborationConversationMembers.conversationId, input.conversationId),
      eq(collaborationConversationMembers.employeeId, actor.id),
      isNull(collaborationConversationMembers.leftAt)
    ));
    if (!member) throw new AppError("FORBIDDEN", "You are not a member of this conversation.", 403);

    const [conv] = await tx
      .select()
      .from(collaborationConversations)
      .where(and(
        eq(collaborationConversations.id, input.conversationId),
        eq(collaborationConversations.organizationId, input.organizationId)
      ));

    // Other members for delivery and read receipts
    const otherMembers = await tx
      .select({
        member: collaborationConversationMembers,
        employee: {
          id: employees.id,
          displayName: employees.displayName,
          departmentName: departments.name,
          designationTitle: designations.name,
        },
        presence: collaborationPresence,
      })
      .from(collaborationConversationMembers)
      .innerJoin(employees, eq(collaborationConversationMembers.employeeId, employees.id))
      .leftJoin(
        departments,
        and(eq(employees.departmentId, departments.id), eq(departments.organizationId, input.organizationId))
      )
      .leftJoin(
        designations,
        and(eq(employees.designationId, designations.id), eq(designations.organizationId, input.organizationId))
      )
      .leftJoin(
        collaborationPresence,
        and(
          eq(collaborationConversationMembers.employeeId, collaborationPresence.employeeId),
          eq(collaborationConversationMembers.organizationId, collaborationPresence.organizationId)
        )
      )
      .where(and(
        eq(collaborationConversationMembers.organizationId, input.organizationId),
        eq(collaborationConversationMembers.conversationId, input.conversationId),
        ne(collaborationConversationMembers.employeeId, actor.id),
        isNull(collaborationConversationMembers.leftAt)
      ));

    const whereConditions = [
      eq(collaborationMessages.organizationId, input.organizationId),
      eq(collaborationMessages.conversationId, input.conversationId),
      isNull(collaborationMessages.deletedAt),
    ];

    if (input.before) {
      whereConditions.push(sql`${collaborationMessages.createdAt} < ${input.before}`);
    }
    if (input.after) {
      whereConditions.push(sql`${collaborationMessages.createdAt} > ${input.after}`);
    }

    const messages = await tx
      .select({
        id: collaborationMessages.id,
        organizationId: collaborationMessages.organizationId,
        conversationId: collaborationMessages.conversationId,
        senderEmployeeId: collaborationMessages.senderEmployeeId,
        content: collaborationMessages.content,
        type: collaborationMessages.type,
        replyToMessageId: collaborationMessages.replyToMessageId,
        clientIdempotencyKey: collaborationMessages.clientIdempotencyKey,
        editedAt: collaborationMessages.editedAt,
        createdAt: collaborationMessages.createdAt,
        updatedAt: collaborationMessages.updatedAt,
        sender: {
          id: employees.id,
          displayName: employees.displayName,
          employeeId: employees.employeeId,
          departmentName: departments.name,
          designationTitle: designations.name,
        },
      })
      .from(collaborationMessages)
      .innerJoin(employees, eq(collaborationMessages.senderEmployeeId, employees.id))
      .leftJoin(
        departments,
        and(eq(employees.departmentId, departments.id), eq(departments.organizationId, input.organizationId))
      )
      .leftJoin(
        designations,
        and(eq(employees.designationId, designations.id), eq(designations.organizationId, input.organizationId))
      )
      .where(and(...whereConditions))
      .orderBy(desc(collaborationMessages.createdAt))
      .limit(Math.min(input.limit ?? 50, 100));

    const now = new Date();
    if (input.markRead) {
      await tx
        .update(collaborationConversationMembers)
        .set({ lastReadAt: now, updatedAt: now })
        .where(eq(collaborationConversationMembers.id, member.id));
    } else {
      // Sync delivery: record that the member's client fetched the conversation messages
      await tx
        .update(collaborationConversationMembers)
        .set({ updatedAt: now })
        .where(eq(collaborationConversationMembers.id, member.id));
    }

    const isDirect = conv?.type === "direct";
    const primaryOther = otherMembers[0] ?? null;

    const msgIds = messages.map((m) => m.id);
    const attachmentsByMsgId = new Map<string, {
      id: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      category: "image" | "document" | "audio";
    }>();
    const reactionsByMsgId = new Map<string, Array<{
      emoji: string;
      count: number;
      reactedByMe: boolean;
      employeeNames: string[];
    }>>();

    if (msgIds.length > 0) {
      const [attachmentRows, reactionRows] = await Promise.all([
        tx
          .select({
            id: collaborationAttachments.id,
            messageId: collaborationAttachments.messageId,
            fileName: collaborationAttachments.fileName,
            mimeType: collaborationAttachments.mimeType,
            fileSize: collaborationAttachments.fileSize,
          })
          .from(collaborationAttachments)
          .where(and(
            eq(collaborationAttachments.organizationId, input.organizationId),
            inArray(collaborationAttachments.messageId, msgIds)
          )),
        tx
          .select({
            messageId: collaborationMessageReactions.messageId,
            emoji: collaborationMessageReactions.emoji,
            employeeId: collaborationMessageReactions.employeeId,
            employeeName: employees.displayName,
          })
          .from(collaborationMessageReactions)
          .innerJoin(employees, eq(collaborationMessageReactions.employeeId, employees.id))
          .where(and(
            eq(collaborationMessageReactions.organizationId, input.organizationId),
            inArray(collaborationMessageReactions.messageId, msgIds)
          )),
      ]);

      for (const att of attachmentRows) {
        if (att.messageId) {
          const ext = path.extname(att.fileName);
          const category = detectAttachmentCategory(att.mimeType, ext) ?? "document";
          attachmentsByMsgId.set(att.messageId, {
            id: att.id,
            fileName: att.fileName,
            mimeType: att.mimeType,
            fileSize: att.fileSize,
            category,
          });
        }
      }

      const groupedReactions = new Map<string, Map<string, { count: number; reactedByMe: boolean; employeeNames: string[] }>>();
      for (const r of reactionRows) {
        let msgMap = groupedReactions.get(r.messageId);
        if (!msgMap) {
          msgMap = new Map();
          groupedReactions.set(r.messageId, msgMap);
        }
        let em = msgMap.get(r.emoji);
        if (!em) {
          em = { count: 0, reactedByMe: false, employeeNames: [] };
          msgMap.set(r.emoji, em);
        }
        em.count += 1;
        if (r.employeeId === actor.id) {
          em.reactedByMe = true;
        }
        em.employeeNames.push(r.employeeName);
      }

      for (const [mId, msgMap] of groupedReactions.entries()) {
        const reactionsArr = Array.from(msgMap.entries()).map(([emoji, data]) => ({
          emoji,
          count: data.count,
          reactedByMe: data.reactedByMe,
          employeeNames: data.employeeNames,
        }));
        reactionsByMsgId.set(mId, reactionsArr);
      }
    }

    const formattedMessages = messages.reverse().map((msg) => {
      const isOutgoing = msg.senderEmployeeId === actor.id;
      let deliveryStatus: "sending" | "sent" | "delivered" | "read" | null = null;

      if (isOutgoing) {
        const msgTime = new Date(msg.createdAt).getTime();
        if (isDirect && primaryOther) {
          const recMember = primaryOther.member;

          if (recMember.lastReadAt && new Date(recMember.lastReadAt).getTime() >= msgTime) {
            deliveryStatus = "read";
          } else if (recMember.updatedAt && new Date(recMember.updatedAt).getTime() >= msgTime) {
            deliveryStatus = "delivered";
          } else {
            deliveryStatus = "sent";
          }
        } else if (!isDirect && otherMembers.length > 0) {
          const allRead = otherMembers.every(
            (om) => om.member.lastReadAt && new Date(om.member.lastReadAt).getTime() >= msgTime
          );
          if (allRead) {
            deliveryStatus = "read";
          } else {
            const anyDeliveredOrRead = otherMembers.some(
              (om) =>
                (om.member.lastReadAt && new Date(om.member.lastReadAt).getTime() >= msgTime) ||
                (om.member.updatedAt && new Date(om.member.updatedAt).getTime() >= msgTime)
            );
            deliveryStatus = anyDeliveredOrRead ? "delivered" : "sent";
          }
        } else {
          deliveryStatus = "sent";
        }
      }

      return {
        ...msg,
        deliveryStatus,
        attachment: attachmentsByMsgId.get(msg.id) ?? null,
        reactions: reactionsByMsgId.get(msg.id) ?? [],
      };
    });

    const typers = getActiveTypers(input.conversationId, actor.id);

    let recipientPresence = null;
    if (primaryOther?.presence) {
      const now = Date.now();
      const lastSeenTime = new Date(primaryOther.presence.lastSeenAt).getTime();
      const isOnline = now - lastSeenTime < 60000 && primaryOther.presence.status === "online";
      recipientPresence = {
        status: isOnline ? "online" : "offline",
        lastSeenAt: primaryOther.presence.lastSeenAt ? primaryOther.presence.lastSeenAt.toISOString() : null,
      };
    }

    return {
      messages: formattedMessages,
      typers,
      recipientPresence,
      memberLastReadAt: member.lastReadAt ? member.lastReadAt.toISOString() : null,
      otherMemberLastReadAt: primaryOther?.member?.lastReadAt
        ? primaryOther.member.lastReadAt.toISOString()
        : null,
      otherMemberSyncedAt: primaryOther?.member?.updatedAt
        ? primaryOther.member.updatedAt.toISOString()
        : null,
    };
  });
}

export async function sendMessage(input: { organizationId: string; userId: string; conversationId: string; content?: string; type?: "text" | "file" | "system" | "task_reference"; replyToMessageId?: string; clientIdempotencyKey?: string }) {
  await authorize({ organizationId: input.organizationId, permission: "chat.send" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const [member] = await tx.select().from(collaborationConversationMembers).where(and(
      eq(collaborationConversationMembers.organizationId, input.organizationId),
      eq(collaborationConversationMembers.conversationId, input.conversationId),
      eq(collaborationConversationMembers.employeeId, actor.id),
      isNull(collaborationConversationMembers.leftAt)
    ));
    if (!member) throw new AppError("FORBIDDEN", "You are not a member of this conversation.", 403);
    if (!input.content?.trim() && input.type !== "file") throw new AppError("VALIDATION_ERROR", "Message content is required.", 400);

    const senderData = {
      id: actor.id,
      displayName: actor.displayName,
      employeeId: actor.employeeId,
    };

    if (input.clientIdempotencyKey) {
      const [existing] = await tx.select().from(collaborationMessages).where(and(
        eq(collaborationMessages.organizationId, input.organizationId),
        eq(collaborationMessages.senderEmployeeId, actor.id),
        eq(collaborationMessages.clientIdempotencyKey, input.clientIdempotencyKey)
      ));
      if (existing) {
        return {
          ...existing,
          sender: senderData,
          attachment: null,
          reactions: [],
        };
      }
    }

    const [message] = await tx.insert(collaborationMessages).values({
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      senderEmployeeId: actor.id,
      content: input.content ? sanitizeCollaborationText(input.content) : undefined,
      type: input.type ?? "text",
      replyToMessageId: input.replyToMessageId,
      clientIdempotencyKey: input.clientIdempotencyKey,
    }).returning();

    await tx.update(collaborationConversations).set({ updatedAt: new Date() }).where(eq(collaborationConversations.id, input.conversationId));

    const mentionedNames = parseMentionNames(input.content ?? "");
    if (mentionedNames.length) {
      // Restrict mention notifications strictly to active conversation members
      const eligibleMembers = await tx
        .select({
          id: employees.id,
          userId: employees.userId,
          displayName: employees.displayName,
        })
        .from(collaborationConversationMembers)
        .innerJoin(employees, eq(collaborationConversationMembers.employeeId, employees.id))
        .where(and(
          eq(collaborationConversationMembers.organizationId, input.organizationId),
          eq(collaborationConversationMembers.conversationId, input.conversationId),
          isNull(collaborationConversationMembers.leftAt),
          inArray(employees.displayName, mentionedNames),
          eq(employees.organizationId, input.organizationId)
        ));

      await Promise.all(
        eligibleMembers
          .filter((employee) => employee.userId && employee.id !== actor.id)
          .map((employee) => createNotification({
            organizationId: input.organizationId,
            recipientUserId: employee.userId as string,
            category: "system",
            type: "collaboration.chat_mention",
            title: "You were mentioned in chat",
            message: `${actor.displayName} mentioned you in a chat conversation.`,
            entityType: "collaboration_message",
            entityId: message.id,
            actionUrl: `/app/chat?conversationId=${input.conversationId}`,
            idempotencyKey: `chat-mention:${message.id}:${employee.id}`,
          }))
      );
    }

    return {
      ...message,
      sender: senderData,
      attachment: null,
      reactions: [],
    };
  });
}

export async function toggleMessageReaction(input: {
  organizationId: string;
  userId: string;
  messageId: string;
  emoji: string;
}) {
  await authorize({ organizationId: input.organizationId, permission: "chat.read" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const [message] = await tx
      .select({
        id: collaborationMessages.id,
        conversationId: collaborationMessages.conversationId,
      })
      .from(collaborationMessages)
      .where(and(
        eq(collaborationMessages.id, input.messageId),
        eq(collaborationMessages.organizationId, input.organizationId)
      ));
    if (!message) throw new AppError("NOT_FOUND", "Message was not found.", 404);

    const [member] = await tx
      .select({ id: collaborationConversationMembers.id })
      .from(collaborationConversationMembers)
      .where(and(
        eq(collaborationConversationMembers.organizationId, input.organizationId),
        eq(collaborationConversationMembers.conversationId, message.conversationId),
        eq(collaborationConversationMembers.employeeId, actor.id),
        isNull(collaborationConversationMembers.leftAt)
      ));
    if (!member) throw new AppError("FORBIDDEN", "You are not a member of this conversation.", 403);

    const [existing] = await tx
      .select()
      .from(collaborationMessageReactions)
      .where(and(
        eq(collaborationMessageReactions.organizationId, input.organizationId),
        eq(collaborationMessageReactions.messageId, message.id),
        eq(collaborationMessageReactions.employeeId, actor.id),
        eq(collaborationMessageReactions.emoji, input.emoji)
      ));

    if (existing) {
      await tx
        .delete(collaborationMessageReactions)
        .where(eq(collaborationMessageReactions.id, existing.id));
      return { toggled: "removed" as const, emoji: input.emoji, messageId: message.id };
    } else {
      await tx.insert(collaborationMessageReactions).values({
        organizationId: input.organizationId,
        messageId: message.id,
        employeeId: actor.id,
        emoji: input.emoji,
      });
      return { toggled: "added" as const, emoji: input.emoji, messageId: message.id };
    }
  });
}

export async function reactToMessage(input: { organizationId: string; userId: string; messageId: string; emoji: string }) {
  return toggleMessageReaction(input);
}

export async function uploadChatAttachment(input: {
  organizationId: string;
  userId: string;
  conversationId: string;
  file: {
    buffer: Uint8Array;
    fileName: string;
    mimeType: string;
  };
  content?: string;
  clientIdempotencyKey?: string;
}) {
  await authorize({ organizationId: input.organizationId, permission: "chat.send" });
  const validated = validateUploadedFile(input.file);

  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const [member] = await tx
      .select({ id: collaborationConversationMembers.id })
      .from(collaborationConversationMembers)
      .where(and(
        eq(collaborationConversationMembers.organizationId, input.organizationId),
        eq(collaborationConversationMembers.conversationId, input.conversationId),
        eq(collaborationConversationMembers.employeeId, actor.id),
        isNull(collaborationConversationMembers.leftAt)
      ));
    if (!member) throw new AppError("FORBIDDEN", "You are not a member of this conversation.", 403);

    const senderData = {
      id: actor.id,
      displayName: actor.displayName,
      employeeId: actor.employeeId,
    };

    if (input.clientIdempotencyKey) {
      const [existing] = await tx.select().from(collaborationMessages).where(and(
        eq(collaborationMessages.organizationId, input.organizationId),
        eq(collaborationMessages.senderEmployeeId, actor.id),
        eq(collaborationMessages.clientIdempotencyKey, input.clientIdempotencyKey)
      ));
      if (existing) {
        const [existingAttachment] = await tx.select().from(collaborationAttachments).where(and(
          eq(collaborationAttachments.organizationId, input.organizationId),
          eq(collaborationAttachments.messageId, existing.id)
        ));
        return {
          ...existing,
          sender: senderData,
          attachment: existingAttachment
            ? {
                id: existingAttachment.id,
                fileName: existingAttachment.fileName,
                mimeType: existingAttachment.mimeType,
                fileSize: existingAttachment.fileSize,
                category: validated.category,
              }
            : null,
          reactions: [],
        };
      }
    }

    const ext = path.extname(validated.fileName);
    const base = path.basename(validated.fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueKey = `chat/${input.organizationId}/${input.conversationId}/${crypto.randomUUID()}-${base}${ext}`;

    const storage = getStorageProvider();
    await storage.upload(uniqueKey, input.file.buffer, validated.mimeType);

    const [message] = await tx
      .insert(collaborationMessages)
      .values({
        organizationId: input.organizationId,
        conversationId: input.conversationId,
        senderEmployeeId: actor.id,
        content: input.content ? sanitizeCollaborationText(input.content) : undefined,
        type: "file",
        clientIdempotencyKey: input.clientIdempotencyKey,
      })
      .returning();

    const [attachment] = await tx
      .insert(collaborationAttachments)
      .values({
        organizationId: input.organizationId,
        messageId: message.id,
        uploadedByEmployeeId: actor.id,
        fileName: validated.fileName,
        mimeType: validated.mimeType,
        fileSize: validated.fileSize,
        storageKey: uniqueKey,
      })
      .returning();

    await tx
      .update(collaborationConversations)
      .set({ updatedAt: new Date() })
      .where(eq(collaborationConversations.id, input.conversationId));

    return {
      ...message,
      sender: senderData,
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        category: validated.category,
      },
      reactions: [],
    };
  });
}

export async function getChatAttachment(input: {
  organizationId: string;
  userId: string;
  conversationId: string;
  attachmentId: string;
}) {
  await authorize({ organizationId: input.organizationId, permission: "chat.read" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const [member] = await tx
      .select({ id: collaborationConversationMembers.id })
      .from(collaborationConversationMembers)
      .where(and(
        eq(collaborationConversationMembers.organizationId, input.organizationId),
        eq(collaborationConversationMembers.conversationId, input.conversationId),
        eq(collaborationConversationMembers.employeeId, actor.id),
        isNull(collaborationConversationMembers.leftAt)
      ));
    if (!member) throw new AppError("FORBIDDEN", "You are not a member of this conversation.", 403);

    const [row] = await tx
      .select({
        attachment: collaborationAttachments,
        message: collaborationMessages,
      })
      .from(collaborationAttachments)
      .innerJoin(collaborationMessages, eq(collaborationAttachments.messageId, collaborationMessages.id))
      .where(and(
        eq(collaborationAttachments.id, input.attachmentId),
        eq(collaborationAttachments.organizationId, input.organizationId),
        eq(collaborationMessages.conversationId, input.conversationId)
      ));

    if (!row) throw new AppError("NOT_FOUND", "Attachment was not found.", 404);

    const storage = getStorageProvider();
    const buffer = await storage.download(row.attachment.storageKey);

    return {
      attachment: row.attachment,
      buffer,
    };
  });
}

export async function searchMessages(input: {
  organizationId: string;
  userId: string;
  query: string;
  limit?: number;
}) {
  await authorize({ organizationId: input.organizationId, permission: "chat.read" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const trimmed = input.query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    const matchingRows = await tx
      .select({
        id: collaborationMessages.id,
        conversationId: collaborationMessages.conversationId,
        content: collaborationMessages.content,
        type: collaborationMessages.type,
        createdAt: collaborationMessages.createdAt,
        senderDisplayName: employees.displayName,
        conversationName: collaborationConversations.name,
        conversationType: collaborationConversations.type,
      })
      .from(collaborationMessages)
      .innerJoin(
        collaborationConversations,
        eq(collaborationMessages.conversationId, collaborationConversations.id)
      )
      .innerJoin(
        collaborationConversationMembers,
        and(
          eq(collaborationConversationMembers.conversationId, collaborationMessages.conversationId),
          eq(collaborationConversationMembers.employeeId, actor.id),
          isNull(collaborationConversationMembers.leftAt)
        )
      )
      .innerJoin(employees, eq(collaborationMessages.senderEmployeeId, employees.id))
      .where(and(
        eq(collaborationMessages.organizationId, input.organizationId),
        isNull(collaborationMessages.deletedAt),
        ilike(collaborationMessages.content, `%${trimmed}%`)
      ))
      .orderBy(desc(collaborationMessages.createdAt))
      .limit(Math.min(input.limit ?? 20, 50));

    const directConvIds = matchingRows
      .filter((r) => r.conversationType === "direct" && !r.conversationName)
      .map((r) => r.conversationId);

    const otherMemberNames = new Map<string, string>();
    if (directConvIds.length > 0) {
      const otherMembers = await tx
        .select({
          conversationId: collaborationConversationMembers.conversationId,
          displayName: employees.displayName,
        })
        .from(collaborationConversationMembers)
        .innerJoin(employees, eq(collaborationConversationMembers.employeeId, employees.id))
        .where(and(
          eq(collaborationConversationMembers.organizationId, input.organizationId),
          inArray(collaborationConversationMembers.conversationId, directConvIds),
          ne(collaborationConversationMembers.employeeId, actor.id),
          isNull(collaborationConversationMembers.leftAt)
        ));

      for (const om of otherMembers) {
        otherMemberNames.set(om.conversationId, om.displayName);
      }
    }

    return matchingRows.map((row) => {
      const displayName =
        row.conversationName ||
        (row.conversationType === "direct" ? otherMemberNames.get(row.conversationId) ?? "Direct Chat" : "Group Chat");

      const content = row.content || "";
      const lower = content.toLowerCase();
      const matchIndex = lower.indexOf(trimmed.toLowerCase());
      let snippet = content;
      if (matchIndex !== -1) {
        const start = Math.max(0, matchIndex - 30);
        const end = Math.min(content.length, matchIndex + trimmed.length + 50);
        snippet = (start > 0 ? "…" : "") + content.substring(start, end) + (end < content.length ? "…" : "");
      }

      return {
        id: row.id,
        conversationId: row.conversationId,
        conversationName: displayName,
        conversationType: row.conversationType,
        senderDisplayName: row.senderDisplayName,
        content: row.content,
        snippet,
        createdAt: row.createdAt.toISOString(),
      };
    });
  });
}

export async function listChatRecipients(input: { organizationId: string; userId: string; search?: string }) {
  await authorize({ organizationId: input.organizationId, permission: "chat.read" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const activeStatuses = ["active", "probation", "confirmed"] as const;
    const baseConditions = [
      eq(employees.organizationId, input.organizationId),
      inArray(employees.status, activeStatuses as never),
      ne(employees.id, actor.id), // Exclude the current user so they cannot chat with themselves
    ];

    if (input.search?.trim()) {
      const searchPattern = `%${input.search.trim()}%`;
      baseConditions.push(
        or(
          ilike(employees.displayName, searchPattern),
          ilike(employees.workEmail, searchPattern),
          ilike(departments.name, searchPattern),
          ilike(designations.name, searchPattern)
        )!
      );
    }

    const rows = await tx
      .select({
        id: employees.id,
        displayName: employees.displayName,
        firstName: employees.firstName,
        lastName: employees.lastName,
        workEmail: employees.workEmail,
        departmentName: departments.name,
        designationTitle: designations.name,
      })
      .from(employees)
      .leftJoin(
        departments,
        and(eq(employees.departmentId, departments.id), eq(departments.organizationId, input.organizationId))
      )
      .leftJoin(
        designations,
        and(eq(employees.designationId, designations.id), eq(designations.organizationId, input.organizationId))
      )
      .where(and(...baseConditions))
      .orderBy(asc(employees.displayName))
      .limit(100);

    return rows;
  });
}

export async function markConversationAsRead(input: {
  organizationId: string;
  userId: string;
  conversationId: string;
}) {
  await authorize({ organizationId: input.organizationId, permission: "chat.read" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const [member] = await tx
      .select({ id: collaborationConversationMembers.id })
      .from(collaborationConversationMembers)
      .where(and(
        eq(collaborationConversationMembers.organizationId, input.organizationId),
        eq(collaborationConversationMembers.conversationId, input.conversationId),
        eq(collaborationConversationMembers.employeeId, actor.id),
        isNull(collaborationConversationMembers.leftAt)
      ));
    if (!member) throw new AppError("FORBIDDEN", "You are not a member of this conversation.", 403);

    const now = new Date();
    await tx
      .update(collaborationConversationMembers)
      .set({ lastReadAt: now, updatedAt: now })
      .where(eq(collaborationConversationMembers.id, member.id));

    return { success: true, lastReadAt: now.toISOString() };
  });
}

export async function updatePresence(input: {
  organizationId: string;
  userId: string;
  status?: "online" | "away" | "busy" | "offline";
}) {
  await authorize({ organizationId: input.organizationId, permission: "chat.read" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const now = new Date();
    const statusVal = input.status ?? "online";

    const [row] = await tx
      .insert(collaborationPresence)
      .values({
        organizationId: input.organizationId,
        employeeId: actor.id,
        status: statusVal,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: [collaborationPresence.organizationId, collaborationPresence.employeeId],
        set: {
          status: statusVal,
          lastSeenAt: now,
          updatedAt: now,
        },
      })
      .returning();

    return {
      status: row.status,
      lastSeenAt: row.lastSeenAt.toISOString(),
    };
  });
}

export async function getPresenceForEmployees(input: {
  organizationId: string;
  userId: string;
  employeeIds: string[];
}) {
  await authorize({ organizationId: input.organizationId, permission: "chat.read" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    if (input.employeeIds.length === 0) return {};

    const rows = await tx
      .select({
        employeeId: collaborationPresence.employeeId,
        status: collaborationPresence.status,
        lastSeenAt: collaborationPresence.lastSeenAt,
      })
      .from(collaborationPresence)
      .where(and(
        eq(collaborationPresence.organizationId, input.organizationId),
        inArray(collaborationPresence.employeeId, input.employeeIds)
      ));

    const now = Date.now();
    const result: Record<string, { status: "online" | "offline" | "away"; lastSeenAt: string | null }> = {};

    for (const r of rows) {
      const diff = now - new Date(r.lastSeenAt).getTime();
      const isOnline = diff < 60000 && r.status === "online";
      const isAway = diff < 120000 && r.status === "away";

      result[r.employeeId] = {
        status: isOnline ? "online" : isAway ? "away" : "offline",
        lastSeenAt: r.lastSeenAt ? r.lastSeenAt.toISOString() : null,
      };
    }

    return result;
  });
}

export async function signalTyping(input: {
  organizationId: string;
  userId: string;
  conversationId: string;
  isTyping: boolean;
}) {
  await authorize({ organizationId: input.organizationId, permission: "chat.read" });
  return withTenantTransaction(input.organizationId, async (tx) => {
    const actor = await employeeForUser(input.organizationId, input.userId, tx);
    const [member] = await tx
      .select({ id: collaborationConversationMembers.id })
      .from(collaborationConversationMembers)
      .where(and(
        eq(collaborationConversationMembers.organizationId, input.organizationId),
        eq(collaborationConversationMembers.conversationId, input.conversationId),
        eq(collaborationConversationMembers.employeeId, actor.id),
        isNull(collaborationConversationMembers.leftAt)
      ));
    if (!member) throw new AppError("FORBIDDEN", "You are not a member of this conversation.", 403);

    setTypingIndicator(input.conversationId, actor.id, actor.displayName, input.isTyping);
    return { success: true };
  });
}


