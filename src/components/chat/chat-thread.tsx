"use client";

import React from "react";
import { MessageSquare, ShieldCheck, Zap } from "lucide-react";
import type { ConversationItem, MessageItem } from "./types";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatInputBar } from "./chat-input-bar";
import type { ProfileDetails } from "./chat-profile-modal";

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

export function ChatThread({
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
}: ChatThreadProps) {
  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-slate-50/50">
        <div className="relative mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
          <MessageSquare className="size-8" />
        </div>
        <h3 className="text-base font-bold text-foreground">
          Select a Conversation
        </h3>
        <p className="mt-1 max-w-sm text-xs text-muted leading-relaxed">
          Choose a direct or group conversation from the left to read messages, collaborate with coworkers, and coordinate operational tasks.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="size-4 text-primary" />
            Tenant Isolated
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Zap className="size-4 text-primary" />
            Instant Task Conversion
          </span>
        </div>
      </div>
    );
  }

  const isGroup = conversation.conversation.type === "group";

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Thread Header */}
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onOpenProfile={onOpenProfile}
        onOpenGlobalSearch={onOpenGlobalSearch}
      />

      {/* Message List */}
      {loadingMessages ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs text-muted font-medium">
              Loading message history…
            </span>
          </div>
        </div>
      ) : (
        <MessageList
          messages={messages}
          currentEmployeeId={currentEmployeeId}
          isGroup={isGroup}
          loadingOlder={loadingOlder}
          hasMoreOlder={hasMoreOlder}
          typers={typers}
          unreadDividerMessageId={unreadDividerMessageId}
          onLoadOlder={onLoadOlder}
          onConvertToTask={onConvertToTask}
          onRetrySend={onRetrySend}
          onOpenProfile={onOpenProfile}
          onToggleReaction={onToggleReaction}
        />
      )}

      {/* Input Bar */}
      <ChatInputBar
        onSendMessage={onSendMessage}
        onSendAttachment={onSendAttachment}
        onTyping={onTyping}
        sending={sending}
        disabled={loadingMessages}
      />
    </div>
  );
}
