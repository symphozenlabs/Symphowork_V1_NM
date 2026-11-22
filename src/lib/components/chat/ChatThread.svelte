<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import ChatHeader from "$lib/components/chat/ChatHeader.svelte";
import MessageList from "$lib/components/chat/MessageList.svelte";
import ChatInputBar from "$lib/components/chat/ChatInputBar.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface ChatThreadProps {
  conversation: ConversationItem | null;
  messages: MessageItem[];
  currentEmployeeId: string;
  loadingMessages: boolean;
  loadingOlder: boolean;
  hasMoreOlder: boolean;
  sending: boolean;
  refreshing: boolean;
  typers?: string[];
  unreadDividerMessageId?: string | null;
  onBack?: () => void;
  onRefresh?: () => void;
  onLoadOlder: () => void;
  onSendMessage: (content: string) => Promise<void>;
  onSendAttachment?: (file: File, caption?: string) => Promise<void>;
  onConvertToTask: (message: MessageItem) => void;
  onTyping?: (isTyping: boolean) => void;
  onRetrySend?: (message: MessageItem) => void;
  onOpenProfile?: (profile: ProfileDetails) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onOpenGlobalSearch?: () => void;
}
let {
  conversation,
  messages,
  currentEmployeeId,
  loadingMessages,
  loadingOlder,
  hasMoreOlder,
  sending,
  refreshing,
  typers = [],
  unreadDividerMessageId,
  onBack,
  onRefresh,
  onLoadOlder,
  onSendMessage,
  onSendAttachment,
  onConvertToTask,
  onTyping,
  onRetrySend,
  onOpenProfile,
  onToggleReaction,
  onOpenGlobalSearch,
}:ChatThreadProps=$props();
const isGroup=$derived(conversation!.conversation.type === "group");

import type { MessageItem, ProfileDetails, ConversationItem } from '$lib/components/chat/types';</script>
{#if !conversation}<div class="flex h-full flex-col items-center justify-center p-8 text-center bg-slate-50/50">
        <div class="relative mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
          <SvgIcon name="MessageSquare" class="size-8" />
        </div>
        <h3 class="text-base font-bold text-foreground">
          Select a Conversation
        </h3>
        <p class="mt-1 max-w-sm text-xs text-muted leading-relaxed">
          Choose a direct or group conversation from the left to read messages, collaborate with coworkers, and coordinate operational tasks.
        </p>

        <div class="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
          <span class="flex items-center gap-1.5 font-medium">
            <SvgIcon name="ShieldCheck" class="size-4 text-primary" />
            Tenant Isolated
          </span>
          <span class="flex items-center gap-1.5 font-medium">
            <SvgIcon name="Zap" class="size-4 text-primary" />
            Instant Task Conversion
          </span>
        </div>
      </div>{:else}<div class="flex h-full flex-col bg-surface">
      
      <ChatHeader conversation={conversation} onBack={onBack} onRefresh={onRefresh} refreshing={refreshing} onOpenProfile={onOpenProfile} onOpenGlobalSearch={onOpenGlobalSearch} />

      
      {#if loadingMessages}<div class="flex flex-1 items-center justify-center p-8">
          <div class="flex flex-col items-center gap-2">
            <div class="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span class="text-xs text-muted font-medium">
              Loading message history…
            </span>
          </div>
        </div>{:else}<MessageList messages={messages} currentEmployeeId={currentEmployeeId} isGroup={isGroup} loadingOlder={loadingOlder} hasMoreOlder={hasMoreOlder} typers={typers} unreadDividerMessageId={unreadDividerMessageId} onLoadOlder={onLoadOlder} onConvertToTask={onConvertToTask} onRetrySend={onRetrySend} onOpenProfile={onOpenProfile} onToggleReaction={onToggleReaction} />{/if}

      
      <ChatInputBar onSendMessage={onSendMessage} onSendAttachment={onSendAttachment} onTyping={onTyping} sending={sending} disabled={loadingMessages} />
    </div>{/if}
