"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, AlertCircle, Info, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary" | "warning";
  icon?: React.ReactNode;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  icon,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleCancel = () => {
    if (isLoading) return;
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (isLoading) return;
    await onConfirm();
  };

  const defaultIcon =
    variant === "destructive" ? (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
        <AlertCircle className="size-5" aria-hidden="true" />
      </div>
    ) : variant === "warning" ? (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
    ) : (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Info className="size-5" aria-hidden="true" />
      </div>
    );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (isLoading) return;
        if (!nextOpen) onCancel?.();
        onOpenChange(nextOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onPointerDown={(e) => e.stopPropagation()}
        />
        <Dialog.Content
          onPointerDownOutside={(e) => {
            if (isLoading) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isLoading) e.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-start gap-3.5">
            {icon ?? defaultIcon}
            <div className="flex-1">
              <Dialog.Title className="text-base font-bold text-slate-900">
                {title}
              </Dialog.Title>
              <div className="mt-1 text-xs text-slate-600 leading-relaxed">
                {description}
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleCancel}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close dialog"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={handleCancel}
              className="w-full sm:w-auto font-medium"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : variant === "warning" ? "primary" : "primary"}
              size="sm"
              disabled={isLoading}
              onClick={() => void handleConfirm()}
              className={
                variant === "warning"
                  ? "w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
                  : "w-full sm:w-auto font-semibold shadow-xs"
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" aria-hidden="true" />
                  <span>Processing...</span>
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
