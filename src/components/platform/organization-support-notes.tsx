"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Note = {
  id: string;
  note: string;
  createdAt: string;
  createdByUserId?: string | null;
};

export function OrganizationSupportNotes({
  organizationId,
}: {
  organizationId: string;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/platform/support?organizationId=${organizationId}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Support notes could not be loaded.");
      }
      setNotes(body.notes ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Support notes could not be loaded.");
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/platform/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId, note: note.trim() }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Support note could not be created.");
      }
      setNote("");
      showToast({ type: "success", title: "Note recorded", message: "Support note added to timeline." });
      await load();
    } catch (cause) {
      const errMsg = cause instanceof Error ? cause.message : "Support note could not be created.";
      setError(errMsg);
      showToast({ type: "error", title: "Note failed", message: errMsg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border border-border/80 bg-surface shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Internal Support & Escalation Notes
            </CardTitle>
            <p className="text-xs text-muted">
              Confidential operator annotations visible only to platform administrators
            </p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </span>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger-border bg-danger-bg p-3 text-xs text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={submit} className="flex gap-2">
          <Input
            aria-label="Support note"
            placeholder="Add an operational or compliance note for this tenant…"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="flex-1 bg-slate-50/50 text-sm focus:bg-white"
          />
          <Button
            type="submit"
            disabled={busy || !note.trim()}
            className="gap-1.5 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{busy ? "Saving…" : "Add Note"}</span>
          </Button>
        </form>

        {notes.length ? (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {notes.map((item) => (
              <div
                key={item.id}
                className="group rounded-xl border border-border/70 bg-slate-50/50 p-3.5 transition-colors hover:border-border hover:bg-slate-50"
              >
                <p className="text-sm text-foreground/90 leading-relaxed">{item.note}</p>
                <div className="mt-2.5 flex items-center gap-2 text-xs text-muted">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  {item.createdByUserId && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      · Author: {item.createdByUserId.slice(0, 8)}…
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 p-6 text-center">
            <p className="text-sm font-medium text-slate-600">No support notes recorded</p>
            <p className="mt-1 text-xs text-muted">
              Add operational guidelines, escalation notices, or compliance details above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
