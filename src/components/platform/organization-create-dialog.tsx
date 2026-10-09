"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Loader2, AlertCircle, Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanSummary } from "./organization-wizard/types";

const OrganizationCreateWizard = dynamic(
  () =>
    import("./organization-wizard/organization-create-wizard").then(
      (mod) => mod.OrganizationCreateWizard
    ),
  {
    loading: () => (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm font-medium text-slate-600">Loading wizard...</p>
      </div>
    ),
  }
);

export interface OrganizationCreateDialogProps {
  initialPlans?: PlanSummary[];
}

export function OrganizationCreateDialog({
  initialPlans,
}: OrganizationCreateDialogProps = {}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plans, setPlans] = useState<PlanSummary[]>(initialPlans ?? []);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const activeAbortController = useRef<AbortController | null>(null);
  const router = useRouter();

  // Sync if initialPlans are provided/updated externally
  useEffect(() => {
    if (initialPlans && initialPlans.length > 0) {
      setPlans(initialPlans);
      setPlansError(null);
    }
  }, [initialPlans]);

  const fetchPlans = useCallback(async () => {
    // Cancel any ongoing fetch to avoid duplicate requests
    if (activeAbortController.current) {
      activeAbortController.current.abort();
    }
    const controller = new AbortController();
    activeAbortController.current = controller;

    setIsLoadingPlans(true);
    setPlansError(null);

    try {
      const response = await fetch("/api/platform/plans", {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body.error?.message ?? "Failed to load platform subscription plans."
        );
      }

      if (!body.success || !Array.isArray(body.plans)) {
        throw new Error("Invalid plans data received from platform service.");
      }

      interface RawPlanApiItem {
        id: string;
        code: string;
        name: string;
        description?: string | null;
        monthlyPriceCents?: number | null;
        annualPriceCents?: number | null;
        currency: string;
        trialDays: number;
        maxUsers?: number | null;
        maxStorageBytes?: number | null;
        billingInterval: string;
        active: boolean;
      }

      const rawItems = body.plans as RawPlanApiItem[];
      const mapped: PlanSummary[] = rawItems.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description ?? null,
        monthlyPriceCents: p.monthlyPriceCents ?? null,
        annualPriceCents: p.annualPriceCents ?? null,
        currency: p.currency,
        trialDays: p.trialDays,
        maxUsers: p.maxUsers ?? null,
        maxStorageBytes: p.maxStorageBytes ?? null,
        billingInterval: p.billingInterval,
        active: Boolean(p.active),
      }));

      setPlans(mapped);
      setPlansError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred while loading plans.";
      setPlansError(message);
    } finally {
      if (activeAbortController.current === controller) {
        setIsLoadingPlans(false);
        activeAbortController.current = null;
      }
    }
  }, []);

  // Fetch plans on-demand when dialog opens if plans are not already loaded
  useEffect(() => {
    if (open && plans.length === 0 && !isLoadingPlans && !plansError) {
      fetchPlans();
    }
    return () => {
      // Abort in-flight requests when dialog closes
      if (activeAbortController.current) {
        activeAbortController.current.abort();
        activeAbortController.current = null;
      }
    };
  }, [open, plans.length, isLoadingPlans, plansError, fetchPlans]);

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-1.5 shadow-sm font-semibold text-xs"
      >
        <Plus className="size-4" />
        Create organization
      </Button>

      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (isSubmitting) return;
          setOpen(nextOpen);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            onPointerDownOutside={(e) => {
              if (isSubmitting) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              if (isSubmitting) e.preventDefault();
            }}
            className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 z-50 flex flex-col w-full sm:w-[94vw] sm:max-w-[1050px] sm:-translate-x-1/2 sm:-translate-y-1/2 h-full sm:h-[760px] sm:max-h-[calc(100vh-48px)] sm:rounded-2xl border-0 sm:border border-slate-200 bg-white shadow-2xl focus:outline-hidden overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]"
          >
            {open && (
              isLoadingPlans ? (
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <Dialog.Title className="text-lg font-bold tracking-tight text-slate-900">
                          Create New Organization
                        </Dialog.Title>
                        <Dialog.Description className="text-xs text-slate-500">
                          Loading platform configuration...
                        </Dialog.Description>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close dialog"
                      className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      Loading subscription plans...
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Retrieving active platform tiers and capacity limits.
                    </p>
                  </div>
                </div>
              ) : plansError ? (
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                        <AlertCircle className="size-5" />
                      </div>
                      <div>
                        <Dialog.Title className="text-lg font-bold tracking-tight text-slate-900">
                          Create New Organization
                        </Dialog.Title>
                        <Dialog.Description className="text-xs text-slate-500">
                          Configuration error
                        </Dialog.Description>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close dialog"
                      className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <div className="rounded-full bg-rose-100 p-3 text-rose-600">
                      <AlertCircle className="size-8" />
                    </div>
                    <p className="mt-3 text-base font-semibold text-slate-900">
                      Unable to load platform plans
                    </p>
                    <p className="mt-1 max-w-md text-xs text-slate-600">
                      {plansError}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => fetchPlans()}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <OrganizationCreateWizard
                  initialPlans={plans}
                  isModal={true}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                  onSubmittingChange={setIsSubmitting}
                />
              )
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
