"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export interface SerializedSubscriptionRow {
  subscription: {
    id: string;
    organizationId: string;
    planId: string;
    status: string;
    billingStatus: string;
    billingCycle: string;
    startsAt: string | null;
    renewalAt: string | null;
    endsAt: string | null;
    providerCustomerId: string | null;
    providerSubscriptionId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    id: string;
    code: string;
    name: string;
    currency: string;
    billingInterval: string;
    monthlyPriceCents: number | null;
    annualPriceCents: number | null;
    active: boolean;
  };
}

interface SubscriptionManagementProps {
  initialRows: SerializedSubscriptionRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  initialQuery?: string;
  initialStatus?: string;
  initialBilling?: string;
}

export function SubscriptionManagement({
  initialRows,
  total,
  page,
  pageSize,
  pageCount,
  initialQuery = "",
  initialStatus = "all",
  initialBilling = "all",
}: SubscriptionManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [billingFilter, setBillingFilter] = useState(initialBilling);

  // Sync state if URL query params change (e.g. back/forward navigation)
  useEffect(() => {
    setSearchInput(searchParams.get("q") ?? searchParams.get("query") ?? "");
    setStatusFilter(searchParams.get("status") ?? "all");
    setBillingFilter(
      searchParams.get("billing") ??
        searchParams.get("billingInterval") ??
        searchParams.get("billingCycle") ??
        "all"
    );
  }, [searchParams]);

  // Push new query parameters to URL
  function applyFilters(updates: {
    query?: string;
    status?: string;
    billing?: string;
    page?: number;
  }) {
    const q = updates.query !== undefined ? updates.query : searchInput;
    const st = updates.status !== undefined ? updates.status : statusFilter;
    const bl = updates.billing !== undefined ? updates.billing : billingFilter;
    const p = updates.page !== undefined ? updates.page : 1;

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (st && st !== "all") params.set("status", st);
    if (bl && bl !== "all") params.set("billing", bl);
    if (p > 1) params.set("page", String(p));

    const qs = params.toString();
    startTransition(() => {
      router.push(`/platform/subscriptions${qs ? `?${qs}` : ""}`);
    });
  }

  // Debounced search input handler
  useEffect(() => {
    const currentParam = searchParams.get("q") ?? searchParams.get("query") ?? "";
    if (searchInput === currentParam) return;

    const timer = setTimeout(() => {
      applyFilters({ query: searchInput, page: 1 });
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function handleStatusChange(newStatus: string) {
    setStatusFilter(newStatus);
    applyFilters({ status: newStatus, page: 1 });
  }

  function handleBillingChange(newBilling: string) {
    setBillingFilter(newBilling);
    applyFilters({ billing: newBilling, page: 1 });
  }

  function handleClearFilters() {
    setSearchInput("");
    setStatusFilter("all");
    setBillingFilter("all");
    startTransition(() => {
      router.push("/platform/subscriptions");
    });
  }

  function handlePrevPage() {
    if (page > 1) {
      applyFilters({ page: page - 1 });
    }
  }

  function handleNextPage() {
    if (page < pageCount) {
      applyFilters({ page: page + 1 });
    }
  }

  const hasActiveFilters = Boolean(
    searchInput.trim() || statusFilter !== "all" || billingFilter !== "all"
  );

  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(total, page * pageSize);

  return (
    <div className="space-y-4">
      {/* Filter and Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search organization, slug, plan name, plan code..."
              className="w-full rounded-lg border bg-surface px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full rounded-lg border bg-surface px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="inactive">Status: Inactive</option>
            </select>
          </div>

          {/* Billing Interval Filter */}
          <div className="w-full sm:w-44">
            <select
              value={billingFilter}
              onChange={(e) => handleBillingChange(e.target.value)}
              className="w-full rounded-lg border bg-surface px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Billing: All</option>
              <option value="monthly">Billing: Monthly</option>
              <option value="annual">Billing: Annual</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
              disabled={isPending}
            >
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* Subscriptions Table */}
      <div className="relative overflow-hidden rounded-xl border bg-surface">
        {/* Loading overlay indicator */}
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-[1px]">
            <div className="rounded-lg bg-surface border px-4 py-2 text-xs font-medium text-muted shadow-sm">
              Loading subscriptions…
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface-muted/30 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Billing</th>
                <th className="px-4 py-3 font-semibold">Renewal</th>
                <th className="px-4 py-3 font-semibold">Provider State</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialRows.map(({ subscription, organization, plan }) => {
                const isStatusActive = subscription.status === "active";
                const isStatusPending = subscription.status === "pending";

                return (
                  <tr key={subscription.id} className="transition-colors hover:bg-surface-muted/20">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground">{organization.name}</div>
                      <div className="text-xs text-muted font-mono">{organization.slug}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{plan.name}</span>
                        <span className="rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted">
                          {plan.code}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${
                          isStatusActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isStatusPending
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {subscription.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="capitalize text-foreground">
                        {subscription.billingCycle}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-muted">
                      {subscription.renewalAt
                        ? new Date(subscription.renewalAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          subscription.providerSubscriptionId
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted"
                        }`}
                      >
                        {subscription.providerSubscriptionId ? "Linked" : "Not linked"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {initialRows.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-base font-semibold text-foreground">No subscriptions found</p>
            {hasActiveFilters ? (
              <p className="mt-1 text-sm text-muted">
                No organization subscriptions matched your current search and filter settings.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">No organization subscriptions exist yet.</p>
            )}
            {hasActiveFilters && (
              <div className="mt-4">
                <Button type="button" variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t bg-surface-muted/10 px-4 py-3 sm:flex-row">
            <div className="text-xs text-muted">
              Showing <span className="font-semibold text-foreground">{startRecord}</span> to{" "}
              <span className="font-semibold text-foreground">{endRecord}</span> of{" "}
              <span className="font-semibold text-foreground">{total}</span> subscriptions
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">
                Page <span className="font-semibold text-foreground">{page}</span> of{" "}
                <span className="font-semibold text-foreground">{pageCount}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page <= 1 || isPending}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page >= pageCount || isPending}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
