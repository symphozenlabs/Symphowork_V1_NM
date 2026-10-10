"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, Loader2, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  redirectTo?: string;
}

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  trigger,
  redirectTo = "/",
}: LogoutConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCancel = () => {
    if (isPending) return;
    setErrorMessage(null);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (isPending) return;
    setIsPending(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to log out");
      }

      // Hard redirect to the target landing page to guarantee all session
      // state, cache, and navigation history are cleanly reset
      window.location.assign(redirectTo || "/");
    } catch (err) {
      console.error("Logout error:", err);
      setErrorMessage("Unable to sign out at this moment. Please try again.");
      setIsPending(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return;
        if (!nextOpen) {
          setErrorMessage(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onPointerDown={(e) => {
            // Stop propagation to prevent background overlay clicks (e.g. mobile drawer)
            e.stopPropagation();
          }}
        />
        <Dialog.Content
          onPointerDownOutside={(e) => {
            if (isPending) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isPending) e.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]"
          aria-describedby="logout-dialog-description"
        >
          {/* Header with Icon */}
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <LogOut className="size-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-bold text-slate-900">
                Confirm Logout
              </Dialog.Title>
              <div
                id="logout-dialog-description"
                className="mt-1 space-y-1 text-xs text-slate-600 leading-relaxed"
              >
                <p className="font-medium text-slate-700">
                  Are you sure you want to log out of SymphoWork?
                </p>
                <p>You will be returned to the SymphoWork landing page.</p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={isPending}
                onClick={handleCancel}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Close dialog"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          {/* Failure Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              <AlertCircle className="size-4 shrink-0 text-red-600" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleCancel}
              className="w-full sm:w-auto font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isPending}
              onClick={handleConfirm}
              className="w-full sm:w-auto font-semibold shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="size-3.5" aria-hidden="true" />
                  <span>Confirm Logout</span>
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
