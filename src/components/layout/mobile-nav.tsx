"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isRouteActive } from "./nav-utils";
import LogoutButton from "./logout-button";

export type MobileNavItem = { label: string; href: string };

interface MobileNavProps {
  items: MobileNavItem[];
  label?: string;
}

export function MobileNav({ items, label = "Open navigation" }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const allHrefs = useMemo(() => items.map((i) => i.href), [items]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatically close drawer whenever pathname changes (link tap, back/forward button)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Prevent background scrolling when drawer is open and restore cleanly on close/unmount
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const drawerContent = open ? (
    <>
      {/* Backdrop overlay */}
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs transition-opacity duration-200 motion-reduce:transition-none lg:hidden"
        aria-label="Close navigation overlay"
        onClick={() => setOpen(false)}
      />

      {/* Drawer sheet dialog */}
      <nav
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        className="fixed inset-y-0 left-0 z-[70] flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-[#EFF4EE] px-5 py-5 text-foreground shadow-2xl transition-transform duration-200 motion-reduce:transition-none lg:hidden [scrollbar-width:thin] border-r border-[#D9E5D7]"
      >
        {/* Drawer header with official brand logo */}
        <div className="-mx-5 -mt-5 mb-5 flex items-center justify-between border-b border-[#D9E5D7] bg-[#E8F0E6]/70 px-5 pt-5 pb-4">
          <Link
            href="/app"
            onClick={() => setOpen(false)}
            className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            <Image
              src="/symphowork-logo.png"
              alt="SymphoWork"
              width={150}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-[#E2EDE1] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 space-y-1">
          {items.map((item) => {
            const active = isRouteActive(pathname, item.href, allHrefs);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-surface text-primary font-semibold shadow-xs border border-[#CDE0CC]"
                    : "text-slate-600 hover:bg-[#E2EDE1] hover:text-primary"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span>{item.label}</span>
                {active && (
                  <span className="h-3.5 w-1 rounded-full bg-primary" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Drawer footer with logout action */}
        <div className="mt-auto border-t border-border/80 pt-4 space-y-3">
          <div>
            <LogoutButton
              className="w-full justify-start text-danger hover:bg-danger/10 hover:text-danger border border-danger/20 font-medium"
              showIcon={true}
            >
              Log out
            </LogoutButton>
          </div>
          <div className="text-xs text-muted">
            <p className="font-semibold text-foreground">SymphoWork Enterprise</p>
            <p className="text-[11px] text-muted">Intelligent Workforce OS</p>
          </div>
        </div>
      </nav>
    </>
  ) : null;

  return (
    <>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        aria-label={open ? "Close navigation" : label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>

      {/* Render drawer directly into document.body to escape header stacking context */}
      {mounted && typeof document !== "undefined" && drawerContent
        ? createPortal(drawerContent, document.body)
        : drawerContent}
    </>
  );
}

