"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ProvisioningJobData,
  ProvisioningProgressModal,
} from "@/components/platform/provisioning-progress-modal";

export interface ProvisioningRowData {
  job: {
    id: string;
    organizationId: string;
    jobType: string;
    status: string;
    currentStep: string;
    attempts: number;
    startedAt: string | null;
    completedAt: string | null;
    failureMessage: string | null;
    createdAt: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    contactEmail: string | null;
  };
}

interface ApiJobItem {
  job: {
    id: string;
    organizationId: string;
    jobType: string;
    status: string;
    currentStep: string;
    attempts: number;
    startedAt: string | null;
    completedAt: string | null;
    failureMessage: string | null;
    createdAt: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    contactEmail: string | null;
  };
}

interface ProvisioningManagerProps {
  initialRows: ProvisioningRowData[];
}

const STORAGE_KEY = "active_provisioning_org_id";

export function ProvisioningManager({ initialRows }: ProvisioningManagerProps) {
  const router = useRouter();
  const [rows, setRows] = useState<ProvisioningRowData[]>(initialRows);
  const [activeJob, setActiveJob] = useState<ProvisioningJobData | null>(null);
  const [adminEmails, setAdminEmails] = useState<Record<string, string>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Sync rows from server when initialRows change
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  // Restore running job on mount or from sessionStorage across navigation
  useEffect(() => {
    // 1. Check if any row in initialRows is currently running
    const runningRow = initialRows.find(
      (r) => r.job.status === "running" || r.job.status === "retrying"
    );

    if (runningRow) {
      setActiveJob({
        id: runningRow.job.id,
        organizationId: runningRow.organization.id,
        organizationName: runningRow.organization.name,
        status: runningRow.job.status,
        currentStep: runningRow.job.currentStep,
        attempts: runningRow.job.attempts,
        startedAt: runningRow.job.startedAt,
        completedAt: runningRow.job.completedAt,
        failureMessage: runningRow.job.failureMessage,
      });
      return;
    }

    // 2. Check if user navigated away while an active job was running
    const storedOrgId = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (storedOrgId) {
      const match = initialRows.find((r) => r.organization.id === storedOrgId);
      if (match) {
        if (match.job.status === "running" || match.job.status === "retrying") {
          setActiveJob({
            id: match.job.id,
            organizationId: match.organization.id,
            organizationName: match.organization.name,
            status: match.job.status,
            currentStep: match.job.currentStep,
            attempts: match.job.attempts,
            startedAt: match.job.startedAt,
            completedAt: match.job.completedAt,
            failureMessage: match.job.failureMessage,
          });
        } else {
          // If already completed or failed, remove from sessionStorage
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [initialRows]);

  // Polling mechanism while active job is running
  useEffect(() => {
    if (!activeJob) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const isRunning = activeJob.status === "running" || activeJob.status === "retrying";
    if (!isRunning) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Start polling interval
    async function poll() {
      try {
        const res = await fetch("/api/platform/provisioning");
        if (!res.ok) return;
        const data = await res.json();
        if (!data.jobs || !Array.isArray(data.jobs)) return;

        // Update local rows
        const updatedRows = (data.jobs as ApiJobItem[]).map((item) => ({
          job: {
            ...item.job,
            startedAt: item.job.startedAt ? new Date(item.job.startedAt).toISOString() : null,
            completedAt: item.job.completedAt ? new Date(item.job.completedAt).toISOString() : null,
            createdAt: new Date(item.job.createdAt).toISOString(),
          },
          organization: item.organization,
        }));
        setRows(updatedRows);

        // Update active job state
        const currentUpdated = updatedRows.find(
          (r: ProvisioningRowData) => r.organization.id === activeJob?.organizationId
        );

        if (currentUpdated) {
          setActiveJob({
            id: currentUpdated.job.id,
            organizationId: currentUpdated.organization.id,
            organizationName: currentUpdated.organization.name,
            status: currentUpdated.job.status,
            currentStep: currentUpdated.job.currentStep,
            attempts: currentUpdated.job.attempts,
            startedAt: currentUpdated.job.startedAt,
            completedAt: currentUpdated.job.completedAt,
            failureMessage: currentUpdated.job.failureMessage,
          });

          // If job finished, stop and clean storage
          if (currentUpdated.job.status === "completed") {
            sessionStorage.removeItem(STORAGE_KEY);
            router.refresh();
          } else if (currentUpdated.job.status === "failed") {
            sessionStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        // Network failure during polling is tolerated; continue polling
      }
    }

    pollingRef.current = setInterval(poll, 2500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [activeJob, router]);

  async function startProvisioning(row: ProvisioningRowData) {
    const orgId = row.organization.id;
    const email = (adminEmails[orgId] ?? row.organization.contactEmail ?? "").trim();

    if (!email) {
      setErrorMessages((prev) => ({
        ...prev,
        [orgId]: "Enter the primary administrator email before processing this organization.",
      }));
      return;
    }

    setErrorMessages((prev) => ({ ...prev, [orgId]: "" }));
    setIsProcessing((prev) => ({ ...prev, [orgId]: true }));

    // Store in sessionStorage for persistent navigation recovery
    sessionStorage.setItem(STORAGE_KEY, orgId);

    // Immediately open modal in running state
    setActiveJob({
      id: row.job.id,
      organizationId: orgId,
      organizationName: row.organization.name,
      status: "running",
      currentStep: "roles",
      attempts: row.job.attempts + 1,
      startedAt: new Date().toISOString(),
      completedAt: null,
      failureMessage: null,
    });

    try {
      const response = await fetch(`/api/platform/provisioning/${orgId}/retry`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ primaryAdminEmail: email.toLowerCase() }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = body.error?.message ?? "Provisioning could not be completed.";
        setActiveJob((prev) =>
          prev && prev.organizationId === orgId
            ? { ...prev, status: "failed", currentStep: "failed", failureMessage: errorMsg }
            : null
        );
        setErrorMessages((prev) => ({ ...prev, [orgId]: errorMsg }));
      } else {
        // If POST completes synchronously
        const updatedJob = body.job ?? {};
        setActiveJob((prev) =>
          prev && prev.organizationId === orgId
            ? {
                ...prev,
                status: updatedJob.status ?? "completed",
                currentStep: updatedJob.currentStep ?? "ready",
                completedAt: updatedJob.completedAt ?? new Date().toISOString(),
              }
            : null
        );
        sessionStorage.removeItem(STORAGE_KEY);
        router.refresh();
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "The provisioning request failed. Check your connection.";
      setActiveJob((prev) =>
        prev && prev.organizationId === orgId
          ? { ...prev, status: "failed", currentStep: "failed", failureMessage: errorMsg }
          : null
      );
      setErrorMessages((prev) => ({ ...prev, [orgId]: errorMsg }));
    } finally {
      setIsProcessing((prev) => ({ ...prev, [orgId]: false }));
    }
  }

  function handleCloseModal() {
    setActiveJob(null);
  }

  function handleRetryModal() {
    if (!activeJob) return;
    const targetRow = rows.find((r) => r.organization.id === activeJob.organizationId);
    if (targetRow) {
      startProvisioning(targetRow);
    }
  }

  return (
    <>
      {/* Persistent Provisioning Progress Modal */}
      {activeJob && (
        <ProvisioningProgressModal
          job={activeJob}
          onClose={handleCloseModal}
          onRetry={handleRetryModal}
          isRetrying={Boolean(isProcessing[activeJob.organizationId])}
        />
      )}

      {/* Provisioning Jobs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-3">Organization</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Step</th>
              <th className="px-3 py-3">Attempts</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const { job, organization } = row;
              const isJobRunning = job.status === "running" || job.status === "retrying";
              const isJobActionable =
                job.status === "pending" || job.status === "failed" || job.status === "retrying";
              const isCurrentProcessing = Boolean(isProcessing[organization.id]);
              const rowEmail = adminEmails[organization.id] ?? organization.contactEmail ?? "";

              return (
                <tr key={job.id} className="border-b align-top last:border-0 hover:bg-[#fafcff]/60 transition-colors">
                  {/* Organization Column */}
                  <td className="px-3 py-4">
                    <div className="space-y-2 text-xs">
                      <Link
                        href={`/platform/organizations/${organization.id}`}
                        className="font-semibold text-sm hover:text-primary"
                      >
                        {organization.name}
                      </Link>

                      {isJobActionable && !isJobRunning && (
                        <div className="flex flex-wrap items-end gap-2 pt-1">
                          <label className="min-w-64 flex-1 font-medium text-muted">
                            Primary admin email
                            {!organization.contactEmail && (
                              <span className="ml-1 text-warning font-normal">(required)</span>
                            )}
                            <Input
                              type="email"
                              value={rowEmail}
                              onChange={(e) =>
                                setAdminEmails((prev) => ({
                                  ...prev,
                                  [organization.id]: e.target.value,
                                }))
                              }
                              disabled={isCurrentProcessing}
                              placeholder="admin@company.com"
                              className="mt-1 h-8 text-xs"
                            />
                          </label>
                          <Button
                            size="sm"
                            onClick={() => startProvisioning(row)}
                            disabled={isCurrentProcessing || isJobRunning}
                          >
                            {isCurrentProcessing
                              ? "Starting…"
                              : job.status === "failed" || job.status === "retrying"
                              ? "Retry"
                              : "Process"}
                          </Button>
                        </div>
                      )}

                      {/* If Job is currently running */}
                      {isJobRunning && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 font-medium">
                            <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
                            Provisioning is currently running
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveJob({
                                id: job.id,
                                organizationId: organization.id,
                                organizationName: organization.name,
                                status: job.status,
                                currentStep: job.currentStep,
                                attempts: job.attempts,
                                startedAt: job.startedAt,
                                completedAt: job.completedAt,
                                failureMessage: job.failureMessage,
                              })
                            }
                            className="cursor-pointer text-xs font-semibold text-primary hover:underline ml-2"
                          >
                            View progress modal
                          </button>
                        </div>
                      )}

                      {/* If Job is completed */}
                      {job.status === "completed" && (
                        <p className="pt-1">
                          <Link
                            href={`/platform/organizations/${organization.id}`}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View organization
                          </Link>
                        </p>
                      )}

                      {/* Error or failure message */}
                      {job.failureMessage && (
                        <p role="alert" className="text-destructive font-medium">
                          {job.failureMessage}
                        </p>
                      )}
                      {errorMessages[organization.id] && (
                        <p role="alert" className="text-destructive font-medium">
                          {errorMessages[organization.id]}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-4 text-muted">{job.jobType}</td>

                  {/* Status Badge */}
                  <td className="px-3 py-4">
                    <Badge
                      className={
                        job.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : isJobRunning
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : job.status === "failed"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : ""
                      }
                    >
                      {job.status}
                    </Badge>
                  </td>

                  {/* Step */}
                  <td className="px-3 py-4 text-muted">
                    <span className="font-mono text-xs">{job.currentStep}</span>
                  </td>

                  {/* Attempts */}
                  <td className="px-3 py-4">{job.attempts}</td>

                  {/* Created */}
                  <td className="px-3 py-4 text-muted">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>

                  {/* Action Summary */}
                  <td className="px-3 py-4">
                    {job.status === "completed" ? (
                      <span className="inline-flex items-center text-xs font-medium text-emerald-700">
                        ✓ Ready
                      </span>
                    ) : isJobRunning ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <span className="size-1.5 rounded-full bg-primary animate-ping" />
                        In progress
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700 font-medium">
                        Needs action
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-8 text-center text-sm text-muted">No provisioning jobs found.</p>
        )}
      </div>
    </>
  );
}
