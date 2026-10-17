"use client";

import React, { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  // Clear loading state when pathname or search parameters change
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // Intercept workspace internal link clicks to display immediate feedback
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore modified clicks (new tab, new window, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (target.target && target.target !== "_self") return;
      if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (href.startsWith("#")) return;

      // Check if target is an internal workspace route
      const currentFullUrl = window.location.pathname + window.location.search;
      if (href === currentFullUrl || href === window.location.pathname) {
        return; // Don't trigger loader for same page link
      }

      startTransition(() => {
        setIsNavigating(true);
      });
    };

    const handlePopState = () => {
      // Back/forward navigation
      setIsNavigating(true);
    };

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Safety fallback: Never leave the UI stuck loading for more than 6 seconds
  useEffect(() => {
    if (!isNavigating) return;
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [isNavigating]);

  if (!isNavigating) return null;

  return (
    <div
      role="progressbar"
      aria-label="Navigating workspace"
      aria-busy="true"
      className="fixed inset-x-0 top-0 z-50 h-0.75 overflow-hidden bg-emerald-100 pointer-events-none"
    >
      <div
        className={cn(
          "h-full w-full bg-gradient-to-r from-[#0D3324] via-emerald-500 to-teal-400",
          "animate-[navProgress_1.4s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:bg-emerald-600"
        )}
      />
    </div>
  );
}
