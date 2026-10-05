import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PlanManagement, type PlanItem, type PlanFeatureItem } from "@/components/platform/plan-management";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { getPlanFeatures, listPlans } from "@/modules/platform/commercial";

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
  const rawFeatures = await Promise.all(
    rawPlans.map(async (plan) => [plan.id, await getPlanFeatures(plan.id)] as const)
  );

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
  for (const [planId, planFeats] of rawFeatures) {
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
      <div>
        <Badge>Commercial configuration</Badge>
        <h1 className="mt-3 text-3xl font-bold">Plans & entitlements</h1>
        <p className="mt-2 text-sm text-muted">
          Platform-owned pricing, capacity limits, and feature entitlements. Values are configuration only; no payment is collected here.
        </p>
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
