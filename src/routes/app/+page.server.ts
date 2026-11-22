import {error} from '@sveltejs/kit';import {and,eq,sql,isNull} from 'drizzle-orm';import {tenantRead} from '$lib/server/tenant-read';
import {approvalTasks,employees,notifications} from '$lib/server/schema';import {can} from '$lib/auth/policy';import {APPROVAL_PERMISSIONS} from '$lib/domain/rbac/permissions';
export const load:import('./$types').PageServerLoad=async({locals})=>{
 const ctx=await locals.context;if(!ctx?.organization)error(403,'Organization access is required.');
 const canReadEmployees=can(ctx,'employee.read'),canViewApprovals=APPROVAL_PERMISSIONS.some(p=>can(ctx,p)),canViewAts=can(ctx,'ats.view');
 try{
  const initialMetrics=await tenantRead(ctx,async tx=>{
   const org=ctx.organization!.id;
   const [workforce,pending,unread]=await Promise.all([
    canReadEmployees?tx.select({count:sql<number>`count(*)::int`}).from(employees).where(eq(employees.organizationId,org)):Promise.resolve([{count:0}]),
    canViewApprovals?tx.select({count:sql<number>`count(*)::int`}).from(approvalTasks).where(and(eq(approvalTasks.organizationId,org),eq(approvalTasks.approverUserId,ctx.user.id),eq(approvalTasks.status,'pending'))):Promise.resolve([{count:0}]),
    tx.select({count:sql<number>`count(*)::int`}).from(notifications).where(and(eq(notifications.organizationId,org),eq(notifications.recipientUserId,ctx.user.id),isNull(notifications.readAt)))
   ]);return{workforceCount:Number(workforce[0]?.count??0),pendingApprovalsCount:Number(pending[0]?.count??0),unreadNotificationsCount:Number(unread[0]?.count??0)};
  });
  return{fullName:ctx.user.fullName,canReadEmployees,canViewApprovals,canViewAts,initialMetrics};
 }catch{error(503,'Workspace metrics are unavailable.');}
};

