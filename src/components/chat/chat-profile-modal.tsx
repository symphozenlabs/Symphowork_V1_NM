"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Briefcase, Building2, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPresenceStatus, getAvatarColorClass, getInitials } from "./utils";

export interface ProfileDetails {
  id: string;
  displayName: string;
  departmentName?: string | null;
  designationTitle?: string | null;
  presence?: {
    status: "online" | "away" | "offline";
    lastSeenAt: string | null;
  } | null;
}

interface ChatProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileDetails | null;
}

export function ChatProfileModal({
  open,
  onOpenChange,
  profile,
}: ChatProfileModalProps) {
  if (!profile) return null;

  const initials = getInitials(profile.displayName);
  const colorClass = getAvatarColorClass(profile.displayName);
  const presenceText = formatPresenceStatus(profile.presence);
  const presenceStatus = profile.presence?.status ?? "offline";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-xs transition-opacity" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none"
          aria-describedby="profile-dialog-desc"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <ShieldCheck className="size-4" />
              Coworker Profile
            </span>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close profile"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div id="profile-dialog-desc" className="sr-only">
            Coworker details including name, title, department, and presence status.
          </div>

          {/* Profile Card */}
          <div className="flex flex-col items-center pt-2 pb-4 text-center">
            {/* Avatar with Presence Indicator */}
            <div className="relative mb-3">
              <div
                className={cn(
                  "flex size-20 items-center justify-center rounded-full border-2 text-xl font-bold tracking-wide shadow-sm",
                  colorClass
                )}
              >
                {initials}
              </div>
              <span
                className={cn(
                  "absolute bottom-0.5 right-0.5 size-4 rounded-full border-2 border-white shadow-xs",
                  presenceStatus === "online" && "bg-emerald-500",
                  presenceStatus === "away" && "bg-amber-500",
                  presenceStatus === "offline" && "bg-slate-400"
                )}
                title={presenceText}
              />
            </div>

            {/* Display Name */}
            <Dialog.Title className="text-lg font-bold text-slate-900">
              {profile.displayName}
            </Dialog.Title>

            {/* Presence Badge */}
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2 rounded-full",
                  presenceStatus === "online" && "bg-emerald-500 animate-pulse",
                  presenceStatus === "away" && "bg-amber-500",
                  presenceStatus === "offline" && "bg-slate-400"
                )}
              />
              <span className="text-xs font-medium text-slate-600">
                {presenceText}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <Briefcase className="size-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1 text-left">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Job Title / Designation
                </span>
                <span className="font-medium text-slate-800">
                  {profile.designationTitle || "Team Member"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Building2 className="size-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1 text-left">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Department
                </span>
                <span className="font-medium text-slate-800">
                  {profile.departmentName || "General Staff"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Clock className="size-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1 text-left">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Status
                </span>
                <span className="font-medium text-slate-800">
                  {presenceText}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
