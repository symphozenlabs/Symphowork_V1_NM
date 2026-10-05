"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const [orgToDelete, setOrgToDelete] = useState<PlatformOrgRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [successToast, setSuccessToast] = useState<{ title: string; message?: string } | null>(null);

  // Keep rows in sync if server re-renders initialRows
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  // Auto-dismiss success toast after 5 seconds
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => {
      setSuccessToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [successToast]);

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

      // Deletion succeeded
      const deletedName = orgToDelete.name;
      const deletedId = orgToDelete.id;

      setOrgToDelete(null);
      setIsDeleting(false);
      setDeleteError("");
      setRows((prev) => prev.filter((r) => r.id !== deletedId));
      setSuccessToast({
        title: "Organization deleted successfully.",
        message: `\u201c${deletedName}\u201d has been deleted.`,
      });

      router.refresh();
    } catch {
      setDeleteError("The organization could not be deleted. Check your connection and try again.");
      setIsDeleting(false);
    }
  }

  return (
    <>
      {/* Top-Right Success Notification Toast */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-white p-4 shadow-xl transition-all"
        >
          <div className="grid size-7 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            ✓
          </div>
          <div className="pr-2">
            <p className="font-semibold text-emerald-950">{successToast.title}</p>
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
            ✕
          </button>
        </div>
      )}

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
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-surface p-6 shadow-2xl focus:outline-hidden">
            <Dialog.Title className="text-lg font-bold text-foreground">
              Delete organization?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted">
              You are about to delete &ldquo;{orgToDelete?.name}&rdquo;. This action cannot be undone.
            </Dialog.Description>

            {deleteError && (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-[#fff1f1] p-3 text-sm text-destructive"
              >
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
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
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Organizations Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-3">Organization</th>
              <th className="px-3 py-3">Identifier</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b transition-colors last:border-0 hover:bg-[#fafcff]">
                <td className="px-3 py-4 font-semibold">
                  <Link className="hover:text-primary" href={`/platform/organizations/${row.id}`}>
                    {row.name}
                  </Link>
                </td>
                <td className="px-3 py-4 text-muted">{row.slug}</td>
                <td className="px-3 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge>{row.status}</Badge>
                    {row.provisioningStatus === "running" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Provisioning
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 text-muted">
                  {new Date(row.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-4 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive font-medium hover:bg-[#fff1f1] hover:text-destructive"
                    onClick={() => openDeleteModal(row)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-8 text-center text-sm text-muted">
            No organizations match the current scope.
          </p>
        )}
      </div>
    </>
  );
}
