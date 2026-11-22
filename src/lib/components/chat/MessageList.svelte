<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import MessageBubble from "$lib/components/chat/MessageBubble.svelte";
import type { MessageItem, ProfileDetails } from "$lib/components/chat/types";
import { formatDateDivider } from "$lib/components/chat/utils";

interface MessageListProps {
  messages: MessageItem[];
  currentEmployeeId: string;
  isGroup: boolean;
  loadingOlder: boolean;
  hasMoreOlder: boolean;
  typers?: string[];
  unreadDividerMessageId?: string | null;
  onLoadOlder: () => void;
  onConvertToTask: (message: MessageItem) => void;
  onRetrySend?: (message: MessageItem) => void;
  onOpenProfile?: (profile: ProfileDetails) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}

let { messages, currentEmployeeId, isGroup, loadingOlder, hasMoreOlder, typers = [], unreadDividerMessageId, onLoadOlder, onConvertToTask, onRetrySend, onOpenProfile, onToggleReaction }: MessageListProps = $props();
let scrollContainerRef: HTMLDivElement | undefined = $state();
let bottomRef: HTMLDivElement | undefined = $state();
let prevMessagesLength = $state(0);
const typingLabel = $derived(typers.length === 1 ? `${typers[0]} is typing…` : typers.length === 2 ? `${typers[0]} and ${typers[1]} are typing…` : typers.length > 2 ? 'Several colleagues are typing…' : '');
const groupedMessages = $derived.by(() => {
  const groups: Array<{ dateHeader: string; items: MessageItem[] }> = [];
  let currentDateHeader = '';
  for (const message of messages) {
    const header = formatDateDivider(message.createdAt);
    if (header !== currentDateHeader) {
      currentDateHeader = header;
      groups.push({ dateHeader: header, items: [message] });
    } else groups[groups.length - 1].items.push(message);
  }
  return groups;
});
$effect(() => {
  const messageCount = messages.length;
  const isLoadingOlder = loadingOlder;
  if (!isLoadingOlder && messageCount > prevMessagesLength) {
    bottomRef?.scrollIntoView({ behavior: prevMessagesLength === 0 ? 'auto' : 'smooth' });
  }
  prevMessagesLength = messageCount;
});
</script>
{#if messages.length === 0}<div class="flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/40">
        <div class="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
          <SvgIcon name="MessageSquare" class="size-7" />
        </div>
        <h4 class="text-sm font-bold text-foreground">
          No messages yet
        </h4>
        <p class="mt-1 max-w-xs text-xs text-muted leading-relaxed">
          Start the conversation by sending a message below.
        </p>
      </div>{:else}<div bind:this={scrollContainerRef} class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30" role="log" aria-live="polite">
      
      {#if hasMoreOlder}<div class="flex justify-center pb-2">
          <Button type="button" variant="outline" size="sm" onclick={onLoadOlder} disabled={loadingOlder} class="h-8 gap-1.5 px-3 text-xs font-semibold text-slate-700 bg-white shadow-2xs hover:bg-slate-50">
            {#if loadingOlder}
                <SvgIcon name="Loader2" class="size-3.5 animate-spin" />
                <span>Loading older messages…</span>
              {:else}
                <SvgIcon name="ArrowUp" class="size-3.5" />
                <span>Load older messages</span>
              {/if}
          </Button>
        </div>{/if}

      
      {#each groupedMessages as group}<div class="space-y-3">
          
          <div class="relative flex items-center justify-center my-3">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200/80"></div>
            </div>
            <span class="relative rounded-full bg-slate-100 border border-slate-200/90 px-3 py-0.5 text-[11px] font-semibold text-slate-600 shadow-2xs">
              {group.dateHeader}
            </span>
          </div>

          
          <div class="space-y-2">
            {#each group.items as message}{@const isOutgoing = Boolean(currentEmployeeId) &&
                message.senderEmployeeId === currentEmployeeId}{@const isFirstUnread = unreadDividerMessageId === message.id}
                  
                  {#if isFirstUnread}<div class="relative flex items-center justify-center my-3.5">
                      <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-primary/40"></div>
                      </div>
                      <span class="relative rounded-full bg-primary/10 border border-primary/30 px-3 py-0.5 text-[11px] font-bold text-primary shadow-2xs">
                        New Messages
                      </span>
                    </div>{/if}

                  <MessageBubble message={message} isOutgoing={isOutgoing} isGroup={isGroup} onConvertToTask={onConvertToTask} onRetrySend={onRetrySend} onOpenProfile={onOpenProfile} onToggleReaction={onToggleReaction} />
                {/each}
          </div>
        </div>{/each}

      
      {#if typers.length > 0}<div class="flex items-center gap-2 pt-1 pb-2">
          <div class="flex items-center gap-1.5 rounded-full bg-slate-200/80 px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
            <div class="flex items-center gap-1">
              <span class="size-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]"></span>
              <span class="size-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]"></span>
              <span class="size-1.5 rounded-full bg-slate-500 animate-bounce"></span>
            </div>
            <span class="text-[11px] font-medium ml-1">{typingLabel}</span>
          </div>
        </div>{/if}

      
      <div bind:this={bottomRef} class="h-0"></div>
    </div>{/if}

