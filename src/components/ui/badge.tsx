import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border",
  {
    variants: {
      variant: {
        default: "border-emerald-200/90 bg-success-bg text-primary",
        neutral: "border-border bg-slate-100 text-slate-700",
        success: "border-emerald-200/90 bg-success-bg text-secondary",
        warning: "border-amber-200 bg-warning-bg text-warning",
        danger: "border-rose-200 bg-danger-bg text-danger",
        info: "border-sky-200 bg-info-bg text-info",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

