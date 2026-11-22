<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import type { ConversationItem } from "$lib/components/chat/types";
import { formatConversationTime, getAvatarColorClass, getInitials } from "$lib/components/chat/utils";
import { cn } from '$lib/utils';
interface ConversationListItemProps { item: ConversationItem; isSelected: boolean; currentEmployeeId?: string; onClick: () => void }
let { item, isSelected, currentEmployeeId, onClick }: ConversationListItemProps = $props();
const isGroup = $derived(item.conversation.type === 'group');
const title = $derived(isGroup ? item.conversation.name || 'Unnamed Group' : item.recipient?.displayName || item.employee.displayName || 'Direct Chat');
const presenceStatus = $derived(!isGroup ? item.recipient?.presence?.status ?? 'offline' : null);
const subtitle = $derived.by(() => {
  if (item.lastMessage?.content) {
    const isMe = currentEmployeeId && item.lastMessage.senderEmployeeId === currentEmployeeId;
    if (isMe) return `You: ${item.lastMessage.content}`;
    if (isGroup && item.lastMessage.senderDisplayName) return `${item.lastMessage.senderDisplayName}: ${item.lastMessage.content}`;
    return item.lastMessage.content;
  }
  if (isGroup) { const count = item.conversation.memberCount ?? 1; return `${count} member${count === 1 ? '' : 's'} • Team Channel`; }
  return [item.recipient?.designationTitle, item.recipient?.departmentName].filter(Boolean).join(' • ') || 'Direct message';
});
const latestTime = $derived(item.lastMessage?.createdAt || item.conversation.updatedAt);
const timeLabel = $derived(formatConversationTime(latestTime));
const initials = $derived(getInitials(title));
const colorClass = $derived(getAvatarColorClass(title));
const unreadCount = $derived(item.unreadCount ?? 0);
</script>
<button type="button" onclick={onClick} aria-current={isSelected ? "true" : undefined} data-selected={isSelected} class={cn(
        "group relative flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-150 outline-none",
        "hover:bg-slate-100/80 active:bg-slate-200/70",
        isSelected
          ? "bg-primary/10 border border-primary/20 shadow-xs"
          : "border border-transparent bg-transparent"
      )}>
      
      {#if isSelected}<span class="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-primary" aria-hidden="true"></span>{/if}

      
      <div class="relative shrink-0">
        {#if isGroup}<div class="flex size-11 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-primary shadow-2xs">
            <SvgIcon name="Users" class="size-5" aria-hidden="true" />
          </div>{:else}<div class={cn(
              "flex size-11 items-center justify-center rounded-full border font-semibold text-xs tracking-wide shadow-2xs",
              colorClass
            )}>
            {initials}
          </div>{/if}

        
        {#if isGroup}<span title="Group channel" class="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-white shadow-xs">
            <SvgIcon name="Users" class="size-2.5" />
          </span>{/if}

        
        {#if !isGroup && presenceStatus}<span title={`Status: ${presenceStatus}`} class={cn(
              "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white shadow-2xs",
              presenceStatus === "online" && "bg-emerald-500",
              presenceStatus === "away" && "bg-amber-500",
              presenceStatus === "offline" && "bg-slate-300"
            )}></span>{/if}
      </div>

      
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-1.5">
          <span class={cn(
              "truncate text-sm tracking-tight",
              unreadCount > 0 ? "font-bold text-slate-900" : isSelected ? "font-bold text-foreground" : "font-semibold text-slate-800"
            )}>
            {title}
          </span>
          <span class={cn(
              "shrink-0 text-[11px] font-medium",
              unreadCount > 0 ? "font-bold text-primary" : "text-muted"
            )}>
            {timeLabel}
          </span>
        </div>

        <div class="mt-0.5 flex items-center justify-between gap-2">
          <p class={cn(
              "truncate text-xs",
              unreadCount > 0 ? "font-semibold text-slate-900" : "text-muted"
            )}>
            {subtitle}
          </p>

          
          {#if unreadCount > 0}<span class="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white shadow-xs" aria-label={`${unreadCount} unread messages`}>
              {#if unreadCount > 99}{"99+"}{:else}{unreadCount}{/if}
            </span>{/if}
        </div>
      </div>
    </button>
