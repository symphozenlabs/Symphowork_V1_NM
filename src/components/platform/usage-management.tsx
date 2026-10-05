"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export interface SerializedUsageRow {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    id: string;
    code: string;
    name: string;
    maxUsers: number | null;
  } | null;
  activeEmployees: number;
  employeeLimit: number | null;
  remaining: number | null;
  overLimit: boolean;
  nearLimit: boolean;
  limitReached: boolean;
  status: "within_limit" | "near_limit" | "limit_reached" | "over_limit";
  statusLabel: "Within limit" | "Near limit" | "Limit reached" | "Over limit";
}

export interface AvailablePlanItem {
  id: string;
  code: string;
  name: string;
}

interface UsageManagementProps {
  initialRows: SerializedUsageRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  availablePlans: AvailablePlanItem[];
  initialQuery?: string;
  initialStatus?: string;
  initialPlan?: string;
}

export function UsageManagement({
  initialRows,
  total,
  page,
  pageSize,
  pageCount,
  availablePlans,
  initialQuery = "",
  initialStatus = "all",
  initialPlan = "all",
}: UsageManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [planFilter, setPlanFilter] = useState(initialPlan);

  // Sync state if URL query params change (e.g. back/forward navigation)
  useEffect(() => {
    setSearchInput(searchParams.get("q") ?? searchParams.get("query") ?? "");
    setStatusFilter(searchParams.get("status") ?? "all");
    setPlanFilter(searchParams.get("plan") ?? "all");
  }, [searchParams]);

  // Push new query parameters to URL
  function applyFilters(updates: {
    query?: string;
    status?: string;
    plan?: string;
    page?: number;
  }) {
    const q = updates.query !== undefined ? updates.query : searchInput;
    const st = updates.status !== undefined ? updates.status : statusFilter;
    const pl = updates.plan !== undefined ? updates.plan : planFilter;
    const p = updates.page !== undefined ? updates.page : 1;

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (st && st !== "all") params.set("status", st);
    if (pl && pl !== "all") params.set("plan", pl);
    if (p > 1) params.set("page", String(p));

    const qs = params.toString();
    startTransition(() => {
      router.push(`/platform/usage${qs ? `?${qs}` : ""}`);
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

  function handlePlanChange(newPlan: string) {
    setPlanFilter(newPlan);
    applyFilters({ plan: newPlan, page: 1 });
  }

  function handleClearFilters() {
    setSearchInput("");
    setStatusFilter("all");
    setPlanFilter("all");
    startTransition(() => {
      router.push("/platform/usage");
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
    searchInput.trim() || statusFilter !== "all" || planFilter !== "all"
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
              <option value="within_limit">Status: Within limit</option>
              <option value="near_limit">Status: Near limit</option>
              <option value="limit_reached">Status: Limit reached</option>
              <option value="over_limit">Status: Over limit</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="w-full sm:w-48">
            <select
              value={planFilter}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full rounded-lg border bg-surface px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Plan: All plans</option>
              {availablePlans.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
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

      {/* Employee Capacity Table */}
      <div className="relative overflow-hidden rounded-xl border bg-surface">
        {/* Loading overlay indicator */}
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-[1px]">
            <div className="rounded-lg bg-surface border px-4 py-2 text-xs font-medium text-muted shadow-sm">
              Loading usage data…
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface-muted/30 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Active Employees</th>
                <th className="px-4 py-3 font-semibold">Allowed</th>
                <th className="px-4 py-3 font-semibold">Remaining</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialRows.map(({ organization, plan, activeEmployees, employeeLimit, remaining, status, statusLabel }) => {
                return (
                  <tr key={organization.id} className="transition-colors hover:bg-surface-muted/20">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground">{organization.name}</div>
                      <div className="text-xs text-muted font-mono">{organization.slug}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      {plan ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{plan.name}</span>
                          <span className="rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted">
                            {plan.code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">No plan</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-medium text-foreground">
                      {activeEmployees}
                    </td>

                    <td className="px-4 py-3.5 text-foreground">
                      {employeeLimit !== null ? employeeLimit : "Unlimited"}
                    </td>

                    <td className="px-4 py-3.5">
                      {remaining === null ? (
                        <span className="text-foreground">Unlimited</span>
                      ) : remaining < 0 ? (
                        <span className="font-semibold text-rose-600">{remaining}</span>
                      ) : remaining === 0 ? (
                        <span className="font-semibold text-amber-600">0</span>
                      ) : (
                        <span className="font-medium text-foreground">{remaining}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          status === "within_limit"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : status === "near_limit"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : status === "limit_reached"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {statusLabel}
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
            <p className="text-base font-semibold text-foreground">No organization usage found</p>
            {hasActiveFilters ? (
              <p className="mt-1 text-sm text-muted">
                No organizations matched your current search and filter settings.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">No organization records exist yet.</p>
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
              <span className="font-semibold text-foreground">{total}</span> organizations
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
