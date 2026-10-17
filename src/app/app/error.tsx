"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Workspace route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <Card className="max-w-md w-full border-danger-border bg-surface shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-danger-bg text-destructive">
            <AlertCircle className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-lg font-bold text-foreground">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-xs text-muted">
            We couldn’t load this workspace view. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2 text-center">
          <p className="text-xs text-muted line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-border">
            {error.message || "An unexpected workspace error occurred."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => reset()}
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              <span>Try again</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
