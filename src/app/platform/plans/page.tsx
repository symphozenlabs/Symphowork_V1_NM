import { redirect } from "next/navigation";
import { PlanManagement, type PlanItem, type PlanFeatureItem } from "@/components/platform/plan-management";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { getBatchPlanFeatures, listPlans } from "@/modules/platform/commercial";

export default async function PlansPage() {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.planView);
  } catch {
    redirect("/platform/login");
  }

  let canEditPlan = true;
  let canEditFeatures = true;
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.planManage);
  } catch {
    canEditPlan = false;
  }
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.entitlementManage);
  } catch {
    canEditFeatures = false;
  }

  const rawPlans = await listPlans();
  const rawFeaturesByPlan = await getBatchPlanFeatures(rawPlans.map((plan) => plan.id));

  const initialPlans: PlanItem[] = rawPlans.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    monthlyPriceCents: p.monthlyPriceCents,
    annualPriceCents: p.annualPriceCents,
    currency: p.currency,
    trialDays: p.trialDays,
    maxUsers: p.maxUsers,
    maxStorageBytes: p.maxStorageBytes,
    billingInterval: p.billingInterval,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const initialFeatures: Record<string, PlanFeatureItem[]> = {};
  for (const [planId, planFeats] of Object.entries(rawFeaturesByPlan)) {
    initialFeatures[planId] = planFeats.map((f) => ({
      id: f.id,
      planId: f.planId,
      featureKey: f.featureKey,
      enabled: f.enabled,
      limitValue: f.limitValue,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Commercial Engine
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {initialPlans.length} active tiers
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Plans & Modular Entitlements
          </h1>
          <p className="mt-1 text-sm text-muted">
            Platform-owned pricing structures, user capacities, storage quotas, and feature flags. Values represent operational tier boundaries.
          </p>
        </div>
      </div>

      <PlanManagement
        initialPlans={initialPlans}
        initialFeatures={initialFeatures}
        canEditPlan={canEditPlan}
        canEditFeatures={canEditFeatures}
      />
    </div>
  );
}
