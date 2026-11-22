<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import DialogFrame from "$lib/components/ui/DialogFrame.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface ProfileDetails {
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
let {
  open,
  onOpenChange,
  profile,
}:ChatProfileModalProps=$props();
const initials=$derived(getInitials(profile!.displayName));
const colorClass=$derived(getAvatarColorClass(profile!.displayName));
const presenceText=$derived(formatPresenceStatus(profile!.presence));
const presenceStatus=$derived(profile!.presence?.status ?? "offline");

import { cn } from '$lib/utils';
import { formatPresenceStatus, getAvatarColorClass, getInitials } from '$lib/components/chat/utils';</script>
{#if !profile}{:else}<DialogFrame open={open} onOpenChange={onOpenChange}>
      
        
        <div class="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none" aria-describedby="profile-dialog-desc">
          
          <div class="flex items-center justify-between pb-3">
            <span class="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <SvgIcon name="ShieldCheck" class="size-4" />
              Coworker Profile
            </span>
            
              <button type="button" onclick={() => onOpenChange(false)} class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Close profile">
                <SvgIcon name="X" class="size-4" />
              </button>
            
          </div>

          <div id="profile-dialog-desc" class="sr-only">
            Coworker details including name, title, department, and presence status.
          </div>

          
          <div class="flex flex-col items-center pt-2 pb-4 text-center">
            
            <div class="relative mb-3">
              <div class={cn(
                  "flex size-20 items-center justify-center rounded-full border-2 text-xl font-bold tracking-wide shadow-sm",
                  colorClass
                )}>
                {initials}
              </div>
              <span class={cn(
                  "absolute bottom-0.5 right-0.5 size-4 rounded-full border-2 border-white shadow-xs",
                  presenceStatus === "online" && "bg-emerald-500",
                  presenceStatus === "away" && "bg-amber-500",
                  presenceStatus === "offline" && "bg-slate-400"
                )} title={presenceText}></span>
            </div>

            
            <h2 class="text-lg font-bold text-slate-900">
              {profile.displayName}
            </h2>

            
            <div class="mt-1 flex items-center gap-1.5">
              <span class={cn(
                  "size-2 rounded-full",
                  presenceStatus === "online" && "bg-emerald-500 animate-pulse",
                  presenceStatus === "away" && "bg-amber-500",
                  presenceStatus === "offline" && "bg-slate-400"
                )}></span>
              <span class="text-xs font-medium text-slate-600">
                {presenceText}
              </span>
            </div>
          </div>

          
          <div class="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs">
            <div class="flex items-center gap-2.5 text-slate-700">
              <SvgIcon name="Briefcase" class="size-4 shrink-0 text-slate-400" />
              <div class="min-w-0 flex-1 text-left">
                <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Job Title / Designation
                </span>
                <span class="font-medium text-slate-800">
                  {profile.designationTitle || "Team Member"}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2.5 text-slate-700">
              <SvgIcon name="Building2" class="size-4 shrink-0 text-slate-400" />
              <div class="min-w-0 flex-1 text-left">
                <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Department
                </span>
                <span class="font-medium text-slate-800">
                  {profile.departmentName || "General Staff"}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2.5 text-slate-700">
              <SvgIcon name="Clock" class="size-4 shrink-0 text-slate-400" />
              <div class="min-w-0 flex-1 text-left">
                <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Status
                </span>
                <span class="font-medium text-slate-800">
                  {presenceText}
                </span>
              </div>
            </div>
          </div>

          
          <div class="mt-5 flex justify-end">
            <Button type="button" variant="outline" size="sm" onclick={() => onOpenChange(false)} class="text-xs">
              Close
            </Button>
          </div>
        </div>
      
    </DialogFrame>{/if}
