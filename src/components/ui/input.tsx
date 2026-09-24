import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("h-10 w-full rounded-lg border bg-surface px-3 text-sm shadow-sm placeholder:text-muted focus:border-primary focus:outline-none", className)} {...props} />; }
