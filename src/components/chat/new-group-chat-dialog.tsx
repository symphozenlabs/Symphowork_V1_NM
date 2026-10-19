"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Users, Search, X, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatRecipient } from "./types";
import { getAvatarColorClass, getInitials } from "./utils";

interface NewGroupChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (name: string, employeeIds: string[]) => Promise<void>;
}

export function NewGroupChatDialog({
  open,
  onOpenChange,
  onCreateGroup,
}: NewGroupChatDialogProps) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [recipients, setRecipients] = useState<ChatRecipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recipients
  useEffect(() => {
    if (!open) {
      setName("");
      setSearch("");
      setSelectedIds([]);
      setError(null);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParam = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
        const res = await fetch(`/api/app/chat/recipients${queryParam}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error?.message ?? "Failed to load team members.");
        }
        if (!isCancelled) {
          setRecipients(data.recipients ?? []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Failed to load team members.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [open, search]);

  function toggleRecipient(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function removeSelected(id: string) {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Please provide a group name.");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Please select at least one colleague for this group.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onCreateGroup(name.trim(), selectedIds);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create group conversation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-xs transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900">
                  New Group Channel
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  Create a team channel for group collaboration and task coordination.
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

          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            {/* Group Name */}
            <div>
              <label htmlFor="group-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Name *
              </label>
              <Input
                id="group-name"
                required
                maxLength={180}
                placeholder="e.g. Engineering Core, Product Launch 2026, Operations…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-10"
                autoFocus
              />
            </div>

            {/* Selected Members Chips */}
            {selectedIds.length > 0 && (
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Selected Members ({selectedIds.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                  {selectedIds.map((id) => {
                    const rec = recipients.find((r) => r.id === id);
                    const label = rec?.displayName || "Member";
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary"
                      >
                        <span>{label}</span>
                        <button
                          type="button"
                          onClick={() => removeSelected(id)}
                          className="hover:text-primary/70 transition-colors"
                          aria-label={`Remove ${label}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colleague Search */}
            <div>
              <label htmlFor="search-group-members" className="block text-xs font-semibold text-slate-700 mb-1">
                Add Members
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
                <Input
                  id="search-group-members"
                  type="text"
                  placeholder="Filter colleagues by name or department…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-slate-50/70"
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

            {/* Member Checklist */}
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-200 rounded-xl p-1 bg-slate-50/40">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              ) : recipients.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">
                  No coworkers found.
                </div>
              ) : (
                recipients.map((rec) => {
                  const isChecked = selectedIds.includes(rec.id);
                  const initials = getInitials(rec.displayName);
                  const colorClass = getAvatarColorClass(rec.displayName);
                  const subtitle = [rec.designationTitle, rec.departmentName]
                    .filter(Boolean)
                    .join(" • ") || "Colleague";

                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => toggleRecipient(rec.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors cursor-pointer",
                        isChecked ? "bg-primary/10 border border-primary/20" : "hover:bg-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                            colorClass
                          )}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-800">
                            {rec.displayName}
                          </p>
                          <p className="truncate text-[11px] text-muted">
                            {subtitle}
                          </p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                          isChecked
                            ? "border-primary bg-primary text-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {isChecked && <Check className="size-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
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
                disabled={submitting || !name.trim() || selectedIds.length === 0}
                className="gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Creating Group…</span>
                  </>
                ) : (
                  <span>Create Channel</span>
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
