"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Shield, Users } from "lucide-react";

export interface SerializedPlatformUserRow {
  id: string;
  email: string;
  fullName: string;
  status: string;
  platformRole: string;
  roleLabel: string;
  createdAt: string;
}

interface PlatformUserListProps {
  initialRows: SerializedPlatformUserRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  initialQuery?: string;
}

const roleBadgeMap: Record<string, { bg: string; text: string; border: string }> = {
  PLATFORM_OWNER: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  PLATFORM_ADMIN: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" },
  PLATFORM_SUPPORT: { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200" },
  PLATFORM_AUDITOR: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
};

export function PlatformUserList({
  initialRows,
  total,
  page,
  pageSize,
  pageCount,
  initialQuery = "",
}: PlatformUserListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [rows, setRows] = useState<SerializedPlatformUserRow[]>(initialRows);

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
      router.push(`/platform/users${qs ? `?${qs}` : ""}`);
    });
  }

  // Debounced search input handler: reset to page 1 on search change
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
            Platform Operator Directory
          </CardTitle>
          <p className="text-xs text-muted">
            Privileged platform administrators and governance accounts
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <Input
            type="search"
            placeholder="Search platform users…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search platform users"
            className="pl-8 bg-slate-50/50 text-sm focus:bg-white"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {isPending && (
          <div className="text-xs text-muted animate-pulse">Updating user directory…</div>
        )}
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 border-b border-border/70 text-xs font-semibold text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Platform User</th>
                <th className="px-4 py-3">Privilege Tier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Granted Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((row) => {
                const roleTheme = roleBadgeMap[row.platformRole] || roleBadgeMap.PLATFORM_ADMIN;
                const isActive = row.status === "active";
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                          {row.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="block font-semibold text-foreground text-sm">
                            {row.fullName}
                          </span>
                          <span className="text-xs text-muted font-mono">{row.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium border ${roleTheme.bg} ${roleTheme.text} ${roleTheme.border}`}
                      >
                        <Shield className="h-3 w-3" />
                        {row.roleLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted">
                      {row.createdAt}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && (
            <div className="p-8 text-center">
              <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No platform users found</p>
              <p className="mt-1 text-xs text-muted">
                No platform operator accounts match the current filter query.
              </p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/50 bg-slate-50/60 rounded-xl px-4 py-3 sm:flex-row">
          <div className="text-xs text-muted">
            Showing <span className="font-semibold text-foreground">{startRecord}</span> to{" "}
            <span className="font-semibold text-foreground">{endRecord}</span> of{" "}
            <span className="font-semibold text-foreground">{total}</span> users
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
