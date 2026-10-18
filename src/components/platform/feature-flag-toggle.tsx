"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function FeatureFlagToggle({
  flag,
}: {
  flag: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    enabled: boolean;
  };
}) {
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function executeToggle() {
    setBusy(true);
    try {
      const response = await fetch(`/api/platform/features/${flag.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key: flag.key,
          name: flag.name,
          description: flag.description,
          enabled: !flag.enabled,
        }),
      });
      const body = await response.json().catch(() => ({}));
      setMessage(response.ok ? "Saved." : body.error?.message ?? "Unable to update.");
      if (response.ok) {
        window.location.reload();
      }
    } catch {
      setMessage("Unable to update feature flag.");
    } finally {
      setBusy(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={flag.enabled ? "secondary" : "ghost"}
        onClick={() => setShowConfirm(true)}
        disabled={busy}
      >
        {flag.enabled ? "Disable" : "Enable"}
      </Button>
      {message && <span className="text-xs text-muted">{message}</span>}

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={`${flag.enabled ? "Disable" : "Enable"} ${flag.name}?`}
        description={
          flag.description
            ? `Are you sure you want to ${flag.enabled ? "disable" : "enable"} ${flag.name}? ${flag.description}`
            : `Are you sure you want to ${flag.enabled ? "disable" : "enable"} ${flag.name}?`
        }
        confirmText={flag.enabled ? "Disable Flag" : "Enable Flag"}
        cancelText="Cancel"
        variant={flag.enabled ? "warning" : "primary"}
        isLoading={busy}
        onConfirm={executeToggle}
      />
    </div>
  );
}
