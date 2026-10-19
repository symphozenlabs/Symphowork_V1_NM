"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Briefcase, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MessageItem, ChatRecipient, TaskProjectOption } from "./types";

interface MessageToTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: MessageItem | null;
  onTaskCreated: (taskId: string, messageId: string) => void;
}

export function MessageToTaskDialog({
  open,
  onOpenChange,
  message,
  onTaskCreated,
}: MessageToTaskDialogProps) {
  const initialTitle = message?.content?.trim()
    ? message.content.trim().length > 80
      ? `${message.content.trim().slice(0, 77)}…`
      : message.content.trim()
    : "Task from chat";
  const initialDescription = message?.content?.trim() ?? "";

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [projectId, setProjectId] = useState("");
  const [assigneeEmployeeId, setAssigneeEmployeeId] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [dueDate, setDueDate] = useState("");

  const [projects, setProjects] = useState<TaskProjectOption[]>([]);
  const [assignees, setAssignees] = useState<ChatRecipient[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-sync form when message changes
  useEffect(() => {
    if (message) {
      const rawContent = message.content?.trim() ?? "";
      const suggestedTitle = rawContent.length > 80 ? `${rawContent.slice(0, 77)}…` : rawContent;
      setTitle(suggestedTitle || "Task from chat");
      setDescription(rawContent);
      setProjectId("");
      setAssigneeEmployeeId("");
      setPriority("medium");
      setDueDate("");
      setError(null);
    }
  }, [message]);

  // Fetch projects and assignees options
  useEffect(() => {
    if (!open) return;

    let isCancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const [projectsRes, assigneesRes] = await Promise.all([
          fetch("/api/app/projects").then((r) => (r.ok ? r.json() : { projects: [] })),
          fetch("/api/app/chat/recipients").then((r) => (r.ok ? r.json() : { recipients: [] })),
        ]);

        if (!isCancelled) {
          setProjects(projectsRes.projects ?? []);
          setAssignees(assigneesRes.recipients ?? []);
        }
      } catch {
        // Fallback silently if projects endpoint isn't accessible
      } finally {
        if (!isCancelled) setLoadingOptions(false);
      }
    }

    void loadOptions();
    return () => {
      isCancelled = true;
    };
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!message) return;
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/app/chat/messages/${message.id}/task`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          projectId: projectId || undefined,
          assigneeEmployeeId: assigneeEmployeeId || undefined,
          dueDate: dueDate || undefined,
          priority,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to convert message to task.");
      }

      const taskId = body.task?.id ?? message.id;
      onTaskCreated(taskId, message.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not convert message to task.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!message) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-xs transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="size-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900">
                  Create Task from Message
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  Turn this conversation message into a trackable project task.
                </Dialog.Description>
              </div>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {/* Title */}
            <div>
              <label htmlFor="task-title" className="block text-xs font-semibold text-slate-700 mb-1">
                Task Title *
              </label>
              <Input
                id="task-title"
                required
                maxLength={180}
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs h-10"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-description" className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="task-description"
                rows={3}
                placeholder="Task details and context…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground shadow-2xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Project & Assignee Dropdowns */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="task-project" className="block text-xs font-semibold text-slate-700 mb-1">
                  Project
                </label>
                <select
                  id="task-project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={loadingOptions}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">No Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="task-assignee" className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignee
                </label>
                <select
                  id="task-assignee"
                  value={assigneeEmployeeId}
                  onChange={(e) => setAssigneeEmployeeId(e.target.value)}
                  disabled={loadingOptions}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Unassigned</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority & Due Date */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="task-priority" className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label htmlFor="task-due-date" className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date
                </label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-xs h-10"
                />
              </div>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 p-2.5 text-xs text-danger">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting || !title.trim()}
                className="gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Creating Task…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    <span>Create Task</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
