import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-slate-200/70", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function PageHeaderSkeleton({
  hasBadge = true,
  hasAction = false,
}: {
  hasBadge?: boolean;
  hasAction?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        {hasBadge && (
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>
        )}
        <Skeleton className="h-8 w-64 sm:w-80" />
        <Skeleton className="h-4 w-72 sm:w-96 max-w-full" />
      </div>
      {hasAction && (
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      )}
    </div>
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-9 rounded-lg" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TableCardSkeleton({
  rows = 5,
  hasFilter = true,
}: {
  rows?: number;
  hasFilter?: boolean;
}) {
  return (
    <Card className="border-border/80 bg-surface shadow-xs">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-72" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {hasFilter && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-9 w-full sm:w-72 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        )}
        <div className="divide-y divide-border/60 rounded-xl border border-border/70 overflow-hidden">
          <div className="flex items-center justify-between bg-slate-50/80 px-4 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-28 hidden sm:block" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border/80 bg-surface shadow-xs">
          <CardHeader className="space-y-2 pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-48" />
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <Skeleton className="h-7 w-24" />
            <div className="space-y-2 pt-2 border-t border-border/50">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
