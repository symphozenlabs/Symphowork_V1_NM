"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OrganizationInvitationActions({
  organizationId,
  invitation,
}: {
  organizationId: string;
  invitation?: { id: string; status: string; expiresAt: string } | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const expired =
    invitation?.status === "pending" &&
    new Date(invitation.expiresAt).getTime() <= Date.now();

  useEffect(() => {
    if (!modalOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  useEffect(() => {
    if (modalOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [modalOpen]);

  if (!invitation || invitation.status !== "pending") {
    return (
      <p className="text-sm text-muted">
        {invitation?.status === "accepted"
          ? "Primary admin invitation accepted."
          : "No pending primary admin invitation. Process or retry provisioning first."}
      </p>
    );
  }

  async function copyLink() {
    setBusy(true);
    setMessage(undefined);
    try {
      const response = await fetch(
        `/api/platform/organizations/${organizationId}/invitation/link`,
        { method: "POST" }
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || typeof body.invitationUrl !== "string") {
        setMessage(body.error?.message ?? "Unable to create an invitation link.");
        return;
      }

      const url = body.invitationUrl;
      setInvitationUrl(url);
      setModalOpen(true);

      // Attempt automatic clipboard copy
      try {
        await navigator.clipboard.writeText(url);
        setCopyStatus("copied");
      } catch {
        // Browser rejected clipboard write (e.g. transient activation expired during fetch)
        setCopyStatus("error");
      }
    } catch {
      setMessage("Network error occurred while creating an invitation link.");
    } finally {
      setBusy(false);
    }
  }

  async function copyFromModal() {
    if (!invitationUrl) return;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopyStatus("copied");
    } catch {
      if (inputRef.current) {
        inputRef.current.select();
        try {
          const ok = document.execCommand("copy");
          if (ok) {
            setCopyStatus("copied");
            return;
          }
        } catch {
          // ignore execCommand failure
        }
      }
      setCopyStatus("error");
    }
  }

  async function resend() {
    setBusy(true);
    const response = await fetch(
      `/api/platform/organizations/${organizationId}/invitation/resend`,
      { method: "POST" }
    );
    const body = await response.json().catch(() => ({}));
    setMessage(
      response.ok
        ? body.invitation?.delivery === "not_configured"
          ? "Invitation renewed. Email delivery is not configured—copy the invitation link to share it manually."
          : "Invitation email sent."
        : body.error?.message ?? "Unable to resend invitation."
    );
    setBusy(false);
    if (response.ok) router.refresh();
  }

  return (
    <>
      <div className="space-y-3">
        <p className="text-sm text-muted">
          {expired
            ? "Invitation expired — resend to generate a new link."
            : "Email delivery is not configured. Copy this secure invitation link and send it to the primary admin manually."}
        </p>

        <div className="flex flex-wrap gap-2">
          {!expired && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void copyLink()}
            >
              {busy ? "Preparing…" : "Copy invitation link"}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => void resend()}
          >
            {busy ? "Sending…" : "Resend invitation"}
          </Button>
        </div>

        {message && (
          <p role="status" className="text-xs text-muted">
            {message}
          </p>
        )}
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invitation-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="invitation-dialog-title"
                  className="text-lg font-bold text-foreground"
                >
                  Admin invitation link
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Share this secure invitation link with the primary administrator to complete workspace onboarding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="admin-invitation-url-input"
                className="block text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Invitation URL
              </label>
              <input
                id="admin-invitation-url-input"
                ref={inputRef}
                type="text"
                readOnly
                value={invitationUrl}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="h-10 w-full rounded-lg border border-border bg-slate-50 px-3 font-mono text-xs shadow-sm cursor-pointer select-all focus:border-primary focus:outline-none"
              />
            </div>

            {copyStatus === "copied" && (
              <p
                role="status"
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5"
              >
                <span>✓</span> Copied to clipboard!
              </p>
            )}

            {copyStatus === "error" && (
              <p
                role="alert"
                className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5"
              >
                Automatic clipboard copy could not be completed. Click &quot;Copy link&quot; below or select and copy the URL manually.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void copyFromModal()}
              >
                {copyStatus === "copied" ? "Copied" : "Copy link"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
