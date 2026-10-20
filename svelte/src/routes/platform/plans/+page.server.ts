import { hasPlatformPermission, PLATFORM_PERMISSIONS as p } from '$lib/auth/platform';
import { legacyJSON } from '$lib/server/legacy';

type Plan = { id: string; code: string; name: string; description: string | null; monthlyPriceCents: number | null; annualPriceCents: number | null; currency: string; trialDays: number; maxUsers: number | null; maxStorageBytes: number | null; billingInterval: string; active: boolean; createdAt: string; updatedAt: string };
type Feature = { id: string; planId: string; featureKey: string; enabled: boolean; limitValue: number | null };

export const load: import('./$types').PageServerLoad = async ({ request, locals, parent }) => {
  await parent();
  const context = (await locals.context)!;
  const { plans } = await legacyJSON<{ plans: Plan[] }>(request, '/api/platform/plans');
  const featurePairs = await Promise.all(plans.map(async plan => {
    const result = await legacyJSON<{ features: Feature[] }>(request, '/api/platform/plans/' + encodeURIComponent(plan.id));
    return [plan.id, result.features] as const;
  }));
  return { initialPlans: plans, initialFeatures: Object.fromEntries(featurePairs), canEditPlan: hasPlatformPermission(context.user.platformRole, p.planManage), canEditFeatures: hasPlatformPermission(context.user.platformRole, p.entitlementManage) };
};
