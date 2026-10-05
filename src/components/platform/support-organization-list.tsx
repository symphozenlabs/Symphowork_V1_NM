"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Organizations</CardTitle>
        <div className="w-full sm:w-72">
          <Input
            type="search"
            placeholder="Search organizations…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search organizations"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && (
          <div className="text-xs text-muted">Updating results…</div>
        )}
        <div className="space-y-3">
          {rows.map((organization) => (
            <Link
              key={organization.id}
              href={`/platform/organizations/${organization.id}`}
              className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/30"
            >
              <span>
                <span className="block font-semibold">{organization.name}</span>
                <span className="text-xs text-muted">{organization.slug}</span>
              </span>
              <Badge>{organization.status}</Badge>
            </Link>
          ))}
        </div>
        {!rows.length && (
          <p className="p-8 text-center text-sm text-muted">No organizations found.</p>
        )}

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t bg-muted/10 px-4 py-3 sm:flex-row">
          <div className="text-sm text-muted">
            Showing <span className="font-semibold text-foreground">{startRecord}</span> to{" "}
            <span className="font-semibold text-foreground">{endRecord}</span> of{" "}
            <span className="font-semibold text-foreground">{total}</span> organizations
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
