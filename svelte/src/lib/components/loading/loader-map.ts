import type {Component} from 'svelte';
export const loaders:Record<string,()=>Promise<{default:Component}>>={
  '/app/approvals':()=>import('./AppApprovalsLoading.svelte'),
  '/app/attendance':()=>import('./AppAttendanceLoading.svelte'),
  '/app/departments/[departmentId]':()=>import('./AppDepartmentsDepartmentidLoading.svelte'),
  '/app/departments':()=>import('./AppDepartmentsLoading.svelte'),
  '/app/employees':()=>import('./AppEmployeesLoading.svelte'),
  '/app/leave':()=>import('./AppLeaveLoading.svelte'),
  '/app':()=>import('./AppLoading.svelte'),
  '/app/notifications':()=>import('./AppNotificationsLoading.svelte'),
  '/app/payroll':()=>import('./AppPayrollLoading.svelte'),
  '/app/recruitment':()=>import('./AppRecruitmentLoading.svelte'),
  '/platform/audit':()=>import('./PlatformAuditLoading.svelte'),
  '/platform':()=>import('./PlatformLoading.svelte'),
  '/platform/organizations':()=>import('./PlatformOrganizationsLoading.svelte'),
  '/platform/plans':()=>import('./PlatformPlansLoading.svelte'),
  '/platform/provisioning':()=>import('./PlatformProvisioningLoading.svelte'),
  '/platform/subscriptions':()=>import('./PlatformSubscriptionsLoading.svelte')
};
export function loadingRoute(path:string):string|undefined {return Object.keys(loaders).sort((a,b)=>b.split('/').length-a.split('/').length).find(route=>{const parts=route.split('/'),actual=path.split('/');return parts.length<=actual.length && parts.every((part,index)=>part.startsWith('[')?Boolean(actual[index]):part===actual[index]);});}
