<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import ProvisioningProgressModal from "$lib/components/platform/ProvisioningProgressModal.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";
import Badge from "$lib/components/ui/Badge.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
import type { ProvisioningJobData } from '$lib/components/platform/types';
interface ProvisioningRowData {
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
let { initialRows }:ProvisioningManagerProps=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
let rows=$state<ProvisioningRowData[]>(untrack(()=>(initialRows)));
const setRows=(next:typeof rows|((previous:typeof rows)=>typeof rows))=>{rows=typeof next==="function"?(next as (previous:typeof rows)=>typeof rows)(rows):next;};
let activeJob=$state<ProvisioningJobData | null>(untrack(()=>(null)));
const setActiveJob=(next:typeof activeJob|((previous:typeof activeJob)=>typeof activeJob))=>{activeJob=typeof next==="function"?(next as (previous:typeof activeJob)=>typeof activeJob)(activeJob):next;};
let adminEmails=$state<Record<string, string>>(untrack(()=>({})));
const setAdminEmails=(next:typeof adminEmails|((previous:typeof adminEmails)=>typeof adminEmails))=>{adminEmails=typeof next==="function"?(next as (previous:typeof adminEmails)=>typeof adminEmails)(adminEmails):next;};
let errorMessages=$state<Record<string, string>>(untrack(()=>({})));
const setErrorMessages=(next:typeof errorMessages|((previous:typeof errorMessages)=>typeof errorMessages))=>{errorMessages=typeof next==="function"?(next as (previous:typeof errorMessages)=>typeof errorMessages)(errorMessages):next;};
let isProcessing=$state<Record<string, boolean>>(untrack(()=>({})));
const setIsProcessing=(next:typeof isProcessing|((previous:typeof isProcessing)=>typeof isProcessing))=>{isProcessing=typeof next==="function"?(next as (previous:typeof isProcessing)=>typeof isProcessing)(isProcessing):next;};
let pollingRef=$state({current:null as NodeJS.Timeout | null|null});
$effect(()=>{initialRows;return untrack(() => {
    setRows(initialRows);
  });});
$effect(()=>{initialRows;return untrack(() => {
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
  });});
$effect(()=>{activeJob;router;showToast;return untrack(() => {
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
            showToast({
              type: "success",
              title: "Provisioning completed",
              message: `Workspace for ${currentUpdated.organization.name} is ready.`,
            });
            router.refresh();
          } else if (currentUpdated.job.status === "failed") {
            sessionStorage.removeItem(STORAGE_KEY);
            showToast({
              type: "error",
              title: "Provisioning failed",
              message: currentUpdated.job.failureMessage ?? "Provisioning job encountered an error.",
            });
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
  });});
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
        showToast({
          type: "error",
          title: "Provisioning error",
          message: errorMsg,
        });
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
        showToast({
          type: "success",
          title: "Provisioning initiated",
          message: `Workspace provisioning started for ${row.organization.name}.`,
        });
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
      showToast({
        type: "error",
        title: "Provisioning failed",
        message: errorMsg,
      });
    } finally {
      setIsProcessing((prev) => ({ ...prev, [orgId]: false }));
    }
  }
function handleCloseModal() {
    setActiveJob(null);
  }
function handleRetryModal() {
    const currentJob = activeJob;
    if (!currentJob) return;
    const targetRow = rows.find((r) => r.organization.id === currentJob.organizationId);
    if (targetRow) {
      startProvisioning(targetRow);
    }
  }
</script>

      
      {#if activeJob}<ProvisioningProgressModal job={activeJob} onClose={handleCloseModal} onRetry={handleRetryModal} isRetrying={Boolean(isProcessing[activeJob.organizationId])} />{/if}

      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b text-xs uppercase tracking-wide text-muted">
            <tr>
              <th class="px-3 py-3">Organization</th>
              <th class="px-3 py-3">Type</th>
              <th class="px-3 py-3">Status</th>
              <th class="px-3 py-3">Step</th>
              <th class="px-3 py-3">Attempts</th>
              <th class="px-3 py-3">Created</th>
              <th class="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {#each rows as row}{@const { job, organization } = row}{@const isJobRunning = job.status === "running" || job.status === "retrying"}{@const isJobActionable = job.status === "pending" || job.status === "failed" || job.status === "retrying"}{@const isCurrentProcessing = Boolean(isProcessing[organization.id])}{@const rowEmail = adminEmails[organization.id] ?? organization.contactEmail ?? ""}<tr class="border-b align-top last:border-0 hover:bg-slate-50/70 transition-colors">
                  
                  <td class="px-3 py-4">
                    <div class="space-y-2 text-xs">
                      <a href={`/platform/organizations/${organization.id}`} class="font-semibold text-sm hover:text-primary">
                        {organization.name}
                      </a>

                      {#if isJobActionable && !isJobRunning}<div class="flex flex-wrap items-end gap-2 pt-1">
                          <label class="min-w-64 flex-1 font-medium text-muted">
                            Primary admin email
                            {#if !organization.contactEmail}<span class="ml-1 text-warning font-normal">(required)</span>{/if}
                            <Input type="email" value={rowEmail} onchange={(e) =>
                                setAdminEmails((prev) => ({
                                  ...prev,
                                  [organization.id]: e.currentTarget.value,
                                }))} disabled={isCurrentProcessing} placeholder="admin@company.com" class="mt-1 h-8 text-xs" />
                          </label>
                          <Button size="sm" onclick={() => startProvisioning(row)} disabled={isCurrentProcessing || isJobRunning}>
                            {#if isCurrentProcessing}{"Starting…"}{:else}{#if job.status === "failed" || job.status === "retrying"}{"Retry"}{:else}{"Process"}{/if}{/if}
                          </Button>
                        </div>{/if}

                      
                      {#if isJobRunning}<div class="flex items-center gap-2 pt-1">
                          <span class="inline-flex items-center gap-1.5 text-xs text-blue-700 font-medium">
                            <span class="size-2 rounded-full bg-blue-600 animate-pulse"></span>
                            Provisioning is currently running
                          </span>
                          <button type="button" onclick={() =>
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
                              })} class="cursor-pointer text-xs font-semibold text-primary hover:underline ml-2">
                            View progress modal
                          </button>
                        </div>{/if}

                      
                      {#if job.status === "completed"}<p class="pt-1">
                          <a href={`/platform/organizations/${organization.id}`} class="text-xs font-semibold text-primary hover:underline">
                            View organization
                          </a>
                        </p>{/if}

                      
                      {#if job.failureMessage}<p role="alert" class="text-destructive font-medium">
                          {job.failureMessage}
                        </p>{/if}
                      {#if errorMessages[organization.id]}<p role="alert" class="text-destructive font-medium">
                          {errorMessages[organization.id]}
                        </p>{/if}
                    </div>
                  </td>

                  
                  <td class="px-3 py-4 text-muted">{job.jobType}</td>

                  
                  <td class="px-3 py-4">
                    <Badge class={job.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : isJobRunning
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : job.status === "failed"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : ""}>
                      {job.status}
                    </Badge>
                  </td>

                  
                  <td class="px-3 py-4 text-muted">
                    <span class="font-mono text-xs">{job.currentStep}</span>
                  </td>

                  
                  <td class="px-3 py-4">{job.attempts}</td>

                  
                  <td class="px-3 py-4 text-muted">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>

                  
                  <td class="px-3 py-4">
                    {#if job.status === "completed"}<span class="inline-flex items-center text-xs font-medium text-emerald-700">
                        ✓ Ready
                      </span>{:else}{#if isJobRunning}<span class="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <span class="size-1.5 rounded-full bg-primary animate-ping"></span>
                        In progress
                      </span>{:else}<span class="text-xs text-amber-700 font-medium">
                        Needs action
                      </span>{/if}{/if}
                  </td>
                </tr>{/each}
          </tbody>
        </table>
        {#if !rows.length}<p class="p-8 text-center text-sm text-muted">No provisioning jobs found.</p>{/if}
      </div>
    
