import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type = "text",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-2xs transition-colors",
        "placeholder:text-muted",
        "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
        "aria-invalid:border-danger aria-invalid:focus-visible:outline-danger",
        className
      )}
      {...props}
    />
  );
}

