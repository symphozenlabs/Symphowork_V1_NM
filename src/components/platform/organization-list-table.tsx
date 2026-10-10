"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Search,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PlatformOrgRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  provisioningStatus?: string | null;
}

interface OrganizationListTableProps {
  initialRows: PlatformOrgRow[];
}

export function OrganizationListTable({ initialRows }: OrganizationListTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState<PlatformOrgRow[]>(initialRows);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orgToDelete, setOrgToDelete] = useState<PlatformOrgRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [successToast, setSuccessToast] = useState<{ title: string; message?: string } | null>(null);

  // Sync if initialRows updates
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => {
      setSuccessToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [successToast]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || row.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchQuery, statusFilter]);

  function openDeleteModal(org: PlatformOrgRow) {
    setDeleteError("");
    setOrgToDelete(org);
  }

  function closeDeleteModal() {
    if (isDeleting) return;
    setOrgToDelete(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!orgToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/platform/organizations/${orgToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDeleteError(body.error?.message ?? "Unable to delete organization. Please try again.");
        setIsDeleting(false);
        return;
      }

      const deletedName = orgToDelete.name;
      const deletedId = orgToDelete.id;

      setOrgToDelete(null);
      setIsDeleting(false);
      setDeleteError("");
      setRows((prev) => prev.filter((r) => r.id !== deletedId));
      setSuccessToast({
        title: "Organization deleted successfully.",
        message: `\u201c${deletedName}\u201d has been removed from the platform.`,
      });

      router.refresh();
    } catch {
      setDeleteError("The organization could not be deleted. Check your connection and try again.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Success Notification Toast */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-success-border bg-surface p-4 shadow-xl transition-all"
        >
          <div className="grid size-7 place-items-center rounded-full bg-success-bg text-sm font-bold text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </div>
          <div className="pr-2">
            <p className="font-semibold text-foreground text-sm">{successToast.title}</p>
            {successToast.message && (
              <p className="text-xs text-muted">{successToast.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="ml-2 cursor-pointer text-muted transition-colors hover:text-foreground"
            aria-label="Dismiss notification"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden="true" />
          <Input
            placeholder="Search by name or slug…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">Status:</span>
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5 text-xs">
            {["all", "active", "pending", "suspended"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-surface text-foreground shadow-xs font-semibold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog.Root
        open={Boolean(orgToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            closeDeleteModal();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-2xl focus:outline-hidden">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger-bg text-destructive border border-danger-border">
                <Trash2 className="size-5" aria-hidden="true" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-foreground">
                  Delete organization?
                </Dialog.Title>
                <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                  You are about to permanently delete &ldquo;{orgToDelete?.name}&rdquo; ({orgToDelete?.slug}). This action cannot be reversed.
                </Dialog.Description>
              </div>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="secondary"
                disabled={isDeleting}
                onClick={closeDeleteModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={confirmDelete}
              >
                {isDeleting ? "Deleting…" : "Delete organization"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Organization</th>
                <th className="px-4 py-3.5">Identifier</th>
                <th className="px-4 py-3.5">Lifecycle Status</th>
                <th className="px-4 py-3.5">Registered</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.map((row) => {
                const statusVariant =
                  row.status === "active"
                    ? "success"
                    : row.status === "pending"
                    ? "warning"
                    : row.status === "suspended"
                    ? "danger"
                    : "neutral";

                return (
                  <tr
                    key={row.id}
                    className="group transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3.5 font-semibold">
                      <div className="flex items-center gap-3">
                        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-active text-xs font-bold text-sidebar-active-text border border-primary/10">
                          {row.name.slice(0, 2).toUpperCase()}
                        </div>
                        <Link
                          className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                          href={`/platform/organizations/${row.id}`}
                        >
                          <span>{row.name}</span>
                          <ExternalLink className="size-3 opacity-0 group-hover:opacity-60 transition-opacity" aria-hidden="true" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted font-mono text-xs">{row.slug}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant}>{row.status}</Badge>
                        {row.provisioningStatus === "running" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Provisioning
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted text-xs">
                      {new Date(row.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-xs h-8"
                        >
                          <Link href={`/platform/organizations/${row.id}`}>
                            Details
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 text-destructive hover:bg-danger-bg hover:text-destructive"
                          onClick={() => openDeleteModal(row)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filteredRows.length && (
            <div className="p-12 text-center text-sm text-muted">
              <Building2 className="mx-auto size-8 text-muted/50 mb-2" aria-hidden="true" />
              <p className="font-semibold text-foreground">No organizations found</p>
              <p className="text-xs text-muted mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search query or status filter."
                  : "No organizations are currently provisioned in this environment."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
