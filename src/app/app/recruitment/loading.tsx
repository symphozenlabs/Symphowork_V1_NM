import React from "react";
import { Skeleton, KpiGridSkeleton, TableCardSkeleton } from "@/components/ui/skeleton";

export default function RecruitmentLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy="true" aria-label="Loading recruitment pipeline">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>
          <Skeleton className="h-8 w-64 sm:w-80" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <KpiGridSkeleton count={4} />

      <TableCardSkeleton rows={5} hasFilter={true} />
    </div>
  );
}
