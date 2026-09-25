"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

type MobileNavItem = { label: string; href: string };

export function MobileNav({ items, label = "Open navigation" }: { items: MobileNavItem[]; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface lg:hidden"
        aria-label={open ? "Close navigation" : label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
            aria-label="Close navigation overlay"
            onClick={() => setOpen(false)}
          />
          <nav aria-label="Mobile navigation" className="fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto bg-[#10233f] px-5 py-6 text-white shadow-xl lg:hidden">
            <div className="mb-8 flex items-center justify-between">
              <p className="font-semibold">Workspace navigation</p>
              <button type="button" className="rounded-lg p-2 hover:bg-white/10" aria-label="Close navigation" onClick={() => setOpen(false)}>
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-1">
              {items.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-blue-100/80 hover:bg-white/10 hover:text-white">
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
