"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";

export function ConfigurationEditor({
  setting,
}: {
  setting: { key: string; value: string | null };
}) {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const value = new FormData(event.currentTarget).get("value");
    try {
      const response = await fetch("/api/platform/configuration", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: setting.key, value }),
      });
      const body = await response.json();
      if (response.ok) {
        setIsSuccess(true);
        const succMsg = "Setting saved successfully.";
        setMessage(succMsg);
        showToast({
          type: "success",
          title: "Configuration updated",
          message: `Setting "${setting.key}" has been saved.`,
        });
      } else {
        setIsSuccess(false);
        const errMsg = body.error?.message ?? "Unable to save configuration.";
        setMessage(errMsg);
        showToast({ type: "error", title: "Update failed", message: errMsg });
      }
    } catch {
      setIsSuccess(false);
      const connMsg = "Network error occurred while saving configuration.";
      setMessage(connMsg);
      showToast({ type: "error", title: "Connection error", message: connMsg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[240px]">
          <label className="sr-only" htmlFor={`setting-${setting.key}`}>
            {setting.key}
          </label>
          <Input
            id={`setting-${setting.key}`}
            name="value"
            defaultValue={setting.value ?? ""}
            className="bg-slate-50/50 text-sm focus:bg-white"
          />
        </div>
        <Button size="sm" type="submit" disabled={busy} className="gap-1.5 shrink-0">
          <Save className="h-3.5 w-3.5" />
          <span>{busy ? "Saving…" : "Save"}</span>
        </Button>
      </div>
      {message && (
        <div
          role="status"
          className={`flex items-center gap-1.5 text-xs font-medium ${
            isSuccess ? "text-emerald-700" : "text-danger"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" />
          )}
          <span>{message}</span>
        </div>
      )}
    </form>
  );
}
