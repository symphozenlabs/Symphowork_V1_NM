import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
      <div>
        <Badge>Commercial operations</Badge>
        <h1 className="mt-3 text-3xl font-bold">Subscriptions</h1>
        <p className="mt-2 text-sm text-muted">
          Administrative subscription state, tier entitlements, and provider identifiers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Organization subscriptions{" "}
            <span className="ml-2 text-sm font-normal text-muted">({result.total})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
