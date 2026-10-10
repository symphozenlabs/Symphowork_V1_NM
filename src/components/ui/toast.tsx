"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (props: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastMessage, "id">) => {
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-5 right-5 z-[80] flex max-w-sm flex-col gap-2.5 sm:max-w-md"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";

          return (
            <div
              key={toast.id}
              role={isError ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl transition-all duration-200 animate-slide-up",
                isSuccess && "border-success-border bg-surface text-foreground",
                isError && "border-danger-border bg-surface text-foreground",
                !isSuccess && !isError && "border-border bg-surface text-foreground"
              )}
            >
              <div
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold mt-0.5",
                  isSuccess && "bg-success-bg text-emerald-800",
                  isError && "bg-danger-bg text-destructive",
                  !isSuccess && !isError && "bg-slate-100 text-slate-700"
                )}
              >
                {isSuccess && <CheckCircle2 className="size-4" aria-hidden="true" />}
                {isError && <AlertCircle className="size-4" aria-hidden="true" />}
                {!isSuccess && !isError && <Info className="size-4" aria-hidden="true" />}
              </div>

              <div className="flex-1 pr-2">
                <p className="text-sm font-semibold text-foreground">{toast.title}</p>
                {toast.message && (
                  <p className="mt-0.5 text-xs text-muted leading-relaxed">{toast.message}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="cursor-pointer text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-0.5"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a safe fallback if used outside ToastProvider
    return {
      showToast: () => {},
      dismissToast: () => {},
    };
  }
  return context;
}
