"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { PromptDialog } from "@/components/ui/prompt-dialog";

type Task = { id: string; status: string; entityType: string; stepName: string; dueAt?: string | null };

export function ApprovalInbox() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectingTask, setRejectingTask] = useState<Task | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/app/approvals");
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Unable to load approval tasks.");
      setTasks(body.tasks);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load approval tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const showDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/app/approvals/${id}`);
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Unable to load approval details.");
      setDetails((current) => ({ ...current, [id]: String(JSON.stringify(body.detail, null, 2)) }));
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Unable to load approval details.";
      setError(msg);
      showToast({ type: "error", title: "Details error", message: msg });
    }
  };

  const act = async (task: Task, action: "approve" | "reject", providedComment?: string) => {
    const comment = action === "reject" ? providedComment : undefined;
    if (action === "reject" && !comment?.trim()) return;
    setBusy(task.id);
    setError("");
    try {
      const response = await fetch(`/api/app/approvals/${task.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, comment })
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Unable to update approval.");
      const succMsg = `Approval ${action === "approve" ? "approved" : "rejected"} successfully.`;
      setMessage(succMsg);
      showToast({
        type: "success",
        title: "Approval updated",
        message: succMsg
      });
      await load();
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Unable to update approval.";
      setError(msg);
      showToast({ type: "error", title: "Approval error", message: msg });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted">Loading approval tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted">No approval tasks assigned to you.</p>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="rounded-xl border p-4 bg-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium capitalize text-primary">{task.entityType.replaceAll("_", " ")}</p>
                <p className="text-sm text-muted">
                  {task.stepName} · <span className="capitalize">{task.status.replaceAll("_", " ")}</span>
                  {task.dueAt ? ` · due ${task.dueAt}` : ""}
                </p>
              </div>
              {task.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => showDetails(task.id)}>
                    Details
                  </Button>
                  <Button size="sm" disabled={busy !== null} onClick={() => act(task, "approve")}>
                    {busy === task.id ? "Approving…" : "Approve"}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => setRejectingTask(task)}>
                    {busy === task.id ? "Rejecting…" : "Reject"}
                  </Button>
                </div>
              )}
            </div>
            {details[task.id] && (
              <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-[#F7F8FB] border p-3 text-xs text-muted">
                {details[task.id]}
              </pre>
            )}
          </div>
        ))
      )}
      {message && <p role="status" className="text-sm text-success">{message}</p>}

      {/* Rejection Prompt Dialog */}
      <PromptDialog
        open={Boolean(rejectingTask)}
        onOpenChange={(open) => {
          if (!open) setRejectingTask(null);
        }}
        title="Reject Approval Request"
        description={`Provide a reason for rejecting this ${rejectingTask?.entityType.replaceAll("_", " ") ?? "task"}. This comment will be logged in the audit trail.`}
        label="Reason for rejection"
        placeholder="Enter required rejection justification..."
        required
        variant="destructive"
        confirmText="Confirm Rejection"
        isLoading={busy === rejectingTask?.id}
        onConfirm={async (reason) => {
          if (!rejectingTask) return;
          const task = rejectingTask;
          setRejectingTask(null);
          await act(task, "reject", reason);
        }}
      />
    </div>
  );
}

