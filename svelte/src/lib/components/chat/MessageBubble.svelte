<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import AudioPlayer from "$lib/components/chat/AudioPlayer.svelte";
import ImageLightboxModal from "$lib/components/chat/ImageLightboxModal.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
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
let {
  message,
  isOutgoing,
  isGroup,
  onConvertToTask,
  onRetrySend,
  onOpenProfile,
  onToggleReaction,
}:MessageBubbleProps=$props();
let showActions=$state(untrack(()=>(false)));
const setShowActions=(next:typeof showActions|((previous:typeof showActions)=>typeof showActions))=>{showActions=typeof next==="function"?(next as (previous:typeof showActions)=>typeof showActions)(showActions):next;};
let showReactionPicker=$state(untrack(()=>(false)));
const setShowReactionPicker=(next:typeof showReactionPicker|((previous:typeof showReactionPicker)=>typeof showReactionPicker))=>{showReactionPicker=typeof next==="function"?(next as (previous:typeof showReactionPicker)=>typeof showReactionPicker)(showReactionPicker):next;};
let showLightbox=$state(untrack(()=>(false)));
const setShowLightbox=(next:typeof showLightbox|((previous:typeof showLightbox)=>typeof showLightbox))=>{showLightbox=typeof next==="function"?(next as (previous:typeof showLightbox)=>typeof showLightbox)(showLightbox):next;};
const timeLabel=$derived(formatMessageTime(message.createdAt));
const isTaskReference=$derived(message.type === "task_reference");
const status=$derived(message.deliveryStatus ?? (isOutgoing ? "sent" : null));
const isFailed=$derived(status === "failed");
const attachment=$derived(message.attachment);
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
const attachmentDownloadUrl=$derived(attachment
    ? `/api/app/chat/conversations/${message.conversationId}/attachments/${attachment.id}`
    : "");

import { cn } from '$lib/utils';
import type { MessageItem, ProfileDetails } from '$lib/components/chat/types';
import { formatMessageTime } from '$lib/components/chat/utils';</script>
{#if message.type === "system"}<div class="flex justify-center my-2">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 font-medium">
          {message.content}
        </span>
      </div>{:else}
      <div id={`msg-${message.id}`} role="group" aria-label={`Message from ${message.sender?.displayName || (isOutgoing ? "you" : "colleague")}`} class={cn(
          "group relative flex w-full transition-all duration-300",
          isOutgoing ? "justify-end" : "justify-start"
        )} onmouseenter={() => setShowActions(true)} onmouseleave={() => {
          setShowActions(false);
          setShowReactionPicker(false);
        }}>
        <div class={cn(
            "relative max-w-[85%] sm:max-w-[70%] space-y-1",
            isOutgoing ? "items-end" : "items-start"
          )}>
          
          {#if !isOutgoing && isGroup}<button type="button" onclick={handleProfileClick} class="block px-1 text-[11px] font-bold text-primary tracking-tight text-left hover:underline cursor-pointer">
              {message.sender?.displayName || "Colleague"}
            </button>{/if}

          
          <div class={cn(
              "relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-2xs transition-all",
              isOutgoing
                ? isFailed
                  ? "rounded-tr-xs bg-rose-50 text-rose-950 border border-rose-300"
                  : "rounded-tr-xs bg-primary text-primary-foreground"
                : "rounded-tl-xs bg-surface text-foreground border border-slate-200/90",
              isTaskReference && "ring-1 ring-accent/40"
            )}>
            
            {#if isTaskReference}<div class={cn(
                  "mb-1.5 flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                  isOutgoing
                    ? "bg-white/20 text-white"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                )}>
                <SvgIcon name="CheckCircle2" class="size-3" />
                <span>Converted to Task</span>
              </div>{/if}

            
            {#if attachment && attachment.category === "image"}<button type="button" aria-label={`Preview image ${attachment.fileName}`} class="block appearance-none overflow-hidden rounded-xl cursor-pointer mb-2 border border-black/10 bg-transparent p-0 text-left shadow-xs" onclick={() => setShowLightbox(true)} title="Click to view full image">
                
                <img src={attachmentDownloadUrl} alt={attachment.fileName} class="max-h-72 w-auto max-w-full rounded-xl object-contain hover:scale-[1.01] transition-transform" loading="lazy" />
              </button>{/if}

            
            {#if attachment && attachment.category === "document"}<a href={attachmentDownloadUrl} download={attachment.fileName} target="_blank" rel="noopener noreferrer" class={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl border mb-2 transition-colors group/doc",
                  isOutgoing
                    ? "bg-white/15 border-white/20 hover:bg-white/25 text-white"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-foreground"
                )} title={`Download ${attachment.fileName}`}>
                <div class="flex size-9 items-center justify-center rounded-lg bg-rose-600 text-white shrink-0 shadow-xs">
                  <SvgIcon name="FileText" class="size-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-bold truncate group-hover/doc:underline">
                    {attachment.fileName}
                  </p>
                  <p class="text-[10px] opacity-80">
                    {(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB • PDF Document
                  </p>
                </div>
                <SvgIcon name="Download" class="size-4 opacity-75 group-hover/doc:opacity-100 shrink-0" />
              </a>{/if}

            
            {#if attachment && attachment.category === "audio"}<div class="mb-1">
                <AudioPlayer src={attachmentDownloadUrl} isOutgoing={isOutgoing} />
              </div>{/if}

            
            {#if message.content}<p class="whitespace-pre-wrap break-words text-sm font-normal">
                {message.content}
              </p>{/if}

            
            <div class={cn(
                "mt-1 flex items-center justify-end gap-1 text-[10px]",
                isOutgoing
                  ? isFailed
                    ? "text-rose-600"
                    : "text-emerald-100/85"
                  : "text-muted"
              )}>
              <span>{timeLabel}</span>

              
              {#if isOutgoing}<span class="flex items-center ml-0.5" title={`Status: ${status}`}>
                  {#if status === "sending"}<SvgIcon name="Clock" class="size-3 text-white/70 animate-pulse" />{/if}
                  {#if status === "sent"}<SvgIcon name="Check" class="size-3 text-white/80" />{/if}
                  {#if status === "delivered"}<SvgIcon name="CheckCheck" class="size-3.5 text-white/90" />{/if}
                  {#if status === "read"}<SvgIcon name="CheckCheck" class="size-3.5 text-sky-300 font-bold" />{/if}
                  {#if isFailed}<SvgIcon name="AlertCircle" class="size-3 text-rose-600" />{/if}
                </span>{/if}
            </div>
          </div>

          
          {#if message.reactions && message.reactions.length > 0}<div class={cn(
                "flex flex-wrap items-center gap-1 px-1",
                isOutgoing ? "justify-end" : "justify-start"
              )}>
              {#each message.reactions as r}<button type="button" onclick={() => onToggleReaction?.(message.id, r.emoji)} title={r.employeeNames.join(", ")} class={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all border shadow-2xs cursor-pointer active:scale-95",
                    r.reactedByMe
                      ? "bg-primary/10 border-primary/40 text-primary font-bold ring-1 ring-primary/20"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  )} aria-label={`${r.emoji} reacted by ${r.count} users`}>
                  <span class="text-sm leading-none">{r.emoji}</span>
                  <span class="text-[11px] font-semibold tabular-nums leading-none">
                    {r.count}
                  </span>
                </button>{/each}
            </div>{/if}

          
          {#if isFailed}<div class="flex items-center justify-end gap-2 px-1 text-xs text-rose-600 font-medium">
              <span>{message.sendError || "Failed to deliver"}</span>
              {#if onRetrySend}<button type="button" onclick={() => onRetrySend(message)} class="inline-flex items-center gap-1 rounded bg-rose-100 hover:bg-rose-200 px-2 py-0.5 font-bold text-rose-800 transition-colors cursor-pointer">
                  <SvgIcon name="RefreshCw" class="size-3" />
                  <span>Retry</span>
                </button>{/if}
            </div>{/if}

          
          {#if !isFailed && !message.id.startsWith("temp-")}<div class={cn(
                "absolute top-0 flex items-center gap-1 z-20 transition-opacity duration-150",
                isOutgoing
                  ? "right-full mr-2 flex-row-reverse"
                  : "left-full ml-2 flex-row",
                showActions || showReactionPicker
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              )}>
              
              <div class="relative flex items-center">
                {#if showReactionPicker}<div class="flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-1 shadow-md animate-in fade-in zoom-in-95 duration-100">
                    {#each REACTION_EMOJIS as emoji}<button type="button" onclick={() => handleSelectReaction(emoji)} class="flex size-7 items-center justify-center rounded-full text-base hover:bg-slate-100 hover:scale-125 transition-transform" title={`React with ${emoji}`} aria-label={`React with ${emoji}`}>
                        {emoji}
                      </button>{/each}
                  </div>{:else}<button type="button" onclick={() => setShowReactionPicker(true)} class="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-primary transition-colors cursor-pointer" title="Add reaction" aria-label="Add reaction">
                    <SvgIcon name="Smile" class="size-3.5" />
                  </button>{/if}
              </div>

              
              {#if message.content && !isTaskReference}<button type="button" onclick={() => onConvertToTask(message)} class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-md hover:bg-slate-50 hover:text-primary transition-colors cursor-pointer" title="Create a project task from this message" aria-label="Create task from message">
                  <SvgIcon name="Briefcase" class="size-3 text-primary" />
                  <span class="hidden sm:inline">Create task</span>
                </button>{/if}
            </div>{/if}
        </div>
      </div>

      
      {#if showLightbox && attachment}<ImageLightboxModal src={attachmentDownloadUrl} alt={attachment.fileName} fileName={attachment.fileName} onClose={() => setShowLightbox(false)} />{/if}
    {/if}
