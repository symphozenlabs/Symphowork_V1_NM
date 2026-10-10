"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  /**
   * "light" = Stacked official logo with dark wordmark (for light backgrounds)
   * "dark" = Stacked official logo with white wordmark (for dark green backgrounds)
   * "horizontal" = Symbol + crisp readable typography wordmark (for light headers/sidebars)
   * "horizontal-dark" = Symbol + crisp white typography wordmark (for dark surfaces)
   * "symbol" = Just the emerald 3D ribbon mark
   */
  variant?: "light" | "dark" | "horizontal" | "horizontal-dark" | "symbol";
  /**
   * Size presets
   */
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  className?: string;
  subtext?: string;
  priority?: boolean;
}

const sizeConfig = {
  sm: {
    stackedH: 36,
    stackedW: 39,
    symbolSize: 28,
    textClass: "text-base font-bold",
    subtextClass: "text-[10px]",
  },
  md: {
    stackedH: 48,
    stackedW: 52,
    symbolSize: 36,
    textClass: "text-lg font-bold tracking-tight",
    subtextClass: "text-xs",
  },
  lg: {
    stackedH: 64,
    stackedW: 70,
    symbolSize: 44,
    textClass: "text-xl font-bold tracking-tight",
    subtextClass: "text-xs",
  },
  xl: {
    stackedH: 88,
    stackedW: 96,
    symbolSize: 64,
    textClass: "text-2xl font-bold tracking-tight",
    subtextClass: "text-sm",
  },
};

export function BrandLogo({
  variant = "horizontal",
  size = "md",
  href,
  className,
  subtext,
  priority = false,
}: BrandLogoProps) {
  const conf = sizeConfig[size] || sizeConfig.md;

  let content: React.ReactNode;

  if (variant === "dark") {
    // Official stacked logo with white wordmark for dark surfaces
    content = (
      <div className={cn("flex flex-col items-start gap-1 select-none", className)}>
        <Image
          src="/symphowork-logo-white.png"
          alt="SymphoWork"
          width={conf.stackedW}
          height={conf.stackedH}
          priority={priority}
          className="h-auto w-auto object-contain drop-shadow-md"
          style={{ maxHeight: `${conf.stackedH}px` }}
        />
        {subtext && (
          <span className={cn("text-emerald-300/80 font-medium", conf.subtextClass)}>
            {subtext}
          </span>
        )}
      </div>
    );
  } else if (variant === "light") {
    // Official stacked logo with dark wordmark for light surfaces
    content = (
      <div className={cn("flex flex-col items-start gap-1 select-none", className)}>
        <Image
          src="/symphowork-logo.png"
          alt="SymphoWork"
          width={conf.stackedW}
          height={conf.stackedH}
          priority={priority}
          className="h-auto w-auto object-contain"
          style={{ maxHeight: `${conf.stackedH}px` }}
        />
        {subtext && (
          <span className={cn("text-muted font-medium", conf.subtextClass)}>
            {subtext}
          </span>
        )}
      </div>
    );
  } else if (variant === "symbol") {
    // Pure symbol only
    content = (
      <div className={cn("inline-flex items-center justify-center select-none", className)}>
        <Image
          src="/symphowork-symbol.png"
          alt="SymphoWork Symbol"
          width={conf.symbolSize}
          height={conf.symbolSize}
          priority={priority}
          className="h-auto w-auto object-contain"
          style={{ maxHeight: `${conf.symbolSize}px`, maxWidth: `${conf.symbolSize}px` }}
        />
      </div>
    );
  } else if (variant === "horizontal-dark") {
    // Symbol + crisp white wordmark typography (perfect for dark headers)
    content = (
      <div className={cn("inline-flex items-center gap-3 select-none", className)}>
        <Image
          src="/symphowork-symbol.png"
          alt="SymphoWork"
          width={conf.symbolSize}
          height={conf.symbolSize}
          priority={priority}
          className="h-auto w-auto object-contain shrink-0 drop-shadow-sm"
          style={{ maxHeight: `${conf.symbolSize}px`, maxWidth: `${conf.symbolSize}px` }}
        />
        <div className="flex flex-col leading-none">
          <span className={cn("text-white font-display", conf.textClass)}>
            Sympho<span className="text-emerald-400">Work</span>
          </span>
          {subtext && (
            <span className={cn("text-emerald-200/80 font-medium tracking-wide mt-0.5", conf.subtextClass)}>
              {subtext}
            </span>
          )}
        </div>
      </div>
    );
  } else {
    // "horizontal" default (Symbol + dark typography wordmark for light sidebars/headers)
    content = (
      <div className={cn("inline-flex items-center gap-3 select-none", className)}>
        <Image
          src="/symphowork-symbol.png"
          alt="SymphoWork"
          width={conf.symbolSize}
          height={conf.symbolSize}
          priority={priority}
          className="h-auto w-auto object-contain shrink-0"
          style={{ maxHeight: `${conf.symbolSize}px`, maxWidth: `${conf.symbolSize}px` }}
        />
        <div className="flex flex-col leading-none">
          <span className={cn("text-[#0D3324] font-display", conf.textClass)}>
            Sympho<span className="text-[#174734]">Work</span>
          </span>
          {subtext && (
            <span className={cn("text-muted font-medium tracking-wide mt-0.5", conf.subtextClass)}>
              {subtext}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return content;
}
