"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProvisioningJob = {
  status: string;
  currentStep: string;
  failureMessage: string | null;
};

export function ProvisioningJobActions({ organizationId, organizationName, contactEmail, job }: { organizationId: string; organizationName: string; contactEmail: string | null; job: ProvisioningJob }) {
  const router = useRouter();
  const [email, setEmail] = useState(contactEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const actionable = job.status === "pending" || job.status === "failed" || job.status === "retrying";

  async function process() {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter the primary administrator email before processing this organization.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/platform/provisioning/${organizationId}/retry`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ primaryAdminEmail: email.trim().toLowerCase() }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error?.message ?? "Provisioning could not be completed.");
      setMessage(body.invitation?.delivery === "not_configured" ? "Provisioning completed. Email delivery is not configured; copy-free invitation delivery will require email configuration." : "Provisioning completed and the primary admin invitation was prepared.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Provisioning could not be completed.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-2 text-xs"><Link href={`/platform/organizations/${organizationId}`} className="font-semibold hover:text-primary">{organizationName}</Link>{actionable && <div className="flex flex-wrap items-end gap-2"><label className="min-w-64 flex-1 font-medium text-muted">Primary admin email{!contactEmail && <span className="ml-1 text-warning">required</span>}<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} placeholder="admin@company.com" className="mt-1 h-9 text-sm" /></label><Button size="sm" onClick={() => void process()} disabled={busy}>{busy ? "Processing…" : job.status === "failed" || job.status === "retrying" ? "Retry" : "Process"}</Button></div>}{job.status === "running" && <p className="text-muted">Provisioning is currently running.</p>}{job.status === "completed" && <Link href={`/platform/organizations/${organizationId}`} className="text-primary hover:underline">View organization</Link>}{job.failureMessage && <p className="text-danger">{job.failureMessage}</p>}{error && <p role="alert" className="text-danger">{error}</p>}{message && <p role="status" className="text-success">{message}</p>}</div>;
}
