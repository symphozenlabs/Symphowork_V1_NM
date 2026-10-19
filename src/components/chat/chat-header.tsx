"use client";

import React from "react";
import { ArrowLeft, Users, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConversationItem } from "./types";
import { formatPresenceStatus, getAvatarColorClass, getInitials } from "./utils";
import type { ProfileDetails } from "./chat-profile-modal";

interface ChatHeaderProps {
  conversation: ConversationItem | null;
  onBack?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onOpenProfile?: (profile: ProfileDetails) => void;
  onOpenGlobalSearch?: () => void;
}

export function ChatHeader({
  conversation,
  onBack,
  onRefresh,
  refreshing = false,
  onOpenProfile,
  onOpenGlobalSearch,
}: ChatHeaderProps) {
  if (!conversation) return null;

  const isGroup = conversation.conversation.type === "group";
  const title = isGroup
    ? conversation.conversation.name || "Group Channel"
    : conversation.recipient?.displayName ||
      conversation.employee.displayName ||
      "Direct Chat";

  const initials = getInitials(title);
  const colorClass = getAvatarColorClass(title);

  // Derive presence and subtitle
  const presence = conversation.recipient?.presence ?? null;
  const presenceText = !isGroup ? formatPresenceStatus(presence) : null;
  const presenceStatus = !isGroup ? presence?.status ?? "offline" : null;

  const memberCount = conversation.conversation.memberCount ?? 1;
  const subtitle = isGroup
    ? `${memberCount} member${memberCount === 1 ? "" : "s"} • Team Channel`
    : [
        conversation.recipient?.designationTitle,
        conversation.recipient?.departmentName,
      ]
        .filter(Boolean)
        .join(" • ") || "Direct Message";

  const handleProfileClick = () => {
    if (!isGroup && onOpenProfile && conversation.recipient) {
      onOpenProfile({
        id: conversation.recipient.id,
        displayName: conversation.recipient.displayName,
        departmentName: conversation.recipient.departmentName,
        designationTitle: conversation.recipient.designationTitle,
        presence: conversation.recipient.presence,
      });
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Back Button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-slate-100 hover:text-foreground md:hidden transition-colors"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}

        {/* Avatar with Presence (clickable in direct chat) */}
        <div
          className={cn("relative shrink-0", !isGroup && onOpenProfile && "cursor-pointer group")}
          onClick={handleProfileClick}
          title={!isGroup ? `View ${title}'s profile` : undefined}
        >
          {isGroup ? (
            <div className="flex size-10 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-primary shadow-2xs">
              <Users className="size-5" aria-hidden="true" />
            </div>
          ) : (
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full border font-semibold text-xs tracking-wide shadow-2xs group-hover:ring-2 group-hover:ring-primary/40 transition-all",
                colorClass
              )}
            >
              {initials}
            </div>
          )}

          {/* Presence Indicator dot */}
          {!isGroup && presenceStatus && (
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white shadow-2xs",
                presenceStatus === "online" && "bg-emerald-500",
                presenceStatus === "away" && "bg-amber-500",
                presenceStatus === "offline" && "bg-slate-300"
              )}
              title={presenceText ?? undefined}
            />
          )}
        </div>

        {/* Title, Subtitle & Presence Badge */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleProfileClick}
              disabled={isGroup || !onOpenProfile}
              className={cn(
                "truncate text-sm font-bold tracking-tight text-foreground text-left",
                !isGroup && onOpenProfile && "hover:underline cursor-pointer"
              )}
            >
              {title}
            </button>
            {isGroup && (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                Group
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="truncate text-muted">{subtitle}</span>
            {!isGroup && presenceText && (
              <>
                <span className="text-muted/60" aria-hidden="true">•</span>
                <span
                  className={cn(
                    "shrink-0 font-medium",
                    presenceStatus === "online" && "text-emerald-600 font-semibold",
                    presenceStatus === "away" && "text-amber-600",
                    presenceStatus === "offline" && "text-muted"
                  )}
                >
                  {presenceText}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">
        {onOpenGlobalSearch && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenGlobalSearch}
            className="size-8 p-0 text-muted hover:text-foreground"
            title="Search messages (Ctrl+K)"
            aria-label="Search messages"
          >
            <Search className="size-4" />
          </Button>
        )}

        {onRefresh && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="size-8 p-0 text-muted hover:text-foreground"
            title="Refresh messages"
            aria-label="Refresh messages"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </Button>
        )}
      </div>
    </header>
  );
}
