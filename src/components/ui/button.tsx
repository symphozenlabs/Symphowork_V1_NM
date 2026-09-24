import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50", {
  variants: { variant: { primary: "bg-primary text-primary-foreground shadow-sm hover:bg-[#0f4fd1]", secondary: "border bg-surface text-foreground hover:bg-[#f0f4fa]", ghost: "text-muted hover:bg-[#eaf0f8]" }, size: { sm: "h-9 px-3", md: "h-10 px-4", lg: "h-11 px-5" } },
  defaultVariants: { variant: "primary", size: "md" },
});

export function Button({ className, variant, size, asChild = false, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
