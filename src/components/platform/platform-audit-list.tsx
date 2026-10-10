"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Clock, History } from "lucide-react";

export interface SerializedAuditRow {
  audit: {
    id: string;
    action: string;
    resource: string;
    organizationId: string | null;
    createdAt: string;
  };
  actor: {
    name: string | null;
  } | null;
  organization?: {
    name: string | null;
  } | null;
}

interface PlatformAuditListProps {
  initialRows: SerializedAuditRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  initialQuery?: string;
}

export function PlatformAuditList({
  initialRows,
  total,
  page,
  pageSize,
  pageCount,
  initialQuery = "",
}: PlatformAuditListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [rows, setRows] = useState<SerializedAuditRow[]>(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    const currentParam = searchParams.get("query") ?? searchParams.get("q") ?? "";
    setSearchInput(currentParam);
  }, [searchParams]);

  function navigateTo(targetQuery: string, targetPage: number, targetPageSize: number) {
    const params = new URLSearchParams();
    const trimmed = targetQuery.trim();
    if (trimmed) {
      params.set("query", trimmed);
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    if (targetPageSize !== 10) {
      params.set("pageSize", String(targetPageSize));
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(`/platform/audit${qs ? `?${qs}` : ""}`);
    });
  }

  // Debounced search input handler: reset to page 1 on search change
  useEffect(() => {
    const currentParam = searchParams.get("query") ?? searchParams.get("q") ?? "";
    if (searchInput === currentParam) return;

    const timer = setTimeout(() => {
      navigateTo(searchInput, 1, pageSize);
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, pageSize]);

  function handlePageSizeChange(newPageSize: number) {
    navigateTo(searchInput, 1, newPageSize);
  }

  function handlePrevPage() {
    if (page > 1) {
      navigateTo(searchInput, page - 1, pageSize);
    }
  }

  function handleNextPage() {
    if (page < pageCount) {
      navigateTo(searchInput, page + 1, pageSize);
    }
  }

  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(total, page * pageSize);
  const totalPages = Math.max(1, pageCount);

  return (
    <Card className="border-border/80 bg-surface shadow-xs">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            Governance Ledger Events
          </CardTitle>
          <p className="text-xs text-muted">
            Chronological audit stream recording security, authorization, and tenant lifecycle activity
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <Input
            type="search"
            placeholder="Search audit events…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search audit events"
            className="pl-8 bg-slate-50/50 text-sm focus:bg-white"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {isPending && (
          <div className="text-xs text-muted animate-pulse">Updating audit stream…</div>
        )}
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 border-b border-border/70 text-xs font-semibold text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action Event</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Scope / Tenant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map(({ audit, actor, organization }) => (
                <tr
                  key={audit.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{audit.createdAt}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-xs text-foreground">
                      {actor?.name ?? "Platform System"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {audit.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted font-mono">
                    {audit.resource}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {organization?.name ? (
                      <span className="font-medium text-slate-800">{organization.name}</span>
                    ) : audit.organizationId ? (
                      <span className="font-mono text-slate-500">{audit.organizationId.slice(0, 8)}…</span>
                    ) : (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Global Platform
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="p-8 text-center">
              <History className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No audit events recorded</p>
              <p className="mt-1 text-xs text-muted">
                No events matched your search query.
              </p>
            </div>
          )}
        </div>

        {/* Pagination Footer with Rows per page selector */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/50 bg-slate-50/60 rounded-xl px-4 py-3 sm:flex-row">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
            <div>
              Showing <span className="font-semibold text-foreground">{startRecord}</span> to{" "}
              <span className="font-semibold text-foreground">{endRecord}</span> of{" "}
              <span className="font-semibold text-foreground">{total}</span> events
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="rows-per-page" className="text-xs text-muted whitespace-nowrap">
                Rows per page
              </label>
              <select
                id="rows-per-page"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="rounded-lg border border-border/80 bg-surface px-2 py-1 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">
              Page <span className="font-semibold text-foreground">{page}</span> of{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
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
                disabled={page >= totalPages || isPending}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
