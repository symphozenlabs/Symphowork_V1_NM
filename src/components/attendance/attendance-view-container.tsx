"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Clock, FileCheck2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceActions } from "@/components/attendance/attendance-actions";
import { RegularizationPanel } from "@/components/attendance/regularization-panel";
import { OrganizationAttendanceDashboard } from "@/components/attendance/organization-attendance-dashboard";

export function AttendanceViewContainer({
  canViewOthers = false,
  userRoleKey,
  initialEmployeeId = "",
  initialDate = "",
}: {
  canViewOthers?: boolean;
  userRoleKey?: string;
  initialEmployeeId?: string;
  initialDate?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const queryTab = searchParams.get("tab");
  const defaultTab = canViewOthers ? "organization" : "personal";
  const [activeTab, setActiveTab] = useState<"organization" | "personal" | "regularization">(
    queryTab === "personal" || queryTab === "regularization" || queryTab === "organization"
      ? queryTab
      : defaultTab
  );

  const handleTabChange = (tab: "organization" | "personal" | "regularization") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs for Authorized Management Roles */}
      {canViewOthers && (
        <div className="flex border-b border-slate-200">
          <nav className="-mb-px flex space-x-6" aria-label="Attendance Views">
            <button
              type="button"
              onClick={() => handleTabChange("organization")}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === "organization"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <LayoutDashboard className="size-4" />
              Organization Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("personal")}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === "personal"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Clock className="size-4" />
              My Time Clock & Punches
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("regularization")}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === "regularization"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <FileCheck2 className="size-4" />
              Regularization Requests
            </button>
          </nav>
        </div>
      )}

      {/* View 1: Organization Attendance Dashboard (Authorized Roles Only) */}
      {canViewOthers && activeTab === "organization" && (
        <OrganizationAttendanceDashboard userRoleKey={userRoleKey} />
      )}

      {/* View 2: Personal Time Clock Terminal */}
      {(!canViewOthers || activeTab === "personal") && (
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Today’s Shift Status & Punch Terminal
                </CardTitle>
                <p className="text-xs text-muted">
                  Punches are timestamped using organization timezone and assigned shift parameters
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <AttendanceActions
              canViewOthers={canViewOthers}
              initialEmployeeId={initialEmployeeId}
              initialDate={initialDate}
            />
          </CardContent>
        </Card>
      )}

      {/* View 3: Regularization Requests Panel */}
      {(!canViewOthers || activeTab === "regularization") && (
        <RegularizationPanel />
      )}
    </div>
  );
}
