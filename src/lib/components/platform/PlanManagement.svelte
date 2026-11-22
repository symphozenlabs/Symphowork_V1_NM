<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import FeatureEditor from "$lib/components/platform/FeatureEditor.svelte";
import Button from "$lib/components/ui/Button.svelte";
import DialogFrame from "$lib/components/ui/DialogFrame.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
function planCodeSchema(value: string) { const text=value.trim(); const message=text.length<2?"Plan code must be at least 2 characters.":text.length>40?"Plan code must be at most 40 characters.":!/^[A-Z0-9_]{2,40}$/.test(text)?"Plan code must contain only uppercase letters, numbers, and underscores (2-40 characters).":null; return {success:!message,error:{issues:message?[{message}]:[]},data:text}; }
function planNameSchema(value: string) { const text=value.trim(); let message=text.length<2?"Plan name must be at least 2 characters.":text.length>80?"Plan name must be at most 80 characters.":!/[a-zA-Z]/.test(text)?"Plan name must contain at least one letter and cannot be numbers or symbols only.":!/^[a-zA-Z0-9\s\-'.&()]+$/.test(text)?"Plan name contains invalid characters. Only letters, numbers, spaces, and - ' . & ( ) are allowed.":null; return {success:!message,error:{issues:message?[{message}]:[]},data:text}; }
interface PlanItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPriceCents: number | null;
  annualPriceCents: number | null;
  currency: string;
  trialDays: number;
  maxUsers: number | null;
  maxStorageBytes: number | null;
  billingInterval: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
interface PlanFeatureItem {
  id: string;
  planId: string;
  featureKey: string;
  enabled: boolean;
  limitValue: number | null;
}
interface PlanManagementProps {
  initialPlans: PlanItem[];
  initialFeatures: Record<string, PlanFeatureItem[]>;
  canEditPlan: boolean;
  canEditFeatures: boolean;
}
let {
  initialPlans,
  initialFeatures,
  canEditPlan,
  canEditFeatures,
}:PlanManagementProps=$props();
let plans=$state<PlanItem[]>(untrack(()=>(initialPlans)));
const setPlans=(next:typeof plans|((previous:typeof plans)=>typeof plans))=>{plans=typeof next==="function"?(next as (previous:typeof plans)=>typeof plans)(plans):next;};
let features=$state<Record<string, PlanFeatureItem[]>>(untrack(()=>(initialFeatures)));
const setFeatures=(next:typeof features|((previous:typeof features)=>typeof features))=>{features=typeof next==="function"?(next as (previous:typeof features)=>typeof features)(features):next;};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
let successToast=$state<{ title: string; message?: string } | null>(untrack(()=>(null)));
const setSuccessToast=(next:typeof successToast|((previous:typeof successToast)=>typeof successToast))=>{successToast=typeof next==="function"?(next as (previous:typeof successToast)=>typeof successToast)(successToast):next;};
let createCode=$state(untrack(()=>("")));
const setCreateCode=(next:typeof createCode|((previous:typeof createCode)=>typeof createCode))=>{createCode=typeof next==="function"?(next as (previous:typeof createCode)=>typeof createCode)(createCode):next;};
let createName=$state(untrack(()=>("")));
const setCreateName=(next:typeof createName|((previous:typeof createName)=>typeof createName))=>{createName=typeof next==="function"?(next as (previous:typeof createName)=>typeof createName)(createName):next;};
let createDescription=$state(untrack(()=>("")));
const setCreateDescription=(next:typeof createDescription|((previous:typeof createDescription)=>typeof createDescription))=>{createDescription=typeof next==="function"?(next as (previous:typeof createDescription)=>typeof createDescription)(createDescription):next;};
let createMonthlyPrice=$state(untrack(()=>("")));
const setCreateMonthlyPrice=(next:typeof createMonthlyPrice|((previous:typeof createMonthlyPrice)=>typeof createMonthlyPrice))=>{createMonthlyPrice=typeof next==="function"?(next as (previous:typeof createMonthlyPrice)=>typeof createMonthlyPrice)(createMonthlyPrice):next;};
let createAnnualPrice=$state(untrack(()=>("")));
const setCreateAnnualPrice=(next:typeof createAnnualPrice|((previous:typeof createAnnualPrice)=>typeof createAnnualPrice))=>{createAnnualPrice=typeof next==="function"?(next as (previous:typeof createAnnualPrice)=>typeof createAnnualPrice)(createAnnualPrice):next;};
let createCurrency=$state(untrack(()=>("INR")));
const setCreateCurrency=(next:typeof createCurrency|((previous:typeof createCurrency)=>typeof createCurrency))=>{createCurrency=typeof next==="function"?(next as (previous:typeof createCurrency)=>typeof createCurrency)(createCurrency):next;};
let createTrialDays=$state(untrack(()=>("0")));
const setCreateTrialDays=(next:typeof createTrialDays|((previous:typeof createTrialDays)=>typeof createTrialDays))=>{createTrialDays=typeof next==="function"?(next as (previous:typeof createTrialDays)=>typeof createTrialDays)(createTrialDays):next;};
let createMaxUsers=$state(untrack(()=>("")));
const setCreateMaxUsers=(next:typeof createMaxUsers|((previous:typeof createMaxUsers)=>typeof createMaxUsers))=>{createMaxUsers=typeof next==="function"?(next as (previous:typeof createMaxUsers)=>typeof createMaxUsers)(createMaxUsers):next;};
let createBillingInterval=$state(untrack(()=>("monthly")));
const setCreateBillingInterval=(next:typeof createBillingInterval|((previous:typeof createBillingInterval)=>typeof createBillingInterval))=>{createBillingInterval=typeof next==="function"?(next as (previous:typeof createBillingInterval)=>typeof createBillingInterval)(createBillingInterval):next;};
let createActive=$state(untrack(()=>(true)));
const setCreateActive=(next:typeof createActive|((previous:typeof createActive)=>typeof createActive))=>{createActive=typeof next==="function"?(next as (previous:typeof createActive)=>typeof createActive)(createActive):next;};
let createLoading=$state(untrack(()=>(false)));
const setCreateLoading=(next:typeof createLoading|((previous:typeof createLoading)=>typeof createLoading))=>{createLoading=typeof next==="function"?(next as (previous:typeof createLoading)=>typeof createLoading)(createLoading):next;};
let createError=$state(untrack(()=>("")));
const setCreateError=(next:typeof createError|((previous:typeof createError)=>typeof createError))=>{createError=typeof next==="function"?(next as (previous:typeof createError)=>typeof createError)(createError):next;};
let editingPlan=$state<PlanItem | null>(untrack(()=>(null)));
const setEditingPlan=(next:typeof editingPlan|((previous:typeof editingPlan)=>typeof editingPlan))=>{editingPlan=typeof next==="function"?(next as (previous:typeof editingPlan)=>typeof editingPlan)(editingPlan):next;};
let editName=$state(untrack(()=>("")));
const setEditName=(next:typeof editName|((previous:typeof editName)=>typeof editName))=>{editName=typeof next==="function"?(next as (previous:typeof editName)=>typeof editName)(editName):next;};
let editDescription=$state(untrack(()=>("")));
const setEditDescription=(next:typeof editDescription|((previous:typeof editDescription)=>typeof editDescription))=>{editDescription=typeof next==="function"?(next as (previous:typeof editDescription)=>typeof editDescription)(editDescription):next;};
let editMonthlyPrice=$state(untrack(()=>("")));
const setEditMonthlyPrice=(next:typeof editMonthlyPrice|((previous:typeof editMonthlyPrice)=>typeof editMonthlyPrice))=>{editMonthlyPrice=typeof next==="function"?(next as (previous:typeof editMonthlyPrice)=>typeof editMonthlyPrice)(editMonthlyPrice):next;};
let editAnnualPrice=$state(untrack(()=>("")));
const setEditAnnualPrice=(next:typeof editAnnualPrice|((previous:typeof editAnnualPrice)=>typeof editAnnualPrice))=>{editAnnualPrice=typeof next==="function"?(next as (previous:typeof editAnnualPrice)=>typeof editAnnualPrice)(editAnnualPrice):next;};
let editCurrency=$state(untrack(()=>("INR")));
const setEditCurrency=(next:typeof editCurrency|((previous:typeof editCurrency)=>typeof editCurrency))=>{editCurrency=typeof next==="function"?(next as (previous:typeof editCurrency)=>typeof editCurrency)(editCurrency):next;};
let editTrialDays=$state(untrack(()=>("0")));
const setEditTrialDays=(next:typeof editTrialDays|((previous:typeof editTrialDays)=>typeof editTrialDays))=>{editTrialDays=typeof next==="function"?(next as (previous:typeof editTrialDays)=>typeof editTrialDays)(editTrialDays):next;};
let editMaxUsers=$state(untrack(()=>("")));
const setEditMaxUsers=(next:typeof editMaxUsers|((previous:typeof editMaxUsers)=>typeof editMaxUsers))=>{editMaxUsers=typeof next==="function"?(next as (previous:typeof editMaxUsers)=>typeof editMaxUsers)(editMaxUsers):next;};
let editBillingInterval=$state(untrack(()=>("monthly")));
const setEditBillingInterval=(next:typeof editBillingInterval|((previous:typeof editBillingInterval)=>typeof editBillingInterval))=>{editBillingInterval=typeof next==="function"?(next as (previous:typeof editBillingInterval)=>typeof editBillingInterval)(editBillingInterval):next;};
let editActive=$state(untrack(()=>(true)));
const setEditActive=(next:typeof editActive|((previous:typeof editActive)=>typeof editActive))=>{editActive=typeof next==="function"?(next as (previous:typeof editActive)=>typeof editActive)(editActive):next;};
let editLoading=$state(untrack(()=>(false)));
const setEditLoading=(next:typeof editLoading|((previous:typeof editLoading)=>typeof editLoading))=>{editLoading=typeof next==="function"?(next as (previous:typeof editLoading)=>typeof editLoading)(editLoading):next;};
let editError=$state(untrack(()=>("")));
const setEditError=(next:typeof editError|((previous:typeof editError)=>typeof editError))=>{editError=typeof next==="function"?(next as (previous:typeof editError)=>typeof editError)(editError):next;};
let deletingPlan=$state<PlanItem | null>(untrack(()=>(null)));
const setDeletingPlan=(next:typeof deletingPlan|((previous:typeof deletingPlan)=>typeof deletingPlan))=>{deletingPlan=typeof next==="function"?(next as (previous:typeof deletingPlan)=>typeof deletingPlan)(deletingPlan):next;};
let deleteLoading=$state(untrack(()=>(false)));
const setDeleteLoading=(next:typeof deleteLoading|((previous:typeof deleteLoading)=>typeof deleteLoading))=>{deleteLoading=typeof next==="function"?(next as (previous:typeof deleteLoading)=>typeof deleteLoading)(deleteLoading):next;};
let deleteError=$state(untrack(()=>("")));
const setDeleteError=(next:typeof deleteError|((previous:typeof deleteError)=>typeof deleteError))=>{deleteError=typeof next==="function"?(next as (previous:typeof deleteError)=>typeof deleteError)(deleteError):next;};
let deactivateLoading=$state(untrack(()=>(false)));
const setDeactivateLoading=(next:typeof deactivateLoading|((previous:typeof deactivateLoading)=>typeof deactivateLoading))=>{deactivateLoading=typeof next==="function"?(next as (previous:typeof deactivateLoading)=>typeof deactivateLoading)(deactivateLoading):next;};
$effect(()=>{successToast;return untrack(() => {
    if (!successToast) return;
    const timer = setTimeout(() => setSuccessToast(null), 5000);
    return () => clearTimeout(timer);
  });});
$effect(()=>{initialPlans;return untrack(() => {
    setPlans(initialPlans);
  });});
$effect(()=>{initialFeatures;return untrack(() => {
    setFeatures(initialFeatures);
  });});
function formatMoney(amountCents: number | null, currency: string) {
    if (amountCents === null) return "—";
    const amount = (amountCents / 100).toFixed(2);
    return `${currency} ${amount}`;
  }
async function handleCreateSubmit(e: SubmitEvent) {
    e.preventDefault();
    setCreateError("");

    const trimmedCode = createCode.trim().toUpperCase();
    const trimmedName = createName.trim();

    // Client-side validations
    const codeValidation = planCodeSchema(trimmedCode);
    if (!codeValidation.success) {
      setCreateError(codeValidation.error.issues[0]?.message ?? "Invalid plan code.");
      return;
    }

    const nameValidation = planNameSchema(trimmedName);
    if (!nameValidation.success) {
      setCreateError(nameValidation.error.issues[0]?.message ?? "Invalid plan name.");
      return;
    }

    setCreateLoading(true);

    const payload = {
      code: trimmedCode,
      name: trimmedName,
      description: createDescription.trim() || undefined,
      monthlyPriceCents: createMonthlyPrice === "" ? null : Number(createMonthlyPrice),
      annualPriceCents: createAnnualPrice === "" ? null : Number(createAnnualPrice),
      currency: createCurrency.trim().toUpperCase(),
      trialDays: Number(createTrialDays || 0),
      maxUsers: createMaxUsers === "" ? null : Number(createMaxUsers),
      maxStorageBytes: null,
      billingInterval: createBillingInterval,
      active: createActive,
    };

    try {
      const response = await fetch("/api/platform/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = body.error?.message ?? "Unable to create plan. Please try again.";
        setCreateError(errorMsg);
        showToast({
          type: "error",
          title: "Failed to create plan",
          message: errorMsg,
        });
        setCreateLoading(false);
        return;
      }

      const newPlan: PlanItem = {
        ...body.plan,
        createdAt: body.plan.createdAt ?? new Date().toISOString(),
        updatedAt: body.plan.updatedAt ?? new Date().toISOString(),
      };

      setPlans((prev) => [newPlan, ...prev]);
      const successTitle = "Plan created successfully.";
      const successMsg = `Plan \u201c${newPlan.name}\u201d (${newPlan.code}) is now available.`;
      setSuccessToast({
        title: successTitle,
        message: successMsg,
      });
      showToast({
        type: "success",
        title: successTitle,
        message: successMsg,
      });

      // Reset form
      setCreateCode("");
      setCreateName("");
      setCreateDescription("");
      setCreateMonthlyPrice("");
      setCreateAnnualPrice("");
      setCreateCurrency("INR");
      setCreateTrialDays("0");
      setCreateMaxUsers("");
      setCreateBillingInterval("monthly");
      setCreateActive(true);
      setCreateError("");
    } catch {
      const netMsg = "Network error. Please check your connection and try again.";
      setCreateError(netMsg);
      showToast({
        type: "error",
        title: "Connection error",
        message: netMsg,
      });
    } finally {
      setCreateLoading(false);
    }
  }
function openEditModal(plan: PlanItem) {
    setEditingPlan(plan);
    setEditName(plan.name);
    setEditDescription(plan.description ?? "");
    setEditMonthlyPrice(plan.monthlyPriceCents !== null ? String(plan.monthlyPriceCents) : "");
    setEditAnnualPrice(plan.annualPriceCents !== null ? String(plan.annualPriceCents) : "");
    setEditCurrency(plan.currency ?? "INR");
    setEditTrialDays(String(plan.trialDays ?? 0));
    setEditMaxUsers(plan.maxUsers !== null ? String(plan.maxUsers) : "");
    setEditBillingInterval(plan.billingInterval ?? "monthly");
    setEditActive(plan.active);
    setEditError("");
  }
function closeEditModal() {
    if (editLoading) return;
    setEditingPlan(null);
    setEditError("");
  }
async function handleEditSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!editingPlan) return;
    setEditError("");

    const trimmedName = editName.trim();
    const nameValidation = planNameSchema(trimmedName);
    if (!nameValidation.success) {
      setEditError(nameValidation.error.issues[0]?.message ?? "Invalid plan name.");
      return;
    }

    setEditLoading(true);

    const payload = {
      code: editingPlan.code, // preserved / immutable
      name: trimmedName,
      description: editDescription.trim() || undefined,
      monthlyPriceCents: editMonthlyPrice === "" ? null : Number(editMonthlyPrice),
      annualPriceCents: editAnnualPrice === "" ? null : Number(editAnnualPrice),
      currency: editCurrency.trim().toUpperCase(),
      trialDays: Number(editTrialDays || 0),
      maxUsers: editMaxUsers === "" ? null : Number(editMaxUsers),
      maxStorageBytes: null,
      billingInterval: editBillingInterval,
      active: editActive,
    };

    try {
      const response = await fetch(`/api/platform/plans/${editingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = body.error?.message ?? "Unable to update plan. Please try again.";
        setEditError(errorMsg);
        showToast({
          type: "error",
          title: "Failed to update plan",
          message: errorMsg,
        });
        setEditLoading(false);
        return;
      }

      const updatedPlan: PlanItem = {
        ...body.plan,
        createdAt: body.plan.createdAt ?? editingPlan.createdAt,
        updatedAt: body.plan.updatedAt ?? new Date().toISOString(),
      };

      setPlans((prev) => prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
      const successTitle = "Plan updated successfully.";
      const successMsg = `Plan \u201c${updatedPlan.name}\u201d (${updatedPlan.code}) has been saved.`;
      setSuccessToast({
        title: successTitle,
        message: successMsg,
      });
      showToast({
        type: "success",
        title: successTitle,
        message: successMsg,
      });
      setEditingPlan(null);
    } catch {
      const netMsg = "Network error. Please check your connection and try again.";
      setEditError(netMsg);
      showToast({
        type: "error",
        title: "Connection error",
        message: netMsg,
      });
    } finally {
      setEditLoading(false);
    }
  }
function openDeleteModal(plan: PlanItem) {
    setDeletingPlan(plan);
    setDeleteError("");
  }
function closeDeleteModal() {
    if (deleteLoading || deactivateLoading) return;
    setDeletingPlan(null);
    setDeleteError("");
  }
async function handleDeleteConfirm() {
    if (!deletingPlan || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/platform/plans/${deletingPlan.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = body.error?.message ?? "Unable to delete plan.";
        setDeleteError(errorMsg);
        showToast({
          type: "error",
          title: "Failed to delete plan",
          message: errorMsg,
        });
        setDeleteLoading(false);
        return;
      }

      const deletedName = deletingPlan.name;
      const deletedCode = deletingPlan.code;
      const deletedId = deletingPlan.id;

      setPlans((prev) => prev.filter((p) => p.id !== deletedId));
      setDeletingPlan(null);
      setDeleteError("");
      const successTitle = "Plan deleted successfully.";
      const successMsg = `Plan \u201c${deletedName}\u201d (${deletedCode}) has been removed.`;
      setSuccessToast({
        title: successTitle,
        message: successMsg,
      });
      showToast({
        type: "success",
        title: successTitle,
        message: successMsg,
      });
    } catch {
      const netMsg = "Network error. Check connection and try again.";
      setDeleteError(netMsg);
      showToast({
        type: "error",
        title: "Connection error",
        message: netMsg,
      });
    } finally {
      setDeleteLoading(false);
    }
  }
async function handleDeactivateInstead() {
    if (!deletingPlan || deactivateLoading) return;
    setDeactivateLoading(true);

    try {
      const response = await fetch(`/api/platform/plans/${deletingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...deletingPlan,
          active: false,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = body.error?.message ?? "Unable to deactivate plan.";
        setDeleteError(errorMsg);
        showToast({
          type: "error",
          title: "Failed to deactivate plan",
          message: errorMsg,
        });
        setDeactivateLoading(false);
        return;
      }

      const updatedPlan: PlanItem = {
        ...body.plan,
        active: false,
      };

      setPlans((prev) => prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
      const name = deletingPlan.name;
      const code = deletingPlan.code;
      setDeletingPlan(null);
      setDeleteError("");
      const successTitle = "Plan deactivated successfully.";
      const successMsg = `Plan \u201c${name}\u201d (${code}) has been set to Inactive.`;
      setSuccessToast({
        title: successTitle,
        message: successMsg,
      });
      showToast({
        type: "success",
        title: successTitle,
        message: successMsg,
      });
    } catch {
      const errMsg = "Failed to deactivate plan. Please try again.";
      setDeleteError(errMsg);
      showToast({
        type: "error",
        title: "Deactivation error",
        message: errMsg,
      });
    } finally {
      setDeactivateLoading(false);
    }
  }
</script>
<div class="space-y-8">
      
      {#if successToast}<div role="status" aria-live="polite" class="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-white p-4 shadow-xl transition-all">
          <div class="grid size-7 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            ✓
          </div>
          <div class="pr-2">
            <p class="font-semibold text-emerald-950">{successToast.title}</p>
            {#if successToast.message}<p class="text-xs text-muted">{successToast.message}</p>{/if}
          </div>
          <button type="button" onclick={() => setSuccessToast(null)} class="ml-2 cursor-pointer text-muted transition-colors hover:text-foreground" aria-label="Dismiss notification">
            ✕
          </button>
        </div>{/if}

      
      <div>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-bold">Configured Plans ({plans.length})</h2>
        </div>

        {#if plans.length === 0}<div class="rounded-2xl border border-dashed p-8 text-center text-muted">
            No plans configured yet. Use the form below to create your first commercial plan.
          </div>{:else}<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            {#each plans as plan}{@const planFeaturesList = features[plan.id] ?? []}<Card class="flex flex-col justify-between overflow-hidden transition-shadow hover:shadow-md">
                  <div>
                    <CardHeader class="border-b bg-surface-muted/30 pb-4">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2.5">
                          <CardTitle class="text-lg font-bold">{plan.name}</CardTitle>
                          <span class="rounded-md border bg-muted/60 px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-foreground">
                            {plan.code}
                          </span>
                        </div>
                        <span class={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            plan.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}>
                          {#if plan.active}{"Active"}{:else}{"Inactive"}{/if}
                        </span>
                      </div>
                      <p class="mt-1 text-xs text-muted">
                        {#if plan.billingInterval === "annual"}{"Annual billing"}{:else}{"Monthly billing"}{/if} · Currency: {plan.currency}
                      </p>
                      {#if plan.description}<p class="mt-2 text-sm text-foreground/80 line-clamp-2">
                          {plan.description}
                        </p>{/if}
                    </CardHeader>

                    <CardContent class="space-y-5 pt-4">
                      
                      <div class="grid grid-cols-2 gap-3 text-sm">
                        <div class="rounded-lg border bg-surface p-2.5">
                          <span class="text-xs text-muted block">Monthly Price</span>
                          <span class="font-semibold text-foreground">
                            {formatMoney(plan.monthlyPriceCents, plan.currency)}
                          </span>
                        </div>

                        <div class="rounded-lg border bg-surface p-2.5">
                          <span class="text-xs text-muted block">Annual Price</span>
                          <span class="font-semibold text-foreground">
                            {formatMoney(plan.annualPriceCents, plan.currency)}
                          </span>
                        </div>

                        <div class="rounded-lg border bg-surface p-2.5">
                          <span class="text-xs text-muted block">Active Employees</span>
                          <span class="font-semibold text-foreground">
                            {#if plan.maxUsers !== null}{`${plan.maxUsers} limit`}{:else}{"Unlimited"}{/if}
                          </span>
                        </div>

                        <div class="rounded-lg border bg-surface p-2.5">
                          <span class="text-xs text-muted block">Trial Period</span>
                          <span class="font-semibold text-foreground">
                            {#if plan.trialDays > 0}{`${plan.trialDays} days`}{:else}{"No trial"}{/if}
                          </span>
                        </div>
                      </div>

                      
                      <div>
                        <div class="mb-2 flex items-center justify-between">
                          <span class="text-xs font-semibold uppercase tracking-wider text-muted">
                            Features & Limits
                          </span>
                          <span class="text-xs text-muted">
                            {planFeaturesList.length} configured
                          </span>
                        </div>

                        {#if planFeaturesList.length > 0}<div class="flex flex-wrap gap-1.5">
                            {#each planFeaturesList as f}<span class={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${
                                  f.enabled
                                    ? "bg-primary/5 text-primary border-primary/20"
                                    : "bg-muted/40 text-muted border-muted"
                                }`}>
                                {f.featureKey}:{" "}
                                {#if f.enabled}{#if f.limitValue === null}{"unlimited"}{:else}{f.limitValue}{/if}{:else}{"disabled"}{/if}
                              </span>{/each}
                          </div>{:else}<p class="text-xs text-muted">No custom feature overrides set.</p>{/if}

                        {#if canEditFeatures}<div class="mt-3 border-t pt-3">
                            <FeatureEditor planId={plan.id} />
                          </div>{/if}
                      </div>
                    </CardContent>
                  </div>

                  
                  {#if canEditPlan}<div class="flex items-center justify-end gap-2 border-t bg-surface-muted/20 px-5 py-3">
                      <Button type="button" variant="secondary" size="sm" onclick={() => openEditModal(plan)}>
                        Edit Plan
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onclick={() => openDeleteModal(plan)}>
                        Delete
                      </Button>
                    </div>{/if}
                </Card>{/each}
          </div>{/if}
      </div>

      
      {#if canEditPlan}<Card class="border-2 border-primary/10 shadow-sm">
          <CardHeader class="border-b bg-surface-muted/20">
            <CardTitle class="text-lg font-bold">Add New Plan</CardTitle>
            <p class="text-xs text-muted">
              Configure a new commercial subscription plan. Plan code must be unique and uppercase.
            </p>
          </CardHeader>
          <CardContent class="pt-5">
            {#if createError}<div role="alert" class="mb-4 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive">
                {createError}
              </div>{/if}

            <form onsubmit={handleCreateSubmit} class="space-y-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                
                <div>
                  <label for="plan-create-code" class="text-sm font-medium text-foreground">
                    Plan Code <span class="text-destructive">*</span>
                  </label>
                  <input id="plan-create-code" name="code" value={createCode} onchange={(e) => {
                      setCreateCode(e.currentTarget.value.toUpperCase().replace(/\s+/g, "_"));
                      if (createError) setCreateError("");
                    }} placeholder="e.g. BUSINESS, STARTER_2027" required class="mt-1 w-full rounded-lg border bg-surface p-2.5 font-mono text-sm tracking-wider uppercase focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                  <p class="mt-1 text-xs text-muted">
                    Uppercase alphanumeric and underscores only (2-40 characters). Immutable once created.
                  </p>
                </div>

                
                <div>
                  <label for="plan-create-name" class="text-sm font-medium text-foreground">
                    Plan Name <span class="text-destructive">*</span>
                  </label>
                  <input id="plan-create-name" name="name" value={createName} onchange={(e) => {
                      setCreateName(e.currentTarget.value);
                      if (createError) setCreateError("");
                    }} placeholder="e.g. Business Growth Tier" required class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                  <p class="mt-1 text-xs text-muted">
                    Human-readable name (2-80 characters, must contain letters).
                  </p>
                </div>

                
                <div class="sm:col-span-2">
                  <label for="plan-create-description" class="text-sm font-medium text-foreground">Description</label>
                  <input id="plan-create-description" name="description" value={createDescription} onchange={(e) => setCreateDescription(e.currentTarget.value)} placeholder="e.g. Designed for growing mid-size businesses with advanced HR workflows." maxlength={240} class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                </div>

                
                <div>
                  <label for="plan-create-monthlyPriceCents" class="text-sm font-medium text-foreground">
                    Monthly Price (minor units)
                  </label>
                  <input id="plan-create-monthlyPriceCents" name="monthlyPriceCents" type="number" min="0" value={createMonthlyPrice} onchange={(e) => setCreateMonthlyPrice(e.currentTarget.value)} placeholder="e.g. 150000 for 1500.00" class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                  <p class="mt-1 text-xs text-muted">
                    {#if createMonthlyPrice}{`≈ ${createCurrency} ${(Number(createMonthlyPrice) / 100).toFixed(2)}`}{:else}{"Leave empty for free tier"}{/if}
                  </p>
                </div>

                
                <div>
                  <label for="plan-create-annualPriceCents" class="text-sm font-medium text-foreground">
                    Annual Price (minor units)
                  </label>
                  <input id="plan-create-annualPriceCents" name="annualPriceCents" type="number" min="0" value={createAnnualPrice} onchange={(e) => setCreateAnnualPrice(e.currentTarget.value)} placeholder="e.g. 1500000 for 15000.00" class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                  <p class="mt-1 text-xs text-muted">
                    {#if createAnnualPrice}{`≈ ${createCurrency} ${(Number(createAnnualPrice) / 100).toFixed(2)}`}{:else}{"Leave empty for free tier"}{/if}
                  </p>
                </div>

                
                <div>
                  <label for="plan-create-currency" class="text-sm font-medium text-foreground">Currency</label>
                  <input id="plan-create-currency" name="currency" value={createCurrency} onchange={(e) => setCreateCurrency(e.currentTarget.value.toUpperCase())} maxlength={3} class="mt-1 w-full rounded-lg border bg-surface p-2.5 font-mono text-sm uppercase focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                </div>

                
                <div>
                  <label for="plan-create-trialDays" class="text-sm font-medium text-foreground">Trial Days</label>
                  <input id="plan-create-trialDays" name="trialDays" type="number" min="0" max="365" value={createTrialDays} onchange={(e) => setCreateTrialDays(e.currentTarget.value)} class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                </div>

                
                <div>
                  <label for="plan-create-maxUsers" class="text-sm font-medium text-foreground">Active Employees Limit</label>
                  <input id="plan-create-maxUsers" name="maxUsers" type="number" min="0" value={createMaxUsers} onchange={(e) => setCreateMaxUsers(e.currentTarget.value)} placeholder="Leave empty for unlimited" class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                </div>

                
                <div>
                  <label for="plan-create-billingInterval" class="text-sm font-medium text-foreground">Billing Interval</label>
                  <select id="plan-create-billingInterval" name="billingInterval" value={createBillingInterval} onchange={(e) => setCreateBillingInterval(e.currentTarget.value)} class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20">
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                
                <div class="flex items-center gap-2 pt-2 sm:col-span-2">
                  <input id="createActive" name="active" type="checkbox" checked={createActive} onchange={(e) => setCreateActive(e.currentTarget.checked)} class="size-4 rounded border-muted text-primary" />
                  <label for="createActive" class="text-sm font-medium text-foreground cursor-pointer">
                    Active (available for tenant selection)
                  </label>
                </div>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="submit" disabled={createLoading}>
                  {#if createLoading}{"Creating plan…"}{:else}{"Create Plan"}{/if}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>{/if}

      
      <DialogFrame open={Boolean(editingPlan)} onOpenChange={(open) => {
          if (!open && !editLoading) closeEditModal();
        }}>
        
          
          <div class="fixed top-1/2 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-xl border bg-surface p-6 shadow-2xl focus:outline-hidden">
            <h2 class="text-lg font-bold text-foreground">
              Edit Plan: {editingPlan?.name}
            </h2>
            <p class="mt-1 text-xs text-muted">
              Update pricing, capacity limits, and status. Plan code is immutable to preserve tenant integrity.
            </p>

            {#if editError}<div role="alert" class="mt-4 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive">
                {editError}
              </div>{/if}

            {#if editingPlan}<form onsubmit={handleEditSubmit} class="mt-4 space-y-4">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  
                  <div>
                    <span class="text-sm font-medium text-muted">
                      Plan Code (Immutable)
                    </span>
                    <div class="mt-1 flex items-center justify-between rounded-lg border bg-surface-muted/40 p-2.5 font-mono text-sm tracking-wider text-muted">
                      <span>{editingPlan.code}</span>
                      <span class="text-xs text-muted font-sans">Locked</span>
                    </div>
                  </div>

                  
                  <div>
                    <label for="plan-edit-name" class="text-sm font-medium text-foreground">
                      Plan Name <span class="text-destructive">*</span>
                    </label>
                    <input id="plan-edit-name" name="name" value={editName} onchange={(e) => {
                        setEditName(e.currentTarget.value);
                        if (editError) setEditError("");
                      }} required class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                  </div>

                  
                  <div class="sm:col-span-2">
                    <label for="plan-edit-description" class="text-sm font-medium text-foreground">Description</label>
                    <input id="plan-edit-description" name="description" value={editDescription} onchange={(e) => setEditDescription(e.currentTarget.value)} maxlength={240} class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                  </div>

                  
                  <div>
                    <label for="plan-edit-monthlyPriceCents" class="text-sm font-medium text-foreground">
                      Monthly Price (minor units)
                    </label>
                    <input id="plan-edit-monthlyPriceCents" name="monthlyPriceCents" type="number" min="0" value={editMonthlyPrice} onchange={(e) => setEditMonthlyPrice(e.currentTarget.value)} class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                    <p class="mt-1 text-xs text-muted">
                      {#if editMonthlyPrice}{`≈ ${editCurrency} ${(Number(editMonthlyPrice) / 100).toFixed(2)}`}{:else}{"Leave empty for free"}{/if}
                    </p>
                  </div>

                  
                  <div>
                    <label for="plan-edit-annualPriceCents" class="text-sm font-medium text-foreground">
                      Annual Price (minor units)
                    </label>
                    <input id="plan-edit-annualPriceCents" name="annualPriceCents" type="number" min="0" value={editAnnualPrice} onchange={(e) => setEditAnnualPrice(e.currentTarget.value)} class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                    <p class="mt-1 text-xs text-muted">
                      {#if editAnnualPrice}{`≈ ${editCurrency} ${(Number(editAnnualPrice) / 100).toFixed(2)}`}{:else}{"Leave empty for free"}{/if}
                    </p>
                  </div>

                  
                  <div>
                    <label for="plan-edit-currency" class="text-sm font-medium text-foreground">Currency</label>
                    <input id="plan-edit-currency" name="currency" value={editCurrency} onchange={(e) => setEditCurrency(e.currentTarget.value.toUpperCase())} maxlength={3} class="mt-1 w-full rounded-lg border bg-surface p-2.5 font-mono text-sm uppercase focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                  </div>

                  
                  <div>
                    <label for="plan-edit-trialDays" class="text-sm font-medium text-foreground">Trial Days</label>
                    <input id="plan-edit-trialDays" name="trialDays" type="number" min="0" max="365" value={editTrialDays} onchange={(e) => setEditTrialDays(e.currentTarget.value)} class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                  </div>

                  
                  <div>
                    <label for="plan-edit-maxUsers" class="text-sm font-medium text-foreground">Active Employees Limit</label>
                    <input id="plan-edit-maxUsers" name="maxUsers" type="number" min="0" value={editMaxUsers} onchange={(e) => setEditMaxUsers(e.currentTarget.value)} placeholder="Leave empty for unlimited" class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20" />
                  </div>

                  
                  <div>
                    <label for="plan-edit-billingInterval" class="text-sm font-medium text-foreground">Billing Interval</label>
                    <select id="plan-edit-billingInterval" name="billingInterval" value={editBillingInterval} onchange={(e) => setEditBillingInterval(e.currentTarget.value)} class="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20">
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>

                  
                  <div class="flex items-center gap-2 pt-2 sm:col-span-2">
                    <input id="editActive" name="active" type="checkbox" checked={editActive} onchange={(e) => setEditActive(e.currentTarget.checked)} class="size-4 rounded border-muted text-primary" />
                    <label for="editActive" class="text-sm font-medium text-foreground cursor-pointer">
                      Active (available for tenant selection)
                    </label>
                  </div>
                </div>

                <div class="mt-6 flex items-center justify-end gap-3 border-t pt-4">
                  <Button type="button" variant="secondary" disabled={editLoading} onclick={closeEditModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editLoading}>
                    {#if editLoading}{"Saving…"}{:else}{"Save Changes"}{/if}
                  </Button>
                </div>
              </form>{/if}
          </div>
        
      </DialogFrame>

      
      <DialogFrame open={Boolean(deletingPlan)} onOpenChange={(open) => {
          if (!open && !deleteLoading && !deactivateLoading) closeDeleteModal();
        }}>
        
          
          <div class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-surface p-6 shadow-2xl focus:outline-hidden">
            <h2 class="text-lg font-bold text-foreground">
              Delete Plan?
            </h2>
            <p class="mt-2 text-sm text-muted">
              You are about to delete plan &ldquo;{deletingPlan?.name}&rdquo; ({deletingPlan?.code}). This action cannot be undone.
            </p>

            {#if deleteError}<div role="alert" class="mt-4 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive">
                <p class="font-semibold mb-1">Cannot delete plan</p>
                <p>{deleteError}</p>
                {#if deleteError.includes("assigned to one or more active subscriptions")}<div class="mt-3">
                    <Button type="button" variant="secondary" size="sm" disabled={deactivateLoading} onclick={handleDeactivateInstead} class="w-full">
                      {#if deactivateLoading}{"Deactivating…"}{:else}{"Deactivate Plan Instead"}{/if}
                    </Button>
                  </div>{/if}
              </div>{/if}

            <div class="mt-6 flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" disabled={deleteLoading || deactivateLoading} onclick={closeDeleteModal}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={deleteLoading || deactivateLoading} onclick={handleDeleteConfirm}>
                {#if deleteLoading}{"Deleting…"}{:else}{"Delete"}{/if}
              </Button>
            </div>
          </div>
        
      </DialogFrame>
    </div>
