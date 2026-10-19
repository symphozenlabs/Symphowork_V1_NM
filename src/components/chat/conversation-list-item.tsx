"use client";

import React from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationItem } from "./types";
import { formatConversationTime, getAvatarColorClass, getInitials } from "./utils";

interface ConversationListItemProps {
  item: ConversationItem;
  isSelected: boolean;
  currentEmployeeId?: string;
  onClick: () => void;
}

export function ConversationListItem({
  item,
  isSelected,
  currentEmployeeId,
  onClick,
}: ConversationListItemProps) {
  const isGroup = item.conversation.type === "group";

  // Derive conversation title
  const title = isGroup
    ? item.conversation.name || "Unnamed Group"
    : item.recipient?.displayName || item.employee.displayName || "Direct Chat";

  // Presence status for direct chat
  const presenceStatus = !isGroup ? item.recipient?.presence?.status ?? "offline" : null;

  // Derive subtitle: message preview or title/department
  let subtitle = "";
  if (item.lastMessage?.content) {
    const isMe = currentEmployeeId && item.lastMessage.senderEmployeeId === currentEmployeeId;
    if (isMe) {
      subtitle = `You: ${item.lastMessage.content}`;
    } else if (isGroup && item.lastMessage.senderDisplayName) {
      subtitle = `${item.lastMessage.senderDisplayName}: ${item.lastMessage.content}`;
    } else {
      subtitle = item.lastMessage.content;
    }
  } else if (isGroup) {
    const count = item.conversation.memberCount ?? 1;
    subtitle = `${count} member${count === 1 ? "" : "s"} • Team Channel`;
  } else {
    subtitle =
      [item.recipient?.designationTitle, item.recipient?.departmentName]
        .filter(Boolean)
        .join(" • ") || "Direct message";
  }

  const latestTime = item.lastMessage?.createdAt || item.conversation.updatedAt;
  const timeLabel = formatConversationTime(latestTime);
  const initials = getInitials(title);
  const colorClass = getAvatarColorClass(title);
  const unreadCount = item.unreadCount ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isSelected ? "true" : undefined}
      data-selected={isSelected}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-150 outline-none",
        "hover:bg-slate-100/80 active:bg-slate-200/70",
        isSelected
          ? "bg-primary/10 border border-primary/20 shadow-xs"
          : "border border-transparent bg-transparent"
      )}
    >
      {/* Left Active Indicator Bar */}
      {isSelected && (
        <span
          className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-primary"
          aria-hidden="true"
        />
      )}

      {/* Avatar with Presence Indicator */}
      <div className="relative shrink-0">
        {isGroup ? (
          <div className="flex size-11 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-primary shadow-2xs">
            <Users className="size-5" aria-hidden="true" />
          </div>
        ) : (
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-full border font-semibold text-xs tracking-wide shadow-2xs",
              colorClass
            )}
          >
            {initials}
          </div>
        )}

        {/* Small badge for group channel */}
        {isGroup && (
          <span
            title="Group channel"
            className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-white shadow-xs"
          >
            <Users className="size-2.5" />
          </span>
        )}

        {/* Presence Indicator dot for direct chats */}
        {!isGroup && presenceStatus && (
          <span
            title={`Status: ${presenceStatus}`}
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white shadow-2xs",
              presenceStatus === "online" && "bg-emerald-500",
              presenceStatus === "away" && "bg-amber-500",
              presenceStatus === "offline" && "bg-slate-300"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <span
            className={cn(
              "truncate text-sm tracking-tight",
              unreadCount > 0 ? "font-bold text-slate-900" : isSelected ? "font-bold text-foreground" : "font-semibold text-slate-800"
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              "shrink-0 text-[11px] font-medium",
              unreadCount > 0 ? "font-bold text-primary" : "text-muted"
            )}
          >
            {timeLabel}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-xs",
              unreadCount > 0 ? "font-semibold text-slate-900" : "text-muted"
            )}
          >
            {subtitle}
          </p>

          {/* Unread Counter Badge */}
          {unreadCount > 0 && (
            <span
              className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white shadow-xs"
              aria-label={`${unreadCount} unread messages`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
