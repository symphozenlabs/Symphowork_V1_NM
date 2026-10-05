"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Authorized platform users</CardTitle>
        <div className="w-full sm:w-72">
          <Input
            type="search"
            placeholder="Search platform users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search platform users"
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
                <th className="px-3 py-3">User</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-4">
                    <span className="block font-semibold">{row.fullName}</span>
                    <span className="text-xs text-muted">{row.email}</span>
                  </td>
                  <td className="px-3 py-4">
                    <Badge>{row.roleLabel}</Badge>
                  </td>
                  <td className="px-3 py-4">{row.status}</td>
                  <td className="px-3 py-4 text-muted">{row.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="p-8 text-center text-sm text-muted">No platform users found.</p>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t bg-muted/10 px-4 py-3 sm:flex-row">
          <div className="text-sm text-muted">
            Showing <span className="font-semibold text-foreground">{startRecord}</span> to{" "}
            <span className="font-semibold text-foreground">{endRecord}</span> of{" "}
            <span className="font-semibold text-foreground">{total}</span> users
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
