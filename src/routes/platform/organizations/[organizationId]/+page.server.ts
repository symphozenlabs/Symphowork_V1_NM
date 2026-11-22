import { error } from '@sveltejs/kit';
import { legacyJSON } from '$lib/server/legacy';

export const load: import('./$types').PageServerLoad = async ({ request, params, parent }) => {
  await parent();
  const result = await legacyJSON<{ organization: Record<string, unknown> | null; job: Record<string, unknown> | null; invitation: Record<string, unknown> | null; subscription: Record<string, unknown> | null; employeeCount: number; activeEmployeeCount: number; activity: Array<Record<string, unknown>> }>(request, '/api/platform/organizations/' + encodeURIComponent(params.organizationId));
  if (!result.organization) error(404, 'Organization not found.');
  return result;
};
