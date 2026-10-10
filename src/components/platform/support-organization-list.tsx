"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, ChevronRight, Search } from "lucide-react";

export interface SupportOrgRow {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface SupportOrganizationListProps {
  initialRows: SupportOrgRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  initialQuery?: string;
}

const statusBadgeMap: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  suspended: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
  rejected: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
};

export function SupportOrganizationList({
  initialRows,
  total,
  page,
  pageSize,
  pageCount,
  initialQuery = "",
}: SupportOrganizationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [rows, setRows] = useState<SupportOrgRow[]>(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    const currentParam = searchParams.get("q") ?? searchParams.get("query") ?? "";
    setSearchInput(currentParam);
  }, [searchParams]);

  function navigateTo(targetQuery: string, targetPage: number) {
    const params = new URLSearchParams();
    const trimmed = targetQuery.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(`/platform/support${qs ? `?${qs}` : ""}`);
    });
  }

  // Debounced search handler: reset to page 1 on search change
  useEffect(() => {
    const currentParam = searchParams.get("q") ?? searchParams.get("query") ?? "";
    if (searchInput === currentParam) return;

    const timer = setTimeout(() => {
      navigateTo(searchInput, 1);
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function handlePrevPage() {
    if (page > 1) {
      navigateTo(searchInput, page - 1);
    }
  }

  function handleNextPage() {
    if (page < pageCount) {
      navigateTo(searchInput, page + 1);
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
            Tenant Troubleshooting Directory
          </CardTitle>
          <p className="text-xs text-muted">
            Locate organizations for operational diagnosis and platform annotation
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <Input
            type="search"
            placeholder="Search organizations…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search organizations"
            className="pl-8 bg-slate-50/50 text-sm focus:bg-white"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {isPending && (
          <div className="text-xs text-muted animate-pulse">Updating directory results…</div>
        )}
        <div className="space-y-2.5">
          {rows.map((organization) => {
            const theme = statusBadgeMap[organization.status] || statusBadgeMap.active;
            return (
              <Link
                key={organization.id}
                href={`/platform/organizations/${organization.id}`}
                className="group flex items-center justify-between rounded-xl border border-border/70 bg-slate-50/40 p-4 transition-all hover:border-primary/30 hover:bg-slate-50 hover:shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary group-hover:text-white transition-colors">
                    {organization.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <span className="block font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {organization.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="font-mono text-slate-500">{organization.slug}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-slate-400 select-all">
                        {organization.id.slice(0, 8)}…
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${theme.bg} ${theme.text} ${theme.border}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                    {organization.status.toUpperCase()}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
        {!rows.length && (
          <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
            <Building2 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No organizations found</p>
            <p className="mt-1 text-xs text-muted">
              Try adjusting your search criteria or clear filters.
            </p>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/50 bg-slate-50/60 rounded-xl px-4 py-3 sm:flex-row">
          <div className="text-xs text-muted">
            Showing <span className="font-semibold text-foreground">{startRecord}</span> to{" "}
            <span className="font-semibold text-foreground">{endRecord}</span> of{" "}
            <span className="font-semibold text-foreground">{total}</span> organizations
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
