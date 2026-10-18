"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, HelpCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary";
  isLoading?: boolean;
  onConfirm: (value: string) => void | Promise<void>;
  onCancel?: () => void;
}

export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  defaultValue = "",
  required = true,
  confirmText = "Submit",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setError(null);
    }
  }, [open, defaultValue]);

  const handleCancel = () => {
    if (isLoading) return;
    setError(null);
    onCancel?.();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !value.trim()) {
      setError(`${label} is required.`);
      return;
    }
    setError(null);
    await onConfirm(value.trim());
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (isLoading) return;
        if (!nextOpen) handleCancel();
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
          className="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex size-9 items-center justify-center rounded-xl ${
                  variant === "destructive"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {variant === "destructive" ? (
                  <AlertCircle className="size-5" />
                ) : (
                  <HelpCircle className="size-5" />
                )}
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900">
                  {title}
                </Dialog.Title>
                {description && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {description}
                  </div>
                )}
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

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                {label} {required && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={placeholder}
                rows={3}
                disabled={isLoading}
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              />
              {error && (
                <p className="text-[11px] font-medium text-rose-600">{error}</p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2 border-t border-slate-100">
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
                type="submit"
                variant={variant === "destructive" ? "destructive" : "primary"}
                size="sm"
                disabled={isLoading || (required && !value.trim())}
                className="w-full sm:w-auto font-semibold shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
