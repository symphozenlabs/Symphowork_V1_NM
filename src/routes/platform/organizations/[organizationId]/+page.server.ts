import { error } from '@sveltejs/kit';
import { loadApiData } from '$lib/server/load-api-data';
import { hasPlatformPermission, PLATFORM_PERMISSIONS as p } from '$lib/auth/platform';

export const load: import('./$types').PageServerLoad = async ({ request, params, parent }) => {
  const { context } = await parent();
  const result = await loadApiData<{ organization: Record<string, unknown> | null; job: Record<string, unknown> | null; invitation: Record<string, unknown> | null; subscription: Record<string, unknown> | null; employeeCount: number; activeEmployeeCount: number; activity: Array<Record<string, unknown>> }>(request, '/api/platform/organizations/' + encodeURIComponent(params.organizationId));
  if (!result.organization) error(404, 'Organization not found.');
  const role = context.user.platformRole;
  return {
    ...result,
    canManageStatus: hasPlatformPermission(role, p.organizationSuspend),
    canManageInvitation: hasPlatformPermission(role, p.provisioningManage),
    canViewSupportNotes: hasPlatformPermission(role, p.supportView),
    canViewTenantAudit: role !== 'PLATFORM_BILLING' && hasPlatformPermission(role, p.auditView),
  };
};
