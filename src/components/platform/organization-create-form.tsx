"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function OrganizationCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    legalName: "",
    slug: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    contactEmail: "",
  });
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setCreated("");
    setLoading(true);

    try {
      const response = await fetch("/api/platform/organizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: form.slug.trim().toLowerCase(),
          contactEmail: form.contactEmail.trim().toLowerCase(),
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errMsg = body.error?.message ?? "Unable to create organization. Please try again.";
        setError(errMsg);
        showToast({ type: "error", title: "Creation failed", message: errMsg });
        setLoading(false);
      } else {
        const org = body.organization;
        const orgName = org?.name || form.name;
        setCreated(orgName);
        showToast({
          type: "success",
          title: "Organization created",
          message: `${orgName} has been provisioned successfully.`,
        });
        setTimeout(() => {
          router.push("/platform/organizations");
        }, 800);
      }
    } catch {
      const connMsg = "The organization could not be created. Check your connection and try again.";
      setError(connMsg);
      showToast({ type: "error", title: "Connection error", message: connMsg });
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" aria-busy={loading}>
      {[
        ["name", "Organization name"],
        ["legalName", "Legal name"],
        ["slug", "Slug"],
        ["contactEmail", "Primary admin email"],
        ["timezone", "Timezone"],
        ["currency", "Currency"],
      ].map(([key, label]) => (
        <label key={key} className="block text-sm font-semibold">
          {label}
          {key === "contactEmail" && (
            <span className="ml-1 text-xs font-normal text-muted">
              (used for the organization invitation)
            </span>
          )}
          <Input
            required
            disabled={loading || Boolean(created)}
            type={key === "contactEmail" ? "email" : "text"}
            value={form[key as keyof typeof form]}
            onChange={(event) =>
              setForm({ ...form, [key]: event.target.value })
            }
            className="mt-2"
          />
        </label>
      ))}

      {error && (
        <p role="alert" className="rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {created && (
        <>
          <div
            role="status"
            aria-live="polite"
            className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-white p-4 shadow-xl transition-all"
          >
            <div className="grid size-7 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              ✓
            </div>
            <div>
              <p className="font-semibold text-emerald-950">Organization created successfully.</p>
              <p className="text-xs text-muted">&ldquo;{created}&rdquo; is pending approval. Redirecting&hellip;</p>
            </div>
          </div>
          <p role="status" className="rounded-lg border border-emerald-200 bg-success-bg p-3 text-sm text-emerald-800">
            Organization &ldquo;{created}&rdquo; created successfully. Redirecting to organizations list&hellip;
          </p>
        </>
      )}

      <Button type="submit" disabled={loading || Boolean(created)}>
        {loading
          ? created
            ? "Redirecting…"
            : "Creating organization…"
          : "Create pending organization"}
      </Button>
    </form>
  );
}
