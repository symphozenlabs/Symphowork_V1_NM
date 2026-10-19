"use client";

import React, { useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageItem } from "./types";
import { formatMessageTime } from "./utils";
import type { ProfileDetails } from "./chat-profile-modal";
import { AudioPlayer } from "./audio-player";
import { ImageLightboxModal } from "./image-lightbox-modal";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

interface MessageBubbleProps {
  message: MessageItem;
  isOutgoing: boolean;
  isGroup: boolean;
  onConvertToTask: (message: MessageItem) => void;
  onRetrySend?: (message: MessageItem) => void;
  onOpenProfile?: (profile: ProfileDetails) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}

export function MessageBubble({
  message,
  isOutgoing,
  isGroup,
  onConvertToTask,
  onRetrySend,
  onOpenProfile,
  onToggleReaction,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // System messages rendered as center-aligned badges
  if (message.type === "system") {
    return (
      <div className="flex justify-center my-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 font-medium">
          {message.content}
        </span>
      </div>
    );
  }

  const timeLabel = formatMessageTime(message.createdAt);
  const isTaskReference = message.type === "task_reference";
  const status = message.deliveryStatus ?? (isOutgoing ? "sent" : null);
  const isFailed = status === "failed";
  const attachment = message.attachment;

  const handleProfileClick = () => {
    if (!isOutgoing && onOpenProfile && message.sender) {
      onOpenProfile({
        id: message.sender.id,
        displayName: message.sender.displayName,
        departmentName: message.sender.departmentName,
        designationTitle: message.sender.designationTitle,
      });
    }
  };

  const handleSelectReaction = (emoji: string) => {
    setShowReactionPicker(false);
    onToggleReaction?.(message.id, emoji);
  };

  const attachmentDownloadUrl = attachment
    ? `/api/app/chat/conversations/${message.conversationId}/attachments/${attachment.id}`
    : "";

  return (
    <>
      <div
        id={`msg-${message.id}`}
        className={cn(
          "group relative flex w-full transition-all duration-300",
          isOutgoing ? "justify-end" : "justify-start"
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          setShowActions(false);
          setShowReactionPicker(false);
        }}
      >
        <div
          className={cn(
            "relative max-w-[85%] sm:max-w-[70%] space-y-1",
            isOutgoing ? "items-end" : "items-start"
          )}
        >
          {/* Sender name in group conversations for incoming messages */}
          {!isOutgoing && isGroup && (
            <button
              type="button"
              onClick={handleProfileClick}
              className="block px-1 text-[11px] font-bold text-primary tracking-tight text-left hover:underline cursor-pointer"
            >
              {message.sender?.displayName || "Colleague"}
            </button>
          )}

          {/* Bubble Box */}
          <div
            className={cn(
              "relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-2xs transition-all",
              isOutgoing
                ? isFailed
                  ? "rounded-tr-xs bg-rose-50 text-rose-950 border border-rose-300"
                  : "rounded-tr-xs bg-primary text-primary-foreground"
                : "rounded-tl-xs bg-surface text-foreground border border-slate-200/90",
              isTaskReference && "ring-1 ring-accent/40"
            )}
          >
            {/* Converted Task Reference Badge */}
            {isTaskReference && (
              <div
                className={cn(
                  "mb-1.5 flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                  isOutgoing
                    ? "bg-white/20 text-white"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                )}
              >
                <CheckCircle2 className="size-3" />
                <span>Converted to Task</span>
              </div>
            )}

            {/* Attachment: Image */}
            {attachment && attachment.category === "image" && (
              <div
                className="overflow-hidden rounded-xl cursor-pointer mb-2 border border-black/10 shadow-xs"
                onClick={() => setShowLightbox(true)}
                title="Click to view full image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachmentDownloadUrl}
                  alt={attachment.fileName}
                  className="max-h-72 w-auto max-w-full rounded-xl object-contain hover:scale-[1.01] transition-transform"
                  loading="lazy"
                />
              </div>
            )}

            {/* Attachment: PDF Document */}
            {attachment && attachment.category === "document" && (
              <a
                href={attachmentDownloadUrl}
                download={attachment.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl border mb-2 transition-colors group/doc",
                  isOutgoing
                    ? "bg-white/15 border-white/20 hover:bg-white/25 text-white"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-foreground"
                )}
                title={`Download ${attachment.fileName}`}
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-rose-600 text-white shrink-0 shadow-xs">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate group-hover/doc:underline">
                    {attachment.fileName}
                  </p>
                  <p className="text-[10px] opacity-80">
                    {(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB • PDF Document
                  </p>
                </div>
                <Download className="size-4 opacity-75 group-hover/doc:opacity-100 shrink-0" />
              </a>
            )}

            {/* Attachment: Audio / Voice Message */}
            {attachment && attachment.category === "audio" && (
              <div className="mb-1">
                <AudioPlayer
                  src={attachmentDownloadUrl}
                  isOutgoing={isOutgoing}
                />
              </div>
            )}

            {/* Message Content / Caption */}
            {message.content && (
              <p className="whitespace-pre-wrap break-words text-sm font-normal">
                {message.content}
              </p>
            )}

            {/* Timestamp and Delivery Receipts Row */}
            <div
              className={cn(
                "mt-1 flex items-center justify-end gap-1 text-[10px]",
                isOutgoing
                  ? isFailed
                    ? "text-rose-600"
                    : "text-emerald-100/85"
                  : "text-muted"
              )}
            >
              <span>{timeLabel}</span>

              {/* Outgoing Delivery State Indicators */}
              {isOutgoing && (
                <span className="flex items-center ml-0.5" title={`Status: ${status}`}>
                  {status === "sending" && (
                    <Clock className="size-3 text-white/70 animate-pulse" />
                  )}
                  {status === "sent" && (
                    <Check className="size-3 text-white/80" />
                  )}
                  {status === "delivered" && (
                    <CheckCheck className="size-3.5 text-white/90" />
                  )}
                  {status === "read" && (
                    <CheckCheck className="size-3.5 text-sky-300 font-bold" />
                  )}
                  {isFailed && (
                    <AlertCircle className="size-3 text-rose-600" />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Reaction Badges Row */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              className={cn(
                "flex flex-wrap items-center gap-1 px-1",
                isOutgoing ? "justify-end" : "justify-start"
              )}
            >
              {message.reactions.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => onToggleReaction?.(message.id, r.emoji)}
                  title={r.employeeNames.join(", ")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all border shadow-2xs cursor-pointer active:scale-95",
                    r.reactedByMe
                      ? "bg-primary/10 border-primary/40 text-primary font-bold ring-1 ring-primary/20"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                  aria-label={`${r.emoji} reacted by ${r.count} users`}
                >
                  <span className="text-sm leading-none">{r.emoji}</span>
                  <span className="text-[11px] font-semibold tabular-nums leading-none">
                    {r.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Failed Message Error & Retry Action */}
          {isFailed && (
            <div className="flex items-center justify-end gap-2 px-1 text-xs text-rose-600 font-medium">
              <span>{message.sendError || "Failed to deliver"}</span>
              {onRetrySend && (
                <button
                  type="button"
                  onClick={() => onRetrySend(message)}
                  className="inline-flex items-center gap-1 rounded bg-rose-100 hover:bg-rose-200 px-2 py-0.5 font-bold text-rose-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className="size-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          {/* Floating Actions on Hover: Reactions & Task Conversion */}
          {!isFailed && !message.id.startsWith("temp-") && (
            <div
              className={cn(
                "absolute top-0 flex items-center gap-1 z-20 transition-opacity duration-150",
                isOutgoing
                  ? "right-full mr-2 flex-row-reverse"
                  : "left-full ml-2 flex-row",
                showActions || showReactionPicker
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              )}
            >
              {/* Quick Reactions Strip / Trigger */}
              <div className="relative flex items-center">
                {showReactionPicker ? (
                  <div className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-1 shadow-md animate-in fade-in zoom-in-95 duration-100">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleSelectReaction(emoji)}
                        className="flex size-7 items-center justify-center rounded-full text-base hover:bg-slate-100 hover:scale-125 transition-transform"
                        title={`React with ${emoji}`}
                        aria-label={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowReactionPicker(true)}
                    className="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-primary transition-colors cursor-pointer"
                    title="Add reaction"
                    aria-label="Add reaction"
                  >
                    <Smile className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Task Conversion Floating Action Button */}
              {message.content && !isTaskReference && (
                <button
                  type="button"
                  onClick={() => onConvertToTask(message)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-md hover:bg-slate-50 hover:text-primary transition-colors cursor-pointer"
                  title="Create a project task from this message"
                  aria-label="Create task from message"
                >
                  <Briefcase className="size-3 text-primary" />
                  <span className="hidden sm:inline">Create task</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {showLightbox && attachment && (
        <ImageLightboxModal
          src={attachmentDownloadUrl}
          alt={attachment.fileName}
          fileName={attachment.fileName}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  );
}
