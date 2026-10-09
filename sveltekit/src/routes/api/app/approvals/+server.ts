import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { approvalTasks, workflowInstances, workflowSteps } from "@/db/schema";
import { AppError, errorResponse } from "@/lib/errors";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => { try { return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const tasks = await db.select({ id: approvalTasks.id, status: approvalTasks.status, assignedAt: approvalTasks.assignedAt, comments: approvalTasks.comments, entityType: workflowInstances.entityType, entityId: workflowInstances.entityId, stepName: workflowSteps.name }).from(approvalTasks).innerJoin(workflowInstances, eq(approvalTasks.workflowInstanceId, workflowInstances.id)).innerJoin(workflowSteps, eq(approvalTasks.workflowStepId, workflowSteps.id)).where(and(eq(approvalTasks.organizationId, tenant.organization.id), eq(approvalTasks.approverUserId, user.id))).orderBy(desc(approvalTasks.assignedAt)); return { success: true, tasks }; })); } catch (cause) { return errorResponse(cause); } };
