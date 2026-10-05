"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureEditor } from "@/components/platform/feature-editor";
import { planCodeSchema, planNameSchema } from "@/modules/platform/validation";

export interface PlanItem {
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

export interface PlanFeatureItem {
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

export function PlanManagement({
  initialPlans,
  initialFeatures,
  canEditPlan,
  canEditFeatures,
}: PlanManagementProps) {
  const [plans, setPlans] = useState<PlanItem[]>(initialPlans);
  const [features, setFeatures] = useState<Record<string, PlanFeatureItem[]>>(initialFeatures);

  // Success toast state
  const [successToast, setSuccessToast] = useState<{ title: string; message?: string } | null>(null);

  // Create form state
  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createMonthlyPrice, setCreateMonthlyPrice] = useState("");
  const [createAnnualPrice, setCreateAnnualPrice] = useState("");
  const [createCurrency, setCreateCurrency] = useState("INR");
  const [createTrialDays, setCreateTrialDays] = useState("0");
  const [createMaxUsers, setCreateMaxUsers] = useState("");
  const [createBillingInterval, setCreateBillingInterval] = useState("monthly");
  const [createActive, setCreateActive] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit modal state
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMonthlyPrice, setEditMonthlyPrice] = useState("");
  const [editAnnualPrice, setEditAnnualPrice] = useState("");
  const [editCurrency, setEditCurrency] = useState("INR");
  const [editTrialDays, setEditTrialDays] = useState("0");
  const [editMaxUsers, setEditMaxUsers] = useState("");
  const [editBillingInterval, setEditBillingInterval] = useState("monthly");
  const [editActive, setEditActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete modal state
  const [deletingPlan, setDeletingPlan] = useState<PlanItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Auto-dismiss success toast
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => setSuccessToast(null), 5000);
    return () => clearTimeout(timer);
  }, [successToast]);

  // Sync initial props
  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  useEffect(() => {
    setFeatures(initialFeatures);
  }, [initialFeatures]);

  // Helper formatters
  function formatMoney(amountCents: number | null, currency: string) {
    if (amountCents === null) return "—";
    const amount = (amountCents / 100).toFixed(2);
    return `${currency} ${amount}`;
  }

  // Create submission
  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");

    const trimmedCode = createCode.trim().toUpperCase();
    const trimmedName = createName.trim();

    // Client-side validations
    const codeValidation = planCodeSchema.safeParse(trimmedCode);
    if (!codeValidation.success) {
      setCreateError(codeValidation.error.issues[0]?.message ?? "Invalid plan code.");
      return;
    }

    const nameValidation = planNameSchema.safeParse(trimmedName);
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
        setCreateError(body.error?.message ?? "Unable to create plan. Please try again.");
        setCreateLoading(false);
        return;
      }

      const newPlan: PlanItem = {
        ...body.plan,
        createdAt: body.plan.createdAt ?? new Date().toISOString(),
        updatedAt: body.plan.updatedAt ?? new Date().toISOString(),
      };

      setPlans((prev) => [newPlan, ...prev]);
      setSuccessToast({
        title: "Plan created successfully.",
        message: `Plan \u201c${newPlan.name}\u201d (${newPlan.code}) is now available.`,
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
      setCreateError("Network error. Please check your connection and try again.");
    } finally {
      setCreateLoading(false);
    }
  }

  // Open Edit Modal
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

  // Submit Edit
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlan) return;
    setEditError("");

    const trimmedName = editName.trim();
    const nameValidation = planNameSchema.safeParse(trimmedName);
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
        setEditError(body.error?.message ?? "Unable to update plan. Please try again.");
        setEditLoading(false);
        return;
      }

      const updatedPlan: PlanItem = {
        ...body.plan,
        createdAt: body.plan.createdAt ?? editingPlan.createdAt,
        updatedAt: body.plan.updatedAt ?? new Date().toISOString(),
      };

      setPlans((prev) => prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
      setSuccessToast({
        title: "Plan updated successfully.",
        message: `Plan \u201c${updatedPlan.name}\u201d (${updatedPlan.code}) has been saved.`,
      });
      setEditingPlan(null);
    } catch {
      setEditError("Network error. Please check your connection and try again.");
    } finally {
      setEditLoading(false);
    }
  }

  // Open Delete Modal
  function openDeleteModal(plan: PlanItem) {
    setDeletingPlan(plan);
    setDeleteError("");
  }

  function closeDeleteModal() {
    if (deleteLoading || deactivateLoading) return;
    setDeletingPlan(null);
    setDeleteError("");
  }

  // Confirm Delete
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
        setDeleteError(body.error?.message ?? "Unable to delete plan.");
        setDeleteLoading(false);
        return;
      }

      const deletedName = deletingPlan.name;
      const deletedCode = deletingPlan.code;
      const deletedId = deletingPlan.id;

      setPlans((prev) => prev.filter((p) => p.id !== deletedId));
      setDeletingPlan(null);
      setDeleteError("");
      setSuccessToast({
        title: "Plan deleted successfully.",
        message: `Plan \u201c${deletedName}\u201d (${deletedCode}) has been removed.`,
      });
    } catch {
      setDeleteError("Network error. Check connection and try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  // Deactivate plan instead (if delete blocked due to active subscriptions)
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
        setDeleteError(body.error?.message ?? "Unable to deactivate plan.");
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
      setSuccessToast({
        title: "Plan deactivated successfully.",
        message: `Plan \u201c${name}\u201d (${code}) has been set to Inactive.`,
      });
    } catch {
      setDeleteError("Failed to deactivate plan. Please try again.");
    } finally {
      setDeactivateLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top-Right Success Notification Toast */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-white p-4 shadow-xl transition-all"
        >
          <div className="grid size-7 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            ✓
          </div>
          <div className="pr-2">
            <p className="font-semibold text-emerald-950">{successToast.title}</p>
            {successToast.message && (
              <p className="text-xs text-muted">{successToast.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="ml-2 cursor-pointer text-muted transition-colors hover:text-foreground"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Plans Grid Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Configured Plans ({plans.length})</h2>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted">
            No plans configured yet. Use the form below to create your first commercial plan.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {plans.map((plan) => {
              const planFeaturesList = features[plan.id] ?? [];

              return (
                <Card key={plan.id} className="flex flex-col justify-between overflow-hidden transition-shadow hover:shadow-md">
                  <div>
                    <CardHeader className="border-b bg-surface-muted/30 pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                          <span className="rounded-md border bg-muted/60 px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-foreground">
                            {plan.code}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            plan.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          {plan.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {plan.billingInterval === "annual" ? "Annual billing" : "Monthly billing"} · Currency: {plan.currency}
                      </p>
                      {plan.description && (
                        <p className="mt-2 text-sm text-foreground/80 line-clamp-2">
                          {plan.description}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-5 pt-4">
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border bg-surface p-2.5">
                          <span className="text-xs text-muted block">Monthly Price</span>
                          <span className="font-semibold text-foreground">
                            {formatMoney(plan.monthlyPriceCents, plan.currency)}
                          </span>
                        </div>

                        <div className="rounded-lg border bg-surface p-2.5">
                          <span className="text-xs text-muted block">Annual Price</span>
                          <span className="font-semibold text-foreground">
                            {formatMoney(plan.annualPriceCents, plan.currency)}
                          </span>
                        </div>

                        <div className="rounded-lg border bg-surface p-2.5">
                          <span className="text-xs text-muted block">Active Employees</span>
                          <span className="font-semibold text-foreground">
                            {plan.maxUsers !== null ? `${plan.maxUsers} limit` : "Unlimited"}
                          </span>
                        </div>

                        <div className="rounded-lg border bg-surface p-2.5">
                          <span className="text-xs text-muted block">Trial Period</span>
                          <span className="font-semibold text-foreground">
                            {plan.trialDays > 0 ? `${plan.trialDays} days` : "No trial"}
                          </span>
                        </div>
                      </div>

                      {/* Features Entitlements */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                            Features & Limits
                          </span>
                          <span className="text-xs text-muted">
                            {planFeaturesList.length} configured
                          </span>
                        </div>

                        {planFeaturesList.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {planFeaturesList.map((f) => (
                              <span
                                key={f.id}
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${
                                  f.enabled
                                    ? "bg-primary/5 text-primary border-primary/20"
                                    : "bg-muted/40 text-muted border-muted"
                                }`}
                              >
                                {f.featureKey}:{" "}
                                {f.enabled
                                  ? f.limitValue === null
                                    ? "unlimited"
                                    : f.limitValue
                                  : "disabled"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted">No custom feature overrides set.</p>
                        )}

                        {canEditFeatures && (
                          <div className="mt-3 border-t pt-3">
                            <FeatureEditor planId={plan.id} />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>

                  {/* Card Actions Footer */}
                  {canEditPlan && (
                    <div className="flex items-center justify-end gap-2 border-t bg-surface-muted/20 px-5 py-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(plan)}
                      >
                        Edit Plan
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteModal(plan)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Plan Form Card */}
      {canEditPlan && (
        <Card className="border-2 border-primary/10 shadow-sm">
          <CardHeader className="border-b bg-surface-muted/20">
            <CardTitle className="text-lg font-bold">Add New Plan</CardTitle>
            <p className="text-xs text-muted">
              Configure a new commercial subscription plan. Plan code must be unique and uppercase.
            </p>
          </CardHeader>
          <CardContent className="pt-5">
            {createError && (
              <div
                role="alert"
                className="mb-4 rounded-lg bg-[#fff1f1] p-3 text-sm text-destructive"
              >
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Code Field */}
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Plan Code <span className="text-destructive">*</span>
                  </label>
                  <input
                    name="code"
                    value={createCode}
                    onChange={(e) => {
                      setCreateCode(e.target.value.toUpperCase().replace(/\s+/g, "_"));
                      if (createError) setCreateError("");
                    }}
                    placeholder="e.g. BUSINESS, STARTER_2027"
                    required
                    className="mt-1 w-full rounded-lg border bg-surface p-2.5 font-mono text-sm tracking-wider uppercase focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1 text-xs text-muted">
                    Uppercase alphanumeric and underscores only (2-40 characters). Immutable once created.
                  </p>
                </div>

                {/* Name Field */}
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Plan Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    name="name"
                    value={createName}
                    onChange={(e) => {
                      setCreateName(e.target.value);
                      if (createError) setCreateError("");
                    }}
                    placeholder="e.g. Business Growth Tier"
                    required
                    className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1 text-xs text-muted">
                    Human-readable name (2-80 characters, must contain letters).
                  </p>
                </div>

                {/* Description Field */}
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <input
                    name="description"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="e.g. Designed for growing mid-size businesses with advanced HR workflows."
                    maxLength={240}
                    className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Monthly Price Field */}
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Monthly Price (minor units)
                  </label>
                  <input
                    name="monthlyPriceCents"
                    type="number"
                    min="0"
                    value={createMonthlyPrice}
                    onChange={(e) => setCreateMonthlyPrice(e.target.value)}
                    placeholder="e.g. 150000 for 1500.00"
                    className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1 text-xs text-muted">
                    {createMonthlyPrice
                      ? `≈ ${createCurrency} ${(Number(createMonthlyPrice) / 100).toFixed(2)}`
                      : "Leave empty for free tier"}
                  </p>
                </div>

                {/* Annual Price Field */}
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Annual Price (minor units)
                  </label>
                  <input
                    name="annualPriceCents"
                    type="number"
                    min="0"
                    value={createAnnualPrice}
                    onChange={(e) => setCreateAnnualPrice(e.target.value)}
                    placeholder="e.g. 1500000 for 15000.00"
                    className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1 text-xs text-muted">
                    {createAnnualPrice
                      ? `≈ ${createCurrency} ${(Number(createAnnualPrice) / 100).toFixed(2)}`
                      : "Leave empty for free tier"}
                  </p>
                </div>

                {/* Currency Field */}
                <div>
                  <label className="text-sm font-medium text-foreground">Currency</label>
                  <input
                    name="currency"
                    value={createCurrency}
                    onChange={(e) => setCreateCurrency(e.target.value.toUpperCase())}
                    maxLength={3}
                    className="mt-1 w-full rounded-lg border bg-surface p-2.5 font-mono text-sm uppercase focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Trial Days Field */}
                <div>
                  <label className="text-sm font-medium text-foreground">Trial Days</label>
                  <input
                    name="trialDays"
                    type="number"
                    min="0"
                    max="365"
                    value={createTrialDays}
                    onChange={(e) => setCreateTrialDays(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Active Employees Limit Field */}
                <div>
                  <label className="text-sm font-medium text-foreground">Active Employees Limit</label>
                  <input
                    name="maxUsers"
                    type="number"
                    min="0"
                    value={createMaxUsers}
                    onChange={(e) => setCreateMaxUsers(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Billing Interval Field */}
                <div>
                  <label className="text-sm font-medium text-foreground">Billing Interval</label>
                  <select
                    name="billingInterval"
                    value={createBillingInterval}
                    onChange={(e) => setCreateBillingInterval(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-2 sm:col-span-2">
                  <input
                    id="createActive"
                    name="active"
                    type="checkbox"
                    checked={createActive}
                    onChange={(e) => setCreateActive(e.target.checked)}
                    className="size-4 rounded border-muted text-primary"
                  />
                  <label htmlFor="createActive" className="text-sm font-medium text-foreground cursor-pointer">
                    Active (available for tenant selection)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? "Creating plan…" : "Create Plan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Plan Modal */}
      <Dialog.Root
        open={Boolean(editingPlan)}
        onOpenChange={(open) => {
          if (!open && !editLoading) closeEditModal();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-xl border bg-surface p-6 shadow-2xl focus:outline-hidden">
            <Dialog.Title className="text-lg font-bold text-foreground">
              Edit Plan: {editingPlan?.name}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-xs text-muted">
              Update pricing, capacity limits, and status. Plan code is immutable to preserve tenant integrity.
            </Dialog.Description>

            {editError && (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-[#fff1f1] p-3 text-sm text-destructive"
              >
                {editError}
              </div>
            )}

            {editingPlan && (
              <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Immutable Code Indicator */}
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Plan Code (Immutable)
                    </label>
                    <div className="mt-1 flex items-center justify-between rounded-lg border bg-surface-muted/40 p-2.5 font-mono text-sm tracking-wider text-muted">
                      <span>{editingPlan.code}</span>
                      <span className="text-xs text-muted font-sans">Locked</span>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Plan Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      name="name"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        if (editError) setEditError("");
                      }}
                      required
                      className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <input
                      name="description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      maxLength={240}
                      className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Monthly Price */}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Monthly Price (minor units)
                    </label>
                    <input
                      name="monthlyPriceCents"
                      type="number"
                      min="0"
                      value={editMonthlyPrice}
                      onChange={(e) => setEditMonthlyPrice(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="mt-1 text-xs text-muted">
                      {editMonthlyPrice
                        ? `≈ ${editCurrency} ${(Number(editMonthlyPrice) / 100).toFixed(2)}`
                        : "Leave empty for free"}
                    </p>
                  </div>

                  {/* Annual Price */}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Annual Price (minor units)
                    </label>
                    <input
                      name="annualPriceCents"
                      type="number"
                      min="0"
                      value={editAnnualPrice}
                      onChange={(e) => setEditAnnualPrice(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="mt-1 text-xs text-muted">
                      {editAnnualPrice
                        ? `≈ ${editCurrency} ${(Number(editAnnualPrice) / 100).toFixed(2)}`
                        : "Leave empty for free"}
                    </p>
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Currency</label>
                    <input
                      name="currency"
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value.toUpperCase())}
                      maxLength={3}
                      className="mt-1 w-full rounded-lg border bg-surface p-2.5 font-mono text-sm uppercase focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Trial Days */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Trial Days</label>
                    <input
                      name="trialDays"
                      type="number"
                      min="0"
                      max="365"
                      value={editTrialDays}
                      onChange={(e) => setEditTrialDays(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Active Employees Limit */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Active Employees Limit</label>
                    <input
                      name="maxUsers"
                      type="number"
                      min="0"
                      value={editMaxUsers}
                      onChange={(e) => setEditMaxUsers(e.target.value)}
                      placeholder="Leave empty for unlimited"
                      className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Billing Interval */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Billing Interval</label>
                    <select
                      name="billingInterval"
                      value={editBillingInterval}
                      onChange={(e) => setEditBillingInterval(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-surface p-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>

                  {/* Active */}
                  <div className="flex items-center gap-2 pt-2 sm:col-span-2">
                    <input
                      id="editActive"
                      name="active"
                      type="checkbox"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                      className="size-4 rounded border-muted text-primary"
                    />
                    <label htmlFor="editActive" className="text-sm font-medium text-foreground cursor-pointer">
                      Active (available for tenant selection)
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={editLoading}
                    onClick={closeEditModal}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editLoading}>
                    {editLoading ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Modal */}
      <Dialog.Root
        open={Boolean(deletingPlan)}
        onOpenChange={(open) => {
          if (!open && !deleteLoading && !deactivateLoading) closeDeleteModal();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-surface p-6 shadow-2xl focus:outline-hidden">
            <Dialog.Title className="text-lg font-bold text-foreground">
              Delete Plan?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted">
              You are about to delete plan &ldquo;{deletingPlan?.name}&rdquo; ({deletingPlan?.code}). This action cannot be undone.
            </Dialog.Description>

            {deleteError && (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-[#fff1f1] p-3 text-sm text-destructive"
              >
                <p className="font-semibold mb-1">Cannot delete plan</p>
                <p>{deleteError}</p>
                {deleteError.includes("assigned to one or more active subscriptions") && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={deactivateLoading}
                      onClick={handleDeactivateInstead}
                      className="w-full"
                    >
                      {deactivateLoading ? "Deactivating…" : "Deactivate Plan Instead"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={deleteLoading || deactivateLoading}
                onClick={closeDeleteModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteLoading || deactivateLoading}
                onClick={handleDeleteConfirm}
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
