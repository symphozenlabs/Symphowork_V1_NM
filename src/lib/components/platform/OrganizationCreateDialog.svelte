<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import DialogFrame from "$lib/components/ui/DialogFrame.svelte";
import OrganizationCreateWizard from "$lib/components/platform/OrganizationCreateWizard.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface OrganizationCreateDialogProps {
  initialPlans?: PlanSummary[];
  defaultOpen?: boolean;
}
let {
  initialPlans,
  defaultOpen = false,
}:OrganizationCreateDialogProps=$props();
let open=$state(untrack(()=>(defaultOpen)));
const setOpen=(next:typeof open|((previous:typeof open)=>typeof open))=>{open=typeof next==="function"?(next as (previous:typeof open)=>typeof open)(open):next;};
let isSubmitting=$state(untrack(()=>(false)));
const setIsSubmitting=(next:typeof isSubmitting|((previous:typeof isSubmitting)=>typeof isSubmitting))=>{isSubmitting=typeof next==="function"?(next as (previous:typeof isSubmitting)=>typeof isSubmitting)(isSubmitting):next;};
let plans=$state<PlanSummary[]>(untrack(()=>(initialPlans ?? [])));
const setPlans=(next:typeof plans|((previous:typeof plans)=>typeof plans))=>{plans=typeof next==="function"?(next as (previous:typeof plans)=>typeof plans)(plans):next;};
let isLoadingPlans=$state(untrack(()=>(false)));
const setIsLoadingPlans=(next:typeof isLoadingPlans|((previous:typeof isLoadingPlans)=>typeof isLoadingPlans))=>{isLoadingPlans=typeof next==="function"?(next as (previous:typeof isLoadingPlans)=>typeof isLoadingPlans)(isLoadingPlans):next;};
let plansError=$state<string | null>(untrack(()=>(null)));
const setPlansError=(next:typeof plansError|((previous:typeof plansError)=>typeof plansError))=>{plansError=typeof next==="function"?(next as (previous:typeof plansError)=>typeof plansError)(plansError):next;};
let activeAbortController=$state({current:null as AbortController | null|null});
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
const stripCreateQueryParam=$derived.by(()=>{return () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      let changed = false;
      if (url.searchParams.has("create")) {
        url.searchParams.delete("create");
        changed = true;
      }
      if (url.searchParams.get("action") === "create") {
        url.searchParams.delete("action");
        changed = true;
      }
      if (changed) {
        const newUrl =
          url.pathname + (url.search ? url.search : "") + (url.hash ? url.hash : "");
        window.history.replaceState(null, "", newUrl);
      }
    }
  };});
$effect(()=>{defaultOpen;stripCreateQueryParam;return untrack(() => {
    if (defaultOpen) {
      setOpen(true);
      stripCreateQueryParam();
    } else if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (
        url.searchParams.get("create") === "true" ||
        url.searchParams.get("create") === "1" ||
        url.searchParams.get("action") === "create"
      ) {
        setOpen(true);
        stripCreateQueryParam();
      }
    }
  });});
$effect(()=>{initialPlans;return untrack(() => {
    if (initialPlans && initialPlans.length > 0) {
      setPlans(initialPlans);
      setPlansError(null);
    }
  });});
const fetchPlans=$derived.by(()=>{return async () => {
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

      if (mapped.length === 0) {
        throw new Error(
          "No active subscription plans found. Please configure plans in Platform Console."
        );
      }

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
        activeAbortController.current = null;
      }
      setIsLoadingPlans(false);
    }
  };});
$effect(()=>{open;plans.length;isLoadingPlans;plansError;fetchPlans;return untrack(() => {
    if (open && plans.length === 0 && !isLoadingPlans && !plansError) {
      fetchPlans();
    }
  });});
$effect(()=>{return untrack(() => {
    return () => {
      if (activeAbortController.current) {
        activeAbortController.current.abort();
        activeAbortController.current = null;
      }
    };
  });});
const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      stripCreateQueryParam();
      if (activeAbortController.current) {
        activeAbortController.current.abort();
        activeAbortController.current = null;
      }
      setIsLoadingPlans(false);
    }
  };
const handleSuccess = () => {
    stripCreateQueryParam();
    setOpen(false);
    router.refresh();
  };
const handleCancel = () => {
    if (!isSubmitting) {
      stripCreateQueryParam();
      setOpen(false);
    }
  };


import type { PlanSummary } from '$lib/components/platform/organization-wizard-types';</script>

      <Button onclick={() => setOpen(true)} class="gap-1.5 shadow-sm font-semibold text-xs">
        <SvgIcon name="Plus" class="size-4" />
        Create organization
      </Button>

      <DialogFrame open={open} onOpenChange={handleOpenChange}>
        
          
          <div class="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 z-50 flex flex-col w-full sm:w-[94vw] sm:max-w-[1050px] sm:-translate-x-1/2 sm:-translate-y-1/2 h-full sm:h-[760px] sm:max-h-[calc(100vh-48px)] sm:rounded-2xl border-0 sm:border border-slate-200 bg-white shadow-2xl focus:outline-hidden overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]">
            {#if open}{#if isLoadingPlans}<div class="flex h-full flex-col">
                  <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <SvgIcon name="Building2" class="size-5" />
                      </div>
                      <div>
                        <h2 class="text-lg font-bold tracking-tight text-slate-900">
                          Create New Organization
                        </h2>
                        <p class="text-xs text-slate-500">
                          Loading platform configuration...
                        </p>
                      </div>
                    </div>
                    <button type="button" onclick={() => handleOpenChange(false)} aria-label="Close dialog" class="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                      <SvgIcon name="X" class="size-5" />
                    </button>
                  </div>
                  <div class="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <SvgIcon name="Loader2" class="size-8 animate-spin text-primary" />
                    <p class="mt-3 text-sm font-semibold text-slate-800">
                      Loading subscription plans...
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      Retrieving active platform tiers and capacity limits.
                    </p>
                  </div>
                </div>{:else}{#if plansError}<div class="flex h-full flex-col">
                  <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                        <SvgIcon name="AlertCircle" class="size-5" />
                      </div>
                      <div>
                        <h2 class="text-lg font-bold tracking-tight text-slate-900">
                          Create New Organization
                        </h2>
                        <p class="text-xs text-slate-500">
                          Configuration error
                        </p>
                      </div>
                    </div>
                    <button type="button" onclick={() => handleOpenChange(false)} aria-label="Close dialog" class="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                      <SvgIcon name="X" class="size-5" />
                    </button>
                  </div>
                  <div class="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <div class="rounded-full bg-rose-100 p-3 text-rose-600">
                      <SvgIcon name="AlertCircle" class="size-8" />
                    </div>
                    <p class="mt-3 text-base font-semibold text-slate-900">
                      Unable to load platform plans
                    </p>
                    <p class="mt-1 max-w-md text-xs text-slate-600">
                      {plansError}
                    </p>
                    <div class="mt-6 flex items-center gap-3">
                      <Button type="button" variant="secondary" size="sm" onclick={() => handleOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onclick={() => fetchPlans()}>
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>{:else}<OrganizationCreateWizard initialPlans={plans} isModal={true} onSuccess={handleSuccess} onCancel={handleCancel} onSubmittingChange={setIsSubmitting} />{/if}{/if}{/if}
          </div>
        
      </DialogFrame>
    
