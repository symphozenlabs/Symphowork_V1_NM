import { redirect } from "next/navigation";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { listPlans } from "@/modules/platform/commercial";
import { OrganizationCreateWizard } from "@/components/platform/organization-wizard/organization-create-wizard";
import type { PlanSummary } from "@/components/platform/organization-wizard/types";

export const metadata = {
  title: "Create Organization | Platform Console",
  description: "Register and configure a new tenant organization workspace",
};

export default async function NewOrganizationPage() {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.organizationCreate);
  } catch {
    redirect("/platform/login");
  }

  let plansData: PlanSummary[] = [];
  try {
    const rawPlans = await listPlans();
    plansData = rawPlans.map((p) => ({
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
    }));
  } catch {
    plansData = [];
  }

  return (
    <div className="mx-auto max-w-4xl py-2">
      <OrganizationCreateWizard initialPlans={plansData} />
    </div>
  );
}
