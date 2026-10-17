"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BrandedLoaderProps {
  /** Short status message */
  message?: string;
  /** Optional secondary subtitle */
  subtext?: string;
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** If true, renders a horizontal inline badge/pill rather than centered card */
  inline?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    symbolSize: 24,
    ringSize: "size-9",
    textClass: "text-xs",
    subtextClass: "text-[10px]",
    containerClass: "py-3 px-4",
  },
  md: {
    symbolSize: 36,
    ringSize: "size-14",
    textClass: "text-sm",
    subtextClass: "text-xs",
    containerClass: "py-6 px-6",
  },
  lg: {
    symbolSize: 48,
    ringSize: "size-20",
    textClass: "text-base",
    subtextClass: "text-xs",
    containerClass: "py-10 px-8",
  },
};

export function BrandedLoader({
  message = "Loading your workspace...",
  subtext,
  size = "md",
  inline = false,
  className,
}: BrandedLoaderProps) {
  const conf = sizeConfig[size] || sizeConfig.md;

  if (inline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1.5 shadow-2xs",
          className
        )}
      >
        <div className="relative flex size-5 shrink-0 items-center justify-center">
          {/* Animated pulsing glow */}
          <span
            className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping motion-reduce:hidden"
            aria-hidden="true"
          />
          <Image
            src="/symphowork-symbol.png"
            alt="SymphoWork"
            width={16}
            height={16}
            priority
            className="relative z-10 h-4 w-4 object-contain"
          />
        </div>
        <span className="text-xs font-semibold text-emerald-950">{message}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center text-center select-none",
        conf.containerClass,
        className
      )}
    >
      {/* Outer ambient glow and animated ring */}
      <div className="relative flex items-center justify-center">
        {/* Ambient emerald backlight */}
        <div
          className="absolute -inset-2 rounded-full bg-emerald-500/15 blur-lg animate-pulse motion-reduce:hidden"
          aria-hidden="true"
        />

        {/* Outer glowing ring */}
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full border border-emerald-200/90 bg-white/90 p-2 shadow-xs backdrop-blur-xs",
            conf.ringSize
          )}
        >
          {/* Subtle spinning gradient ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-600 border-r-emerald-500/50 animate-spin motion-reduce:hidden"
            style={{ animationDuration: "1.6s" }}
            aria-hidden="true"
          />

          {/* SymphoWork Brand Symbol Asset */}
          <Image
            src="/symphowork-symbol.png"
            alt="SymphoWork"
            width={conf.symbolSize}
            height={conf.symbolSize}
            priority
            className="relative z-10 h-auto w-auto object-contain drop-shadow-xs transition-transform"
          />
        </div>
      </div>

      {/* Message and Subtext */}
      {message && (
        <div className="mt-3.5 space-y-0.5">
          <p
            className={cn(
              "font-semibold text-slate-800 tracking-tight flex items-center justify-center gap-1.5",
              conf.textClass
            )}
          >
            <span>{message}</span>
          </p>
          {subtext && (
            <p className={cn("text-muted font-normal max-w-xs", conf.subtextClass)}>
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
