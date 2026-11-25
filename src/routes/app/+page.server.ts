import {error} from '@sveltejs/kit';import {sql} from 'drizzle-orm';import {tenantRead} from '$lib/server/tenant-read';import {logPerf} from '$lib/server/perf-logger';
import {approvalTasks,employees,notifications} from '$lib/server/schema';import {can} from '$lib/auth/policy';import {APPROVAL_PERMISSIONS} from '$lib/domain/rbac/permissions';
export const load:import('./$types').PageServerLoad=async({locals})=>{
 const ctx=await locals.context;if(!ctx?.organization)error(403,'Organization access is required.');
 const canReadEmployees=can(ctx,'employee.read'),canViewApprovals=APPROVAL_PERMISSIONS.some(p=>can(ctx,p)),canViewAts=can(ctx,'ats.view');
 try{
  const metricsStart=performance.now();
  const initialMetrics=await tenantRead(ctx,async tx=>{
   const org=ctx.organization!.id;
   const result=await tx.execute(sql`select
    ${canReadEmployees?sql`(select count(*)::int from ${employees} where organization_id=${org})`:sql`0`} as "workforceCount",
    ${canViewApprovals?sql`(select count(*)::int from ${approvalTasks} where organization_id=${org} and approver_user_id=${ctx.user.id} and status='pending')`:sql`0`} as "pendingApprovalsCount",
    (select count(*)::int from ${notifications} where organization_id=${org} and recipient_user_id=${ctx.user.id} and read_at is null) as "unreadNotificationsCount"`);
   const metrics=result[0] as {workforceCount:number;pendingApprovalsCount:number;unreadNotificationsCount:number}|undefined;
   return{workforceCount:Number(metrics?.workforceCount??0),pendingApprovalsCount:Number(metrics?.pendingApprovalsCount??0),unreadNotificationsCount:Number(metrics?.unreadNotificationsCount??0)};
  });
  logPerf('DB','dashboard-metrics',performance.now()-metricsStart,'RESOLVED',200);
  return{fullName:ctx.user.fullName,canReadEmployees,canViewApprovals,canViewAts,initialMetrics};
 }catch{error(503,'Workspace metrics are unavailable.');}
};

