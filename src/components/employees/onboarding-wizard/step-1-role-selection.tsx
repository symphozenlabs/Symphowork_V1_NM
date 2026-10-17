"use client";

import React from "react";
import { Check, ShieldAlert } from "lucide-react";
import {
  ROLE_METADATA,
  getAssignableRoles,
  type SystemRole,
} from "@/modules/rbac/permissions";
import { RoleIllustration } from "./role-illustrations";

interface Step1RoleSelectionProps {
  currentUserRole?: string | null;
  selectedRole: SystemRole;
  onSelectRole: (role: SystemRole) => void;
}

export function Step1RoleSelection({
  currentUserRole,
  selectedRole,
  onSelectRole,
}: Step1RoleSelectionProps) {
  const assignableRoles = getAssignableRoles(currentUserRole);

  if (assignableRoles.length === 0) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center space-y-3">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <ShieldAlert className="size-6" />
        </div>
        <h3 className="text-base font-bold text-rose-900">
          Employee Creation Restricted
        </h3>
        <p className="mx-auto max-w-md text-xs leading-relaxed text-rose-700">
          Your current account role (
          <span className="font-mono font-semibold">
            {currentUserRole || "UNASSIGNED"}
          </span>
          ) is not authorized to onboard or invite team members. Only Organization
          Owners, HR Administrators, and HR Executives may perform workforce onboarding.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Select User Role
        </h2>
        <p className="mt-1 text-xs text-muted">
          Choose the organizational role to grant. Available choices are scoped strictly
          to your permissions.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Available operational roles"
        className="grid gap-3.5 sm:grid-cols-2"
      >
        {assignableRoles.map((roleKey) => {
          const meta = ROLE_METADATA[roleKey];
          const isSelected = selectedRole === roleKey;

          return (
            <div
              key={roleKey}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onSelectRole(roleKey)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelectRole(roleKey);
                }
              }}
              className={`group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? "border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/40"
                  : "border-border/80 bg-white hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              {/* Illustration Avatar */}
              <div className="shrink-0 transition-transform group-hover:scale-105">
                <RoleIllustration
                  roleKey={roleKey}
                  selected={isSelected}
                  className="size-14 sm:size-16"
                />
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      {meta.title}
                    </span>
                  </div>

                  {/* Selection Radio Indicator */}
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-xs"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                    }`}
                  >
                    {isSelected && <Check className="size-3 stroke-[3]" />}
                  </div>
                </div>

                <span className="inline-block rounded-md border border-slate-200/80 bg-slate-100/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {meta.category}
                </span>

                <p className="text-[11px] leading-relaxed text-muted line-clamp-2">
                  {meta.shortDescription}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
