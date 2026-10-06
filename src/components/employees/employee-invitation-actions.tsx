"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function EmployeeInvitationActions({
  employeeId,
  email,
  status,
}: {
  employeeId: string;
  email?: string | null;
  status: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

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

  async function invite(resend = false) {
    if (busy) return;
    setBusy(true);
    setMessage(undefined);

    try {
      const response = await fetch(`/api/app/employees/${employeeId}/invite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, resend }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(body.error?.message ?? "Unable to send invitation.");
        return;
      }

      if (body.invitation?.delivery === "not_configured" && typeof body.invitationUrl === "string") {
        setInvitationUrl(body.invitationUrl);
        setModalOpen(true);
        try {
          await navigator.clipboard.writeText(body.invitationUrl);
          setCopyStatus("copied");
        } catch {
          setCopyStatus("error");
        }
        setMessage(
          "Invitation created, but email delivery is not configured—copy the invitation link to share it manually."
        );
      } else {
        setMessage(
          body.invitation?.delivery === "not_configured"
            ? "Invitation created, but email delivery is not configured."
            : "Invitation email sent."
        );
      }

      router.refresh();
    } catch {
      setMessage("Network error occurred while sending invitation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-2">
        {status === "active" ? (
          <span className="text-sm text-muted">Account active</span>
        ) : (
          <Button
            size="sm"
            disabled={busy || !email}
            onClick={() => void invite(status === "invited")}
          >
            {busy ? "Sending…" : status === "invited" ? "Resend invitation" : "Invite employee"}
          </Button>
        )}
        {!email && <p className="text-xs text-muted">Add an employee email before inviting.</p>}
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
          aria-labelledby="employee-invitation-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="employee-invitation-dialog-title"
                  className="text-lg font-bold text-foreground"
                >
                  Employee invitation link
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Share this secure invitation link with the employee to complete onboarding.
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
                htmlFor="employee-invitation-url-input"
                className="block text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Invitation URL
              </label>
              <input
                id="employee-invitation-url-input"
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
