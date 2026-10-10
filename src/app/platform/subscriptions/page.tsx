import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { listSubscriptions } from "@/modules/platform/commercial";
import {
  SubscriptionManagement,
  type SerializedSubscriptionRow,
} from "@/components/platform/subscription-management";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string;
    q?: string;
    status?: string;
    billing?: string;
    billingInterval?: string;
    billingCycle?: string;
    page?: string;
  }>;
}) {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.subscriptionView);
  } catch {
    redirect("/platform/login");
  }

  const params = await searchParams;
  const query = params.q ?? params.query ?? "";
  const status = params.status ?? "all";
  const billing = params.billing ?? params.billingInterval ?? params.billingCycle ?? "all";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const result = await listSubscriptions({
    query: query || undefined,
    status: status !== "all" ? status : undefined,
    billingInterval: billing !== "all" ? billing : undefined,
    page,
    pageSize: 10,
  });

  const serializedRows: SerializedSubscriptionRow[] = result.rows.map((row) => ({
    subscription: {
      id: row.subscription.id,
      organizationId: row.subscription.organizationId,
      planId: row.subscription.planId,
      status: row.subscription.status,
      billingStatus: row.subscription.billingStatus,
      billingCycle: row.subscription.billingCycle,
      startsAt: row.subscription.startsAt?.toISOString() ?? null,
      renewalAt: row.subscription.renewalAt?.toISOString() ?? null,
      endsAt: row.subscription.endsAt?.toISOString() ?? null,
      providerCustomerId: row.subscription.providerCustomerId,
      providerSubscriptionId: row.subscription.providerSubscriptionId,
      createdAt: row.subscription.createdAt.toISOString(),
      updatedAt: row.subscription.updatedAt.toISOString(),
    },
    organization: {
      id: row.organization.id,
      name: row.organization.name,
      slug: row.organization.slug,
    },
    plan: {
      id: row.plan.id,
      code: row.plan.code,
      name: row.plan.name,
      currency: row.plan.currency,
      billingInterval: row.plan.billingInterval,
      monthlyPriceCents: row.plan.monthlyPriceCents,
      annualPriceCents: row.plan.annualPriceCents,
      active: row.plan.active,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Commercial Operations
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {result.total === 1 ? "subscription" : "subscriptions"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Organization Subscriptions
          </h1>
          <p className="mt-1 text-sm text-muted">
            Administrative subscription lifecycles, billing intervals, tier assignments, and external provider customer links.
          </p>
        </div>
      </div>

      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-semibold text-foreground">
            Active Subscription Registry
          </CardTitle>
          <p className="text-xs text-muted">
            Search by tenant name, filter by status or billing cadence, and manage tier allocations
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <SubscriptionManagement
            initialRows={serializedRows}
            total={result.total}
            page={result.page}
            pageSize={result.pageSize}
            pageCount={result.pageCount}
            initialQuery={query}
            initialStatus={status}
            initialBilling={billing}
          />
        </CardContent>
      </Card>
    </div>
  );
}
