import { legacyJSON } from '$lib/server/legacy';
import type { PlanSummary } from '$lib/components/platform/organization-wizard-types';

export const load: import('./$types').PageServerLoad = async ({ request, parent }) => {
  await parent();
  let plans: PlanSummary[] = [];
  try { plans = (await legacyJSON<{ plans: PlanSummary[] }>(request, '/api/platform/plans')).plans; } catch { /* Match the source page's no-plan fallback. */ }
  return { plans };
};
