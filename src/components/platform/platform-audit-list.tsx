"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Recent events</CardTitle>
        <div className="w-full sm:w-72">
          <Input
            type="search"
            placeholder="Search audit events..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search audit events"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && (
          <div className="text-xs text-muted">Updating results…</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Actor</th>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Resource</th>
                <th className="px-3 py-3">Organization</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ audit, actor, organization }) => (
                <tr key={audit.id} className="border-b last:border-0">
                  <td className="px-3 py-4 text-muted">{audit.createdAt}</td>
                  <td className="px-3 py-4">{actor?.name ?? "System"}</td>
                  <td className="px-3 py-4">
                    <Badge>{audit.action}</Badge>
                  </td>
                  <td className="px-3 py-4">{audit.resource}</td>
                  <td className="px-3 py-4 text-muted">
                    {organization?.name ?? audit.organizationId ?? "Platform"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="p-8 text-center text-sm text-muted">No platform events recorded.</p>
          )}
        </div>

        {/* Pagination Footer with Rows per page selector */}
        <div className="flex flex-col items-center justify-between gap-4 border-t bg-muted/10 px-4 py-3 sm:flex-row">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
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
                className="rounded-lg border bg-surface px-2 py-1 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">
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
