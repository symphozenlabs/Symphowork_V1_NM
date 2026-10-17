import React from "react";
import { Skeleton, TableCardSkeleton } from "@/components/ui/skeleton";

export default function PlatformOrganizationsLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy="true" aria-label="Loading organizations directory">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
          <Skeleton className="h-8 w-72 sm:w-96" />
          <Skeleton className="h-4 w-80 sm:w-[480px] max-w-full" />
        </div>
        <div className="shrink-0">
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      {/* Organizations Registry Table Card */}
      <TableCardSkeleton rows={6} hasFilter={true} />
    </div>
  );
}
