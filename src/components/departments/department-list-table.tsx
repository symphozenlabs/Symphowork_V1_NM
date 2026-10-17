"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  ChevronRight,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DepartmentCreateDialog } from "./department-create-dialog";
import type { DepartmentDateContext, DepartmentListItem } from "@/modules/departments/types";

interface DepartmentListTableProps {
  initialItems: DepartmentListItem[];
  initialDateContext: DepartmentDateContext;
  isOrganizationOwner: boolean;
}

export function DepartmentListTable({
  initialItems,
  initialDateContext,
  isOrganizationOwner,
}: DepartmentListTableProps) {
  const router = useRouter();
  const [items, setItems] = useState<DepartmentListItem[]>(initialItems);
  const [dateContext, setDateContext] = useState<DepartmentDateContext>(initialDateContext);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(initialDateContext.date);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/app/departments?date=${encodeURIComponent(newDate)}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setDateContext(data.dateContext);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }

  const filteredItems = items.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.manager?.displayName && d.manager.displayName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Departments & Functional Pods
          </h1>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">
            Workspace organizational hierarchy, manager assignments, and daily workforce presence.
          </p>
        </div>

        {isOrganizationOwner && (
          <Button onClick={() => setIsCreateOpen(true)} className="shrink-0">
            <Plus className="size-4 mr-1.5" />
            Create Department
          </Button>
        )}
      </div>

      {/* Date & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-surface p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments or managers…"
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <Calendar className="size-4 text-primary shrink-0" />
            <label htmlFor="dept-date-picker" className="text-xs font-medium text-slate-600">
              Attendance date:
            </label>
            <input
              id="dept-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => void handleDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none"
            />
          </div>

          {dateContext.isHoliday && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
              <Sparkles className="size-3" />
              Holiday: {dateContext.holidayName || "Public Holiday"}
            </span>
          )}

          {!dateContext.isWorkingDay && !dateContext.isHoliday && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              Weekly Rest Day (Non-working)
            </span>
          )}
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Department Manager</th>
                  <th className="py-3 px-4 text-center">Total Workforce</th>
                  <th className="py-3 px-4 text-center">
                    Present
                    <span className="block text-[10px] font-normal normal-case text-muted">
                      {dateContext.date}
                    </span>
                  </th>
                  <th className="py-3 px-4 text-center">
                    Absent
                    <span className="block text-[10px] font-normal normal-case text-muted">
                      {dateContext.date}
                    </span>
                  </th>
                  <th className="py-3 px-4 text-center">
                    On Leave
                    <span className="block text-[10px] font-normal normal-case text-muted">
                      {dateContext.date}
                    </span>
                  </th>
                  <th className="py-3 px-4 text-center">
                    Pending
                    <span className="block text-[10px] font-normal normal-case text-muted">
                      {dateContext.date}
                    </span>
                  </th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-muted">
                      Loading department attendance data…
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-muted space-y-2">
                      <Building2 className="mx-auto size-8 text-slate-300" />
                      <p className="font-semibold text-slate-700">No departments found.</p>
                      <p className="text-slate-500">
                        {search
                          ? "Try adjusting your search criteria."
                          : isOrganizationOwner
                          ? "Get started by creating your first company department."
                          : "No departments have been configured by your Organization Owner yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((dept) => (
                    <tr
                      key={dept.id}
                      className="hover:bg-slate-50/80 transition-colors duration-100 group"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center font-mono font-bold text-xs px-2.5 py-0.5 rounded-md border border-[#CDE0CC] bg-[#E2EDE1] text-primary">
                          {dept.code}
                        </span>
                      </td>

                      {/* Name - Clickable Link */}
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <Link
                          href={`/app/departments/${dept.id}`}
                          className="hover:text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
                        >
                          {dept.name}
                        </Link>
                        {dept.status === "inactive" && (
                          <span className="ml-2 inline-flex items-center text-[10px] font-bold uppercase rounded-sm bg-slate-100 px-1.5 py-0.5 text-slate-500">
                            Inactive
                          </span>
                        )}
                        {dept.description && (
                          <p className="text-[11px] font-normal text-muted truncate max-w-xs mt-0.5">
                            {dept.description}
                          </p>
                        )}
                      </td>

                      {/* Manager */}
                      <td className="py-3.5 px-4 text-slate-700">
                        {dept.manager ? (
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                              {dept.manager.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate max-w-[180px]">
                              <p className="font-medium text-foreground text-xs leading-none">
                                {dept.manager.displayName}
                              </p>
                              <p className="text-[10px] text-muted font-normal mt-0.5">
                                {dept.manager.employeeId} · {dept.manager.roleTitle || "Manager"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic">Unassigned</span>
                        )}
                      </td>

                      {/* Total Workforce */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 text-sm">
                        {dept.totalEmployees}
                      </td>

                      {/* Present Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="size-3" />
                          {dept.presentCount}
                        </span>
                      </td>

                      {/* Absent Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                            dept.absentCount > 0
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          {dept.absentCount > 0 ? (
                            <XCircle className="size-3" />
                          ) : (
                            <CheckCircle2 className="size-3" />
                          )}
                          {dept.absentCount}
                        </span>
                      </td>

                      {/* On Leave Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                            dept.onLeaveCount > 0
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          {dept.onLeaveCount}
                        </span>
                      </td>

                      {/* Pending Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                            dept.pendingCount > 0
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          {dept.pendingCount}
                        </span>
                      </td>

                      {/* Link to Details */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/app/departments/${dept.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors p-1 rounded-md"
                          aria-label={`View details for ${dept.name}`}
                        >
                          <span>View</span>
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Creation Dialog */}
      <DepartmentCreateDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void handleDateChange(selectedDate);
          router.refresh();
        }}
      />
    </div>
  );
}
