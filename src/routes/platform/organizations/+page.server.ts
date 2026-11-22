import { legacyJSON } from '$lib/server/legacy';
import type { PlanSummary } from '$lib/components/platform/organization-wizard-types';

export const load: import('./$types').PageServerLoad = async ({ request, url, parent }) => {
  const { context } = await parent();
  const params = new URLSearchParams({ page: '1', pageSize: '50' });
  const result = await legacyJSON<{ rows: Array<{ id: string; name: string; slug: string; status: string; createdAt: string; provisioningStatus?: string | null }>; total: number }>(request, '/api/platform/organizations?' + params);
  let plans: PlanSummary[] = [];
  try { plans = (await legacyJSON<{ plans: PlanSummary[] }>(request, '/api/platform/plans')).plans; } catch { /* Source page keeps the registry usable if plan loading fails. */ }
  const autoOpen = ['true', '1'].includes(url.searchParams.get('create') ?? '') || url.searchParams.get('action') === 'create';
  return { context, result, plans, autoOpen, serializedRows: result.rows };
};
