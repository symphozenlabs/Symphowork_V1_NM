"use client";

import { useEffect, useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ProvisioningJobData {
  id: string;
  organizationId: string;
  organizationName: string;
  status: string; // "pending" | "running" | "completed" | "failed" | "retrying"
  currentStep: string; // "created" | "roles" | "permissions" | "subscription" | "primary_admin_invitation" | "ready" | "failed"
  attempts: number;
  startedAt?: string | null;
  completedAt?: string | null;
  failureMessage?: string | null;
}

interface ProvisioningProgressModalProps {
  job: ProvisioningJobData;
  onClose: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
}

const STAGES = [
  { key: "roles", label: "Creating system roles" },
  { key: "permissions", label: "Configuring role permissions" },
  { key: "subscription", label: "Creating subscription & plan" },
  { key: "primary_admin_invitation", label: "Preparing primary admin invitation" },
] as const;

function getStepOrder(step: string): number {
  switch (step) {
    case "created":
      return 0;
    case "roles":
      return 1;
    case "permissions":
      return 2;
    case "subscription":
      return 3;
    case "primary_admin_invitation":
      return 4;
    case "ready":
      return 5;
    default:
      return 0;
  }
}

function calculateProgress(job: ProvisioningJobData): number {
  if (job.status === "completed" || job.currentStep === "ready") return 100;
  if (job.status === "failed") {
    // Show progress achieved before failure
    const stepOrder = getStepOrder(job.currentStep);
    return Math.max(15, Math.min(90, stepOrder * 25));
  }
  switch (job.currentStep) {
    case "created":
      return 10;
    case "roles":
      return 30;
    case "permissions":
      return 55;
    case "subscription":
      return 75;
    case "primary_admin_invitation":
      return 90;
    case "ready":
      return 100;
    default:
      return 20;
  }
}

function getEstimatedRemaining(job: ProvisioningJobData): string {
  if (job.status === "completed" || job.currentStep === "ready") {
    return "Provisioning completed";
  }
  if (job.status === "failed") {
    return "Provisioning failed";
  }
  switch (job.currentStep) {
    case "created":
      return "calculating...";
    case "roles":
      return "~3–5 min";
    case "permissions":
      return "~2–3 min";
    case "subscription":
      return "~1 min";
    case "primary_admin_invitation":
      return "~30s";
    default:
      return "calculating...";
  }
}

export function ProvisioningProgressModal({
  job,
  onClose,
  onRetry,
  isRetrying = false,
}: ProvisioningProgressModalProps) {
  const titleId = useId();
  const isRunning = job.status === "running" || job.status === "retrying";
  const isCompleted = job.status === "completed" || job.currentStep === "ready";
  const isFailed = job.status === "failed";

  const progress = calculateProgress(job);
  const currentStepOrder = getStepOrder(job.currentStep);
  const estimatedTime = getEstimatedRemaining(job);

  // Close on Escape key only if completed or failed
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isRunning) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-y-0 right-0 left-0 z-30 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs lg:left-64"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Provisioning
              </span>
              <Badge
                className={
                  isCompleted
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : isFailed
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                }
              >
                {isCompleted ? "Completed" : isFailed ? "Failed" : "In progress"}
              </Badge>
            </div>
            <h2 id={titleId} className="mt-1 text-xl font-bold text-foreground">
              {job.organizationName}
            </h2>
          </div>

          {/* Dismiss button (allows user to navigate/hide modal while keeping job running in backend) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>Overall progress</span>
            <span className="font-mono text-sm text-foreground">
              {isCompleted ? "100%" : isFailed ? `${progress}% (interrupted)` : `~${progress}%`}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                isCompleted
                  ? "bg-emerald-600"
                  : isFailed
                  ? "bg-red-600"
                  : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Real Backend Stages Checklist */}
        <div className="mt-6 space-y-3 rounded-xl border border-slate-100 bg-[#f9fafc] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Provisioning Stages
          </p>
          <ul className="space-y-2.5 text-sm">
            {STAGES.map((stage, idx) => {
              const stageOrder = idx + 1;
              const isStageDone = isCompleted || currentStepOrder > stageOrder;
              const isStageCurrent = isRunning && currentStepOrder === stageOrder;

              return (
                <li key={stage.key} className="flex items-center gap-3">
                  {isStageDone ? (
                    <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      ✓
                    </span>
                  ) : isStageCurrent ? (
                    <span className="grid size-5 place-items-center">
                      <span className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </span>
                  ) : (
                    <span className="grid size-5 place-items-center rounded-full border border-slate-300 text-xs text-transparent">
                      ○
                    </span>
                  )}
                  <span
                    className={`${
                      isStageDone
                        ? "font-medium text-foreground"
                        : isStageCurrent
                        ? "font-semibold text-primary"
                        : "text-muted"
                    }`}
                  >
                    {stage.label}
                  </span>
                  {isStageCurrent && (
                    <span className="ml-auto text-xs font-medium text-primary animate-pulse">
                      Processing…
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Status details & Estimated Remaining */}
        <div className="mt-5 rounded-lg border border-slate-100 p-3 text-xs">
          {isRunning && (
            <div className="flex items-center justify-between text-muted">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <span className="size-2 rounded-full bg-blue-500 animate-ping" />
                Backend operation active
              </span>
              <span>Estimated remaining: <strong className="text-foreground">{estimatedTime}</strong></span>
            </div>
          )}

          {isCompleted && (
            <div className="space-y-1 text-emerald-950">
              <p className="font-semibold text-emerald-700">✓ Provisioning completed successfully</p>
              <p className="text-muted">
                All roles, permissions, subscriptions, and primary admin invitations are initialized.
              </p>
            </div>
          )}

          {isFailed && (
            <div className="space-y-1">
              <p className="font-semibold text-destructive">✕ Provisioning failed</p>
              <p className="text-destructive/90">
                {job.failureMessage || "An error occurred during provisioning. You can retry the process."}
              </p>
            </div>
          )}
        </div>

        {/* Informational background persistence note */}
        {isRunning && (
          <p className="mt-3 text-center text-xs text-muted">
            The platform sidebar remains accessible. You can navigate away at any time; provisioning continues on the server.
          </p>
        )}

        {/* Footer Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          {isRunning ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              title="Close modal while provisioning continues in background"
            >
              Continue in background
            </Button>
          ) : isCompleted ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
              >
                Close
              </Button>
              {onRetry && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? "Starting retry…" : "Retry provisioning"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
