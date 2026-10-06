"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OrganizationStatusActions({
  organizationId,
  status: initialStatus,
}: {
  organizationId: string;
  status: string;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const busy = isSubmitting || isPending;

  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  async function update(nextStatus: string) {
    if (
      (nextStatus === "suspended" || nextStatus === "rejected") &&
      !window.confirm(`Confirm changing this organization to ${nextStatus}?`)
    ) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const isApproval = currentStatus === "pending" && nextStatus === "active";
      const response = await fetch(
        `/api/platform/organizations/${organizationId}/${isApproval ? "approve" : "status"}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(isApproval ? {} : { status: nextStatus }),
        }
      );
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        setCurrentStatus(nextStatus);
        const delivery = body.provisioning?.invitation?.delivery;
        setMessage(
          isApproval && delivery === "not_configured"
            ? "Approved; invitation created, but email delivery is not configured."
            : isApproval && delivery === "sent"
            ? "Approved; invitation email sent."
            : `Organization ${nextStatus}.`
        );
        startTransition(() => {
          router.refresh();
        });
      } else {
        setMessage(body.error?.message ?? "Unable to update status.");
      }
    } catch {
      setMessage("Unable to update status.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentStatus === "pending" && (
        <Button
          size="sm"
          disabled={busy}
          onClick={() => void update("active")}
        >
          {busy ? "Approving…" : "Approve and invite admin"}
        </Button>
      )}
      {currentStatus === "active" && (
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void update("suspended")}
        >
          {busy ? "Updating…" : "Suspend"}
        </Button>
      )}
      {currentStatus === "suspended" && (
        <Button
          size="sm"
          disabled={busy}
          onClick={() => void update("active")}
        >
          {busy ? "Updating…" : "Reactivate"}
        </Button>
      )}
      {currentStatus === "pending" && (
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => void update("rejected")}
        >
          Reject
        </Button>
      )}
      {message && <span className="text-xs text-muted">{message}</span>}
    </div>
  );
}
