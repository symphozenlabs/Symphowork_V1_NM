<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import Input from "$lib/components/ui/Input.svelte";
import ConversationListItem from "$lib/components/chat/ConversationListItem.svelte";
import type { ConversationItem, ConversationType } from "$lib/components/chat/types";
import { cn } from "$lib/utils";
import { getAvatarColorClass, getInitials } from "$lib/components/chat/utils";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface ConversationSidebarProps {
  conversations: ConversationItem[];
  selectedConversationId: string | null;
  loading: boolean;
  currentEmployeeId?: string;
  onSelectConversation: (id: string) => void;
  onOpenNewDirect: () => void;
  onOpenNewGroup: () => void;
  onOpenGlobalSearch?: () => void;
}
let {
  conversations,
  selectedConversationId,
  loading,
  currentEmployeeId,
  onSelectConversation,
  onOpenNewDirect,
  onOpenNewGroup,
  onOpenGlobalSearch,
}:ConversationSidebarProps=$props();
let searchQuery=$state(untrack(()=>("")));
const setSearchQuery=(next:typeof searchQuery|((previous:typeof searchQuery)=>typeof searchQuery))=>{searchQuery=typeof next==="function"?(next as (previous:typeof searchQuery)=>typeof searchQuery)(searchQuery):next;};
let filterType=$state<"all" | ConversationType>(untrack(()=>("all")));
const setFilterType=(next:typeof filterType|((previous:typeof filterType)=>typeof filterType))=>{filterType=typeof next==="function"?(next as (previous:typeof filterType)=>typeof filterType)(filterType):next;};
const filteredConversations=$derived.by(() => {
    // 1. Sort by latest message createdAt, fallback to conversation updatedAt
    const sorted = [...conversations].sort((a, b) => {
      const timeA = new Date(a.lastMessage?.createdAt || a.conversation.updatedAt).getTime();
      const timeB = new Date(b.lastMessage?.createdAt || b.conversation.updatedAt).getTime();
      return timeB - timeA;
    });

    return sorted.filter((item) => {
      // 2. Type filter
      if (filterType !== "all" && item.conversation.type !== filterType) {
        return false;
      }

      // 3. Search query filter
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const groupName = item.conversation.name?.toLowerCase() ?? "";
      const recipientName = item.recipient?.displayName?.toLowerCase() ?? "";
      const employeeName = item.employee?.displayName?.toLowerCase() ?? "";
      const dept = item.recipient?.departmentName?.toLowerCase() ?? "";
      const designation = item.recipient?.designationTitle?.toLowerCase() ?? "";
      const lastMsgContent = item.lastMessage?.content?.toLowerCase() ?? "";

      return (
        groupName.includes(q) ||
        recipientName.includes(q) ||
        employeeName.includes(q) ||
        dept.includes(q) ||
        designation.includes(q) ||
        lastMsgContent.includes(q)
      );
    });
  });
const totalUnreadCount=$derived.by(() => {
    return conversations.reduce((sum, item) => sum + (item.unreadCount ?? 0), 0);
  });
</script>
<aside class="flex h-full flex-col border-r border-border bg-surface/50">
      
      <div class="border-b border-border/80 p-4 space-y-3 bg-surface">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <h2 class="text-base font-bold tracking-tight text-foreground">
              Messages
            </h2>
            {#if totalUnreadCount > 0}<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white shadow-xs">
                {#if totalUnreadCount > 99}{"99+"}{:else}{totalUnreadCount}{/if}
              </span>{/if}
          </div>

          <div class="flex items-center gap-1.5">
            <Button type="button" variant="outline" size="sm" onclick={onOpenNewDirect} class="h-8 gap-1.5 px-2.5 text-xs font-semibold text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40" title="Start a new direct chat">
              <SvgIcon name="UserPlus" class="size-3.5" />
              <span>New Chat</span>
            </Button>

            <Button type="button" variant="outline" size="sm" onclick={onOpenNewGroup} class="h-8 gap-1.5 px-2.5 text-xs font-semibold text-slate-700 border-border hover:bg-slate-100" title="Create a new group channel">
              <SvgIcon name="Users" class="size-3.5" />
              <span>New Group</span>
            </Button>
          </div>
        </div>

        
        <div class="flex items-center gap-1.5">
          <div class="relative flex-1">
            <SvgIcon name="Search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <Input type="text" placeholder="Search conversations…" value={searchQuery} oninput={(e) => setSearchQuery(e.currentTarget.value)} class="h-9 pl-9 pr-8 text-xs bg-slate-50/80 border-slate-200/80 focus:bg-white transition-all" aria-label="Search conversations" />
            {#if searchQuery}<button type="button" onclick={() => setSearchQuery("")} class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted hover:text-foreground hover:bg-slate-200/60 transition-colors" aria-label="Clear filter">
                <SvgIcon name="X" class="size-3.5" />
              </button>{/if}
          </div>
          {#if onOpenGlobalSearch}<Button type="button" variant="outline" size="sm" onclick={onOpenGlobalSearch} class="h-9 px-2.5 text-xs text-slate-600 border-border hover:bg-slate-100 hover:text-primary shrink-0" title="Search all messages (Ctrl+K)" aria-label="Search all messages">
              <SvgIcon name="Search" class="size-3.5 mr-1" />
              <span class="hidden sm:inline">Search all</span>
            </Button>{/if}
        </div>

        
        <div class="flex items-center gap-1.5 pt-0.5" role="tablist" aria-label="Conversation filters">
          <button type="button" role="tab" aria-selected={filterType === "all"} onclick={() => setFilterType("all")} class={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
              filterType === "all"
                ? "bg-primary text-white font-semibold shadow-2xs"
                : "text-muted hover:bg-slate-100 hover:text-foreground"
            )}>
            All ({conversations.length})
          </button>

          <button type="button" role="tab" aria-selected={filterType === "direct"} onclick={() => setFilterType("direct")} class={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
              filterType === "direct"
                ? "bg-primary text-white font-semibold shadow-2xs"
                : "text-muted hover:bg-slate-100 hover:text-foreground"
            )}>
            Direct
          </button>

          <button type="button" role="tab" aria-selected={filterType === "group"} onclick={() => setFilterType("group")} class={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
              filterType === "group"
                ? "bg-primary text-white font-semibold shadow-2xs"
                : "text-muted hover:bg-slate-100 hover:text-foreground"
            )}>
            Groups
          </button>
        </div>
      </div>

      
      <div class="flex-1 overflow-y-auto p-2 space-y-1" role="list">
        {#if loading}<div class="p-4 space-y-3">
            {#each [1, 2, 3, 4, 5] as i}<div class="flex items-center gap-3 animate-pulse p-2">
                <div class="size-11 rounded-full bg-slate-200"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3.5 w-3/4 rounded bg-slate-200"></div>
                  <div class="h-3 w-1/2 rounded bg-slate-100"></div>
                </div>
              </div>{/each}
          </div>{:else}{#if filteredConversations.length === 0}<div class="p-6 text-center space-y-3">
            <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <SvgIcon name="MessageSquarePlus" class="size-6" />
            </div>
            <div>
              <p class="text-sm font-semibold text-foreground">
                {#if searchQuery}{"No conversations match your search"}{:else}{"No conversations yet"}{/if}
              </p>
              <p class="mt-1 text-xs text-muted max-w-[220px] mx-auto leading-relaxed">
                {#if searchQuery}{"Try searching for a coworker by name, title, or department."}{:else}{"Start a direct message with a colleague or create a team group."}{/if}
              </p>
            </div>
            {#if !searchQuery}<Button type="button" variant="primary" size="sm" onclick={onOpenNewDirect} class="mt-2 text-xs">
                Start a Conversation
              </Button>{/if}
          </div>{:else}{#each filteredConversations as item}<ConversationListItem item={item} isSelected={item.conversation.id === selectedConversationId} currentEmployeeId={currentEmployeeId} onClick={() => onSelectConversation(item.conversation.id)} />{/each}{/if}{/if}
      </div>
    </aside>
