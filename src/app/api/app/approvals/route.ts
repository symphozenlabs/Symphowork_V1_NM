import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { approvalTasks, workflowInstances, workflowSteps } from "@/db/schema";
import { db } from "@/db/client";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";

export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const tasks = await db.select({ id: approvalTasks.id, status: approvalTasks.status, assignedAt: approvalTasks.assignedAt, comments: approvalTasks.comments, entityType: workflowInstances.entityType, entityId: workflowInstances.entityId, stepName: workflowSteps.name }).from(approvalTasks).innerJoin(workflowInstances, eq(approvalTasks.workflowInstanceId, workflowInstances.id)).innerJoin(workflowSteps, eq(approvalTasks.workflowStepId, workflowSteps.id)).where(and(eq(approvalTasks.organizationId, tenant.organization.id), eq(approvalTasks.approverUserId, tenant.user.id))).orderBy(desc(approvalTasks.assignedAt)); return NextResponse.json({ success: true, tasks }); } catch (error) { return errorResponse(error); } }
