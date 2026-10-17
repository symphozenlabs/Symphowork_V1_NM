import React from "react";
import { Skeleton, KpiGridSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PlatformOverviewLoading() {
  return (
    <div className="space-y-8 animate-fade-in" aria-busy="true" aria-label="Loading platform overview">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-64 sm:w-80" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>

      {/* KPI Metrics */}
      <KpiGridSkeleton count={4} />

      {/* Commercial Summary Card */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
          <div className="space-y-1">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-3.5 w-80" />
          </div>
          <Skeleton className="h-7 w-32 rounded-md" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-36" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3-Column Operational Feeds */}
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, colIdx) => (
          <Card key={colIdx} className="flex flex-col border-border/80 bg-surface shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
              <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-48" />
              </div>
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="flex-1 pt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-lg shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
