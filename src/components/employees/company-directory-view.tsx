"use client";

import React, { useMemo, useState } from "react";
import { Search, Mail, Building2, Briefcase, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export interface DirectoryEntry {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  workEmail: string | null;
  departmentName: string | null;
  designationTitle: string | null;
}

interface CompanyDirectoryViewProps {
  initialEmployees: DirectoryEntry[];
}

export function CompanyDirectoryView({ initialEmployees }: CompanyDirectoryViewProps) {
  const [search, setSearch] = useState("");

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return initialEmployees;
    const term = search.toLowerCase();
    return initialEmployees.filter((emp) => {
      const matchName = emp.displayName?.toLowerCase().includes(term);
      const matchEmail = emp.workEmail?.toLowerCase().includes(term);
      const matchDept = emp.departmentName?.toLowerCase().includes(term);
      const matchDesig = emp.designationTitle?.toLowerCase().includes(term);
      return matchName || matchEmail || matchDept || matchDesig;
    });
  }, [initialEmployees, search]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            type="search"
            placeholder="Search coworkers by name, department, or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface"
            aria-label="Search directory"
          />
        </div>
        <span className="text-xs text-muted font-medium">
          Showing {filteredEmployees.length} of {initialEmployees.length} team members
        </span>
      </div>

      {filteredEmployees.length === 0 ? (
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-12 text-center space-y-2">
            <Users className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-foreground">No team members found</p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              No colleagues matched your search query. Try searching by first name, last name, department, or job title.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((colleague) => {
            const initials = colleague.displayName
              ? colleague.displayName
                  .split(" ")
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "EM";

            return (
              <Card
                key={colleague.id}
                className="border-border/80 bg-surface shadow-xs transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {colleague.displayName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted truncate">
                        <Briefcase className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {colleague.designationTitle || "Team Member"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border/50 pt-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {colleague.departmentName ? (
                          <span className="font-medium text-slate-700">
                            {colleague.departmentName}
                          </span>
                        ) : (
                          <span className="text-muted italic">General Organization</span>
                        )}
                      </span>
                    </div>

                    {colleague.workEmail ? (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <a
                          href={`mailto:${colleague.workEmail}`}
                          className="font-mono text-[11px] text-primary hover:underline truncate"
                        >
                          {colleague.workEmail}
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted italic">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                        <span>No work email listed</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
