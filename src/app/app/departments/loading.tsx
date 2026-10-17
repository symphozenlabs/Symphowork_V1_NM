import React from "react";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Skeleton, TableCardSkeleton } from "@/components/ui/skeleton";

export default function DepartmentsLoading() {
  return (
    <div
      className="space-y-6 animate-fade-in"
      aria-busy="true"
      aria-label="Loading departments"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BrandedLoader inline message="Loading departments..." />
          </div>
          <Skeleton className="h-8 w-64 sm:w-80" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      <TableCardSkeleton rows={5} hasFilter={true} />
    </div>
  );
}
