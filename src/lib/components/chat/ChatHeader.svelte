<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface ChatHeaderProps {
  conversation: ConversationItem | null;
  onBack?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onOpenProfile?: (profile: ProfileDetails) => void;
  onOpenGlobalSearch?: () => void;
}
let {
  conversation,
  onBack,
  onRefresh,
  refreshing = false,
  onOpenProfile,
  onOpenGlobalSearch,
}:ChatHeaderProps=$props();
const isGroup=$derived(conversation!.conversation.type === "group");
const title=$derived(isGroup
    ? conversation!.conversation.name || "Group Channel"
    : conversation!.recipient?.displayName ||
      conversation!.employee.displayName ||
      "Direct Chat");
const initials=$derived(getInitials(title));
const colorClass=$derived(getAvatarColorClass(title));
const presence=$derived(conversation!.recipient?.presence ?? null);
const presenceText=$derived(!isGroup ? formatPresenceStatus(presence) : null);
const presenceStatus=$derived(!isGroup ? presence?.status ?? "offline" : null);
const memberCount=$derived(conversation!.conversation.memberCount ?? 1);
const subtitle=$derived(isGroup
    ? `${memberCount} member${memberCount === 1 ? "" : "s"} • Team Channel`
    : [
        conversation!.recipient?.designationTitle,
        conversation!.recipient?.departmentName,
      ]
        .filter(Boolean)
        .join(" • ") || "Direct Message");
const handleProfileClick = () => {
    if (!isGroup && onOpenProfile && conversation?.recipient) {
      onOpenProfile({
        id: conversation.recipient.id,
        displayName: conversation.recipient.displayName,
        departmentName: conversation.recipient.departmentName,
        designationTitle: conversation.recipient.designationTitle,
        presence: conversation.recipient.presence,
      });
    }
  };

import { cn } from '$lib/utils';
import type { ProfileDetails, ConversationItem } from '$lib/components/chat/types';
import { formatPresenceStatus, getAvatarColorClass, getInitials } from '$lib/components/chat/utils';</script>
{#if !conversation}{:else}<header class="flex items-center justify-between border-b border-border bg-surface px-4 py-3 shadow-2xs">
      <div class="flex items-center gap-3 min-w-0">
        
        {#if onBack}<button type="button" onclick={onBack} class="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-slate-100 hover:text-foreground md:hidden transition-colors" aria-label="Back to conversations">
            <SvgIcon name="ArrowLeft" class="size-5" />
          </button>{/if}

        
        <button type="button" disabled={isGroup || !onOpenProfile} aria-label={!isGroup ? `View ${title}'s profile` : undefined} class={cn("relative shrink-0 border-0 bg-transparent p-0", !isGroup && onOpenProfile && "cursor-pointer group")} onclick={handleProfileClick} title={!isGroup ? `View ${title}'s profile` : undefined}>
          {#if isGroup}<div class="flex size-10 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-primary shadow-2xs">
              <SvgIcon name="Users" class="size-5" aria-hidden="true" />
            </div>{:else}<div class={cn(
                "flex size-10 items-center justify-center rounded-full border font-semibold text-xs tracking-wide shadow-2xs group-hover:ring-2 group-hover:ring-primary/40 transition-all",
                colorClass
              )}>
              {initials}
            </div>{/if}

          
          {#if !isGroup && presenceStatus}<span class={cn(
                "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white shadow-2xs",
                presenceStatus === "online" && "bg-emerald-500",
                presenceStatus === "away" && "bg-amber-500",
                presenceStatus === "offline" && "bg-slate-300"
              )} title={presenceText ?? undefined}></span>{/if}
        </button>

        
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <button type="button" onclick={handleProfileClick} disabled={isGroup || !onOpenProfile} class={cn(
                "truncate text-sm font-bold tracking-tight text-foreground text-left",
                !isGroup && onOpenProfile && "hover:underline cursor-pointer"
              )}>
              {title}
            </button>
            {#if isGroup}<span class="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                Group
              </span>{/if}
          </div>

          <div class="flex items-center gap-2 text-xs">
            <span class="truncate text-muted">{subtitle}</span>
            {#if !isGroup && presenceText}
                <span class="text-muted/60" aria-hidden="true">•</span>
                <span class={cn(
                    "shrink-0 font-medium",
                    presenceStatus === "online" && "text-emerald-600 font-semibold",
                    presenceStatus === "away" && "text-amber-600",
                    presenceStatus === "offline" && "text-muted"
                  )}>
                  {presenceText}
                </span>
              {/if}
          </div>
        </div>
      </div>

      
      <div class="flex items-center gap-1.5">
        {#if onOpenGlobalSearch}<Button type="button" variant="ghost" size="sm" onclick={onOpenGlobalSearch} class="size-8 p-0 text-muted hover:text-foreground" title="Search messages (Ctrl+K)" aria-label="Search messages">
            <SvgIcon name="Search" class="size-4" />
          </Button>{/if}

        {#if onRefresh}<Button type="button" variant="ghost" size="sm" onclick={onRefresh} disabled={refreshing} class="size-8 p-0 text-muted hover:text-foreground" title="Refresh messages" aria-label="Refresh messages">
            <SvgIcon name="RefreshCw" class={cn("size-4", refreshing && "animate-spin")} />
          </Button>{/if}
      </div>
    </header>{/if}
