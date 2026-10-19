"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, UserPlus, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatRecipient } from "./types";
import { getAvatarColorClass, getInitials } from "./utils";

interface NewDirectChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipient: (recipientId: string) => Promise<void>;
}

export function NewDirectChatDialog({
  open,
  onOpenChange,
  onSelectRecipient,
}: NewDirectChatDialogProps) {
  const [search, setSearch] = useState("");
  const [recipients, setRecipients] = useState<ChatRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recipients whenever dialog opens or search changes
  useEffect(() => {
    if (!open) {
      setSearch("");
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
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [open, search]);

  async function handleSelect(recipientId: string) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSelectRecipient(recipientId);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start direct conversation.");
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
                <UserPlus className="size-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900">
                  New Direct Chat
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  Select a coworker from your organization to start messaging.
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

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name, department, or role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-xs bg-slate-50/70"
                aria-label="Search recipients"
                autoFocus
              />
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 p-2.5 text-xs text-danger">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Recipients List */}
          <div className="mt-4 max-h-64 overflow-y-auto space-y-1 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : recipients.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs font-semibold text-slate-700">
                  {search ? "No colleagues found matching your query." : "No team members available."}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {search ? "Try searching by a different name or department." : "Check directory or organization membership."}
                </p>
              </div>
            ) : (
              recipients.map((rec) => {
                const initials = getInitials(rec.displayName);
                const colorClass = getAvatarColorClass(rec.displayName);
                const subDetails = [rec.designationTitle, rec.departmentName]
                  .filter(Boolean)
                  .join(" • ") || "Colleague";

                return (
                  <button
                    key={rec.id}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSelect(rec.id)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-slate-50 focus:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                        colorClass
                      )}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {rec.displayName}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {subDetails}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-semibold text-primary">
                      Chat
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
