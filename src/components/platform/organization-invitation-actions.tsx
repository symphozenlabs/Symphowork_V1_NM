"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
export function OrganizationInvitationActions({ organizationId, invitation }: { organizationId: string; invitation?: { id: string; status: string; expiresAt: string } | null }) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const expired = invitation?.status === "pending" && new Date(invitation.expiresAt).getTime() <= Date.now();

  if (!invitation || invitation.status !== "pending") return <p className="text-sm text-muted">{invitation?.status === "accepted" ? "Primary admin invitation accepted." : "No pending primary admin invitation. Process or retry provisioning first."}</p>;

  async function copyLink() {
    setBusy(true);
    const response = await fetch(`/api/platform/organizations/${organizationId}/invitation/link`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || typeof body.invitationUrl !== "string") setMessage(body.error?.message ?? "Unable to create an invitation link.");
    else {
      try {
        await navigator.clipboard.writeText(body.invitationUrl);
        setMessage("Invitation link copied.");
      } catch {
        setMessage("The link was created, but could not be copied. Check browser clipboard permissions and try again.");
      }
    }
    setBusy(false);
  }

  async function resend() {
    setBusy(true);
    const response = await fetch(`/api/platform/organizations/${organizationId}/invitation/resend`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? (body.invitation?.delivery === "not_configured" ? "Invitation renewed. Email delivery is not configured—copy the invitation link to share it manually." : "Invitation email sent.") : body.error?.message ?? "Unable to resend invitation.");
    setBusy(false);
    if (response.ok) router.refresh();
  }

  return <div className="space-y-3"><p className="text-sm text-muted">{expired ? "Invitation expired — resend to generate a new link." : "Email delivery is not configured. Copy this secure invitation link and send it to the primary admin manually."}</p><div className="flex flex-wrap gap-2">{!expired && <Button size="sm" disabled={busy} onClick={() => void copyLink()}>{busy ? "Preparing…" : "Copy invitation link"}</Button>}<Button variant="secondary" size="sm" disabled={busy} onClick={() => void resend()}>{busy ? "Sending…" : "Resend invitation"}</Button></div>{message && <p role="status" className="text-xs text-muted">{message}</p>}</div>;
}
