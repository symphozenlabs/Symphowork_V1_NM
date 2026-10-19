"use client";

import React, { useEffect, useRef } from "react";
import { Loader2, MessageSquare, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MessageItem } from "./types";
import { formatDateDivider } from "./utils";
import { MessageBubble } from "./message-bubble";
import type { ProfileDetails } from "./chat-profile-modal";

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

export function MessageList({
  messages,
  currentEmployeeId,
  isGroup,
  loadingOlder,
  hasMoreOlder,
  typers = [],
  unreadDividerMessageId,
  onLoadOlder,
  onConvertToTask,
  onRetrySend,
  onOpenProfile,
  onToggleReaction,
}: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive (and not loading older)
  useEffect(() => {
    if (!loadingOlder && messages.length > prevMessagesLength.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (prevMessagesLength.current === 0 && messages.length > 0) {
      // First load: instant scroll to bottom
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, loadingOlder]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/40">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
          <MessageSquare className="size-7" />
        </div>
        <h4 className="text-sm font-bold text-foreground">
          No messages yet
        </h4>
        <p className="mt-1 max-w-xs text-xs text-muted leading-relaxed">
          Start the conversation by sending a message below.
        </p>
      </div>
    );
  }

  // Format typing indicator text
  let typingLabel = "";
  if (typers.length === 1) {
    typingLabel = `${typers[0]} is typing…`;
  } else if (typers.length === 2) {
    typingLabel = `${typers[0]} and ${typers[1]} are typing…`;
  } else if (typers.length > 2) {
    typingLabel = "Several colleagues are typing…";
  }

  // Group messages by day
  const groupedMessages: Array<{ dateHeader: string; items: MessageItem[] }> = [];
  let currentDateHeader = "";

  for (const message of messages) {
    const header = formatDateDivider(message.createdAt);
    if (header !== currentDateHeader) {
      currentDateHeader = header;
      groupedMessages.push({ dateHeader: header, items: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].items.push(message);
    }
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30"
      role="log"
      aria-live="polite"
    >
      {/* Load Older Messages Button */}
      {hasMoreOlder && (
        <div className="flex justify-center pb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadOlder}
            disabled={loadingOlder}
            className="h-8 gap-1.5 px-3 text-xs font-semibold text-slate-700 bg-white shadow-2xs hover:bg-slate-50"
          >
            {loadingOlder ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Loading older messages…</span>
              </>
            ) : (
              <>
                <ArrowUp className="size-3.5" />
                <span>Load older messages</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Message Groups with Date Dividers */}
      {groupedMessages.map((group) => (
        <div key={group.dateHeader} className="space-y-3">
          {/* Date Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80" />
            </div>
            <span className="relative rounded-full bg-slate-100 border border-slate-200/90 px-3 py-0.5 text-[11px] font-semibold text-slate-600 shadow-2xs">
              {group.dateHeader}
            </span>
          </div>

          {/* Group Messages */}
          <div className="space-y-2">
            {group.items.map((message) => {
              const isOutgoing =
                Boolean(currentEmployeeId) &&
                message.senderEmployeeId === currentEmployeeId;

              const isFirstUnread = unreadDividerMessageId === message.id;

              return (
                <React.Fragment key={message.id}>
                  {/* Unread / New Messages Divider */}
                  {isFirstUnread && (
                    <div className="relative flex items-center justify-center my-3.5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-primary/40" />
                      </div>
                      <span className="relative rounded-full bg-primary/10 border border-primary/30 px-3 py-0.5 text-[11px] font-bold text-primary shadow-2xs">
                        New Messages
                      </span>
                    </div>
                  )}

                  <MessageBubble
                    message={message}
                    isOutgoing={isOutgoing}
                    isGroup={isGroup}
                    onConvertToTask={onConvertToTask}
                    onRetrySend={onRetrySend}
                    onOpenProfile={onOpenProfile}
                    onToggleReaction={onToggleReaction}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}

      {/* Ephemeral Typing Indicator Bubble at bottom */}
      {typers.length > 0 && (
        <div className="flex items-center gap-2 pt-1 pb-2">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-200/80 px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="size-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="size-1.5 rounded-full bg-slate-500 animate-bounce" />
            </div>
            <span className="text-[11px] font-medium ml-1">{typingLabel}</span>
          </div>
        </div>
      )}

      {/* Bottom anchor for scrolling */}
      <div ref={bottomRef} className="h-0" />
    </div>
  );
}
