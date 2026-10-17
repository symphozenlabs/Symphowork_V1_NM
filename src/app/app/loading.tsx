import React from "react";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Skeleton, KpiGridSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function WorkspaceOverviewLoading() {
  return (
    <div className="space-y-8 animate-fade-in" aria-busy="true" aria-label="Loading workspace overview">
      {/* Branded Loading Feedback */}
      <div className="flex items-center justify-between pb-1">
        <BrandedLoader inline message="Loading your workspace..." />
      </div>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-9 w-64 sm:w-80" />
          <Skeleton className="h-4 w-80 sm:w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* KPI Metrics */}
      <KpiGridSkeleton count={4} />

      {/* Workspace Activity & Modules */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
            <div className="space-y-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-60" />
            </div>
            <Skeleton className="h-4 w-16" />
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-surface shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
            <div className="space-y-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-60" />
            </div>
            <Skeleton className="h-4 w-16" />
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
