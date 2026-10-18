"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, X, Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeInvitationActions } from "@/components/employees/employee-invitation-actions";
import { cn } from "@/lib/utils";

export interface DirectoryEmployee {
  id: string;
  organizationId: string;
  userId: string | null;
  employeeId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  displayName: string;
  personalEmail?: string | null;
  workEmail?: string | null;
  phone?: string | null;
  joiningDate?: string | null;
  status: string;
  roleKey?: string | null;
  roleTitle?: string | null;
}

interface WorkforceDirectoryTableProps {
  initialEmployees: DirectoryEmployee[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  canInvite: boolean;
  currentUserId?: string | null;
  currentUserRole?: string | null;
  isPlatformOwner?: boolean;
}

const statusMap: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  onboarding: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  invited: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
  suspended: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
  terminated: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
};

const roleBadgeStyles: Record<string, string> = {
  ORGANIZATION_OWNER: "bg-emerald-50 text-emerald-800 border-emerald-200/90",
  HR_ADMIN: "bg-blue-50 text-blue-800 border-blue-200/90",
  HR_EXECUTIVE: "bg-cyan-50 text-cyan-800 border-cyan-200/90",
  FINANCE_ADMIN: "bg-amber-50 text-amber-800 border-amber-200/90",
  MANAGER: "bg-indigo-50 text-indigo-800 border-indigo-200/90",
  TEAM_LEAD: "bg-teal-50 text-teal-800 border-teal-200/90",
  PROJECT_MANAGER: "bg-violet-50 text-violet-800 border-violet-200/90",
  RECRUITER: "bg-rose-50 text-rose-800 border-rose-200/90",
  EMPLOYEE: "bg-slate-100 text-slate-700 border-slate-200/90",
};

export function WorkforceDirectoryTable({
  initialEmployees,
  initialTotal,
  initialPage,
  initialPageSize,
  canInvite,
  currentUserId,
  currentUserRole,
  isPlatformOwner,
}: WorkforceDirectoryTableProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-driven query state
  const initialSearchParam = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(initialSearchParam);
  const [activeSearch, setActiveSearch] = useState(initialSearchParam);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Data states
  const [employees, setEmployees] = useState<DirectoryEmployee[]>(initialEmployees);
  const [totalCount, setTotalCount] = useState<number>(initialTotal);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state if initial props change
  useEffect(() => {
    setEmployees(initialEmployees);
    setTotalCount(initialTotal);
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialEmployees, initialTotal, initialPage, initialPageSize]);

  // Debounced search handler
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== activeSearch) {
        setActiveSearch(searchInput);
        setCurrentPage(1); // Reset to page 1 on new query
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput, activeSearch]);

  // Fetch updated data from directory API
  const fetchDirectory = useCallback(
    async (query: string, page: number, size: number) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("search", query.trim());
        params.set("page", String(page));
        params.set("pageSize", String(size));

        // Update browser URL query string shallowly without triggering redundant Server Component flights
        const queryStr = params.toString();
        const newUrl = queryStr ? `${pathname}?${queryStr}` : pathname;
        if (typeof window !== "undefined") {
          window.history.replaceState(window.history.state, "", newUrl);
        }

        const res = await fetch(`/api/app/employees?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch employees");
        const json = await res.json();

        if (json.success) {
          setEmployees(json.rows || []);
          setTotalCount(json.total ?? json.rows?.length ?? 0);
        }
      } catch (err) {
        console.error("Error searching directory:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [pathname]
  );

  // Trigger fetch when search, page, or pageSize change (after initial mount)
  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void fetchDirectory(activeSearch, currentPage, pageSize);
  }, [activeSearch, currentPage, pageSize, fetchDirectory]);

  // Total pages calculation
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Range calculation for display: "Showing 1–10 of 42 people"
  const startRange = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, totalCount);

  // Reset search helper
  const handleResetSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 size-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search people by name, email, employee ID, or role…"
            aria-label="Search directory by name, email, employee ID, or role"
            className={cn(
              "h-10 w-full rounded-xl border border-border bg-white pl-9.5 pr-8 text-xs text-foreground placeholder:text-muted shadow-2xs transition-all",
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              isLoading && "pr-9"
            )}
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleResetSearch}
              aria-label="Clear search"
              className="absolute right-3 top-2.5 rounded-sm p-0.5 text-muted hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
          {isLoading && (
            <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-primary pointer-events-none" />
          )}
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-muted">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            aria-label="Records per page"
            className="h-9 rounded-lg border border-border bg-white px-2.5 text-xs font-medium text-foreground shadow-2xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Directory Table Card */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Workforce Directory Roster
              </CardTitle>
              <p className="text-xs text-muted">
                Authoritative organization member roster, role authorizations, and onboarding states
              </p>
            </div>
            <span className="text-xs text-muted font-medium">
              {totalCount === 0
                ? "No people"
                : `Showing ${startRange}–${endRange} of ${totalCount} ${totalCount === 1 ? "person" : "people"}`}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {totalCount === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
              <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              {activeSearch ? (
                <>
                  <p className="text-sm font-semibold text-foreground">No matching people found</p>
                  <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                    We couldn&apos;t find anyone matching &ldquo;{activeSearch}&rdquo;. Try another name, email, employee ID, or role.
                  </p>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetSearch}
                    >
                      Clear search
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">No employee records yet</p>
                  <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                    Begin by creating your organization’s first employee profile. Onboarding and invitation access can follow.
                  </p>
                  <div className="mt-4">
                    <Button asChild size="sm">
                      <Link href="/app/employees/new">Create first employee</Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 border-b border-border/70 text-xs font-semibold text-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joining Date</th>
                    <th className="px-4 py-3">Account Invitation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {employees.map((employee) => {
                    const theme = statusMap[employee.status] || statusMap.active;
                    const email = employee.workEmail ?? employee.personalEmail;
                    const badgeClass = employee.roleKey
                      ? roleBadgeStyles[employee.roleKey] || "bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-slate-50 text-slate-500 border-slate-200";
                    const isSelf = Boolean(
                      currentUserId &&
                      employee.userId === currentUserId &&
                      currentUserRole !== "ORGANIZATION_OWNER"
                    );

                    return (
                      <tr
                        key={employee.id}
                        className={cn(
                          "transition-colors",
                          isSelf ? "bg-slate-50/40 cursor-default" : "hover:bg-slate-50/70"
                        )}
                        title={isSelf ? "This is your own profile." : undefined}
                      >
                        {/* Employee Column */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                              {employee.displayName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              {isSelf ? (
                                <span
                                  className="block font-semibold text-foreground text-sm cursor-default"
                                  title="This is your own profile."
                                  aria-label={`${employee.displayName} (This is your own profile)`}
                                >
                                  {employee.displayName}
                                  <span className="ml-2 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                    You
                                  </span>
                                </span>
                              ) : (
                                <Link
                                  href={`/app/employees/${employee.id}`}
                                  className="block font-semibold text-foreground text-sm hover:text-primary transition-colors"
                                >
                                  {employee.displayName}
                                </Link>
                              )}
                              {email && (
                                <span className="text-xs text-muted font-mono truncate block max-w-xs">
                                  {email}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Employee ID Column */}
                        <td className="px-4 py-3.5 text-xs font-mono text-slate-600">
                          {employee.employeeId}
                        </td>

                        {/* Authoritative Role Column */}
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border shadow-2xs",
                              badgeClass
                            )}
                          >
                            {employee.roleTitle || "Unassigned"}
                          </span>
                        </td>

                        {/* Status Column */}
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                              theme.bg,
                              theme.text,
                              theme.border
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} />
                            {employee.status.toUpperCase()}
                          </span>
                        </td>

                        {/* Joining Date Column */}
                        <td className="px-4 py-3.5 text-xs text-muted">
                          {employee.joiningDate ?? "—"}
                        </td>

                        {/* Account Invitation Actions */}
                        <td className="px-4 py-3.5">
                          {canInvite ? (
                            employee.roleKey === "ORGANIZATION_OWNER" &&
                            currentUserRole !== "ORGANIZATION_OWNER" &&
                            !isPlatformOwner ? (
                              <span className="text-xs text-muted font-medium">Protected</span>
                            ) : (
                              <EmployeeInvitationActions
                                employeeId={employee.id}
                                email={employee.personalEmail ?? employee.workEmail}
                                status={employee.status}
                              />
                            )
                          ) : (
                            <span className="text-xs text-muted">Restricted</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Customized Pagination Controls */}
          {totalCount > 0 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-4">
              <span className="text-xs text-muted">
                Showing <strong className="font-semibold text-foreground">{startRange}</strong> to{" "}
                <strong className="font-semibold text-foreground">{endRange}</strong> of{" "}
                <strong className="font-semibold text-foreground">{totalCount}</strong> people
              </span>

              <nav aria-label="Workforce pagination" className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1 || isLoading}
                  aria-label="Previous page"
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                {/* Page Indicators */}
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  // Show pages if <= 5 or within distance of current page
                  if (
                    totalPages > 7 &&
                    pageNum !== 1 &&
                    pageNum !== totalPages &&
                    Math.abs(pageNum - currentPage) > 1
                  ) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span key={`ellipsis-${pageNum}`} className="px-1 text-xs text-muted">
                          …
                        </span>
                      );
                    }
                    return null;
                  }

                  const isActive = pageNum === currentPage;
                  return (
                    <Button
                      key={pageNum}
                      type="button"
                      variant={isActive ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={isLoading}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "h-8 min-w-[32px] px-2 text-xs",
                        isActive && "font-bold shadow-xs"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages || isLoading}
                  aria-label="Next page"
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </nav>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
