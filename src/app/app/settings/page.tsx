import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { MasterDataManager } from "@/components/settings/master-data-manager";
import { Sliders, GitFork, CreditCard } from "lucide-react";

export default async function OrganizationSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tenant = await resolveTenantContext();
  if (!tenant.organization) redirect("/platform");

  try {
    await authorize({
      organizationId: tenant.organization.id,
      permission: "organization.settings.read",
    });
  } catch {
    redirect("/app");
  }

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sliders className="h-3 w-3" />
              Organization Master Configuration
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Governance & Taxonomies
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {tenant.organization.name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Configure organizational hierarchies, departments, designations, shifts, holidays, and working day calendars used across SymphoWork.
          </p>
        </div>

        {/* Sub-setting navigation links */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/app/settings/workflows"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50"
          >
            <GitFork className="h-3.5 w-3.5 text-primary" />
            Approval Workflows
          </Link>
          <Link
            href="/app/settings/billing"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50"
          >
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            Billing & Usage
          </Link>
        </div>
      </div>

      {/* Master Data Manager Component */}
      <MasterDataManager />
    </div>
  );
}
