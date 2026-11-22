<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import EmojiPicker from "$lib/components/chat/EmojiPicker.svelte";
import Button from "$lib/components/ui/Button.svelte";
import VoiceRecorder from "$lib/components/chat/VoiceRecorder.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PDF_SIZE = 10 * 1024 * 1024;
interface ChatInputBarProps {
  onSendMessage: (content: string) => Promise<void>;
  onSendAttachment?: (file: File, caption?: string) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  sending: boolean;
  disabled?: boolean;
}
let {
  onSendMessage,
  onSendAttachment,
  onTyping,
  sending,
  disabled = false,
}:ChatInputBarProps=$props();
let content=$state(untrack(()=>("")));
const setContent=(next:typeof content|((previous:typeof content)=>typeof content))=>{content=typeof next==="function"?(next as (previous:typeof content)=>typeof content)(content):next;};
let selectedFile=$state<File | null>(untrack(()=>(null)));
const setSelectedFile=(next:typeof selectedFile|((previous:typeof selectedFile)=>typeof selectedFile))=>{selectedFile=typeof next==="function"?(next as (previous:typeof selectedFile)=>typeof selectedFile)(selectedFile):next;};
let filePreviewUrl=$state<string | null>(untrack(()=>(null)));
const setFilePreviewUrl=(next:typeof filePreviewUrl|((previous:typeof filePreviewUrl)=>typeof filePreviewUrl))=>{filePreviewUrl=typeof next==="function"?(next as (previous:typeof filePreviewUrl)=>typeof filePreviewUrl)(filePreviewUrl):next;};
let fileError=$state<string | null>(untrack(()=>(null)));
const setFileError=(next:typeof fileError|((previous:typeof fileError)=>typeof fileError))=>{fileError=typeof next==="function"?(next as (previous:typeof fileError)=>typeof fileError)(fileError):next;};
let showEmojiPicker=$state(untrack(()=>(false)));
const setShowEmojiPicker=(next:typeof showEmojiPicker|((previous:typeof showEmojiPicker)=>typeof showEmojiPicker))=>{showEmojiPicker=typeof next==="function"?(next as (previous:typeof showEmojiPicker)=>typeof showEmojiPicker)(showEmojiPicker):next;};
let isRecordingVoice=$state(untrack(()=>(false)));
const setIsRecordingVoice=(next:typeof isRecordingVoice|((previous:typeof isRecordingVoice)=>typeof isRecordingVoice))=>{isRecordingVoice=typeof next==="function"?(next as (previous:typeof isRecordingVoice)=>typeof isRecordingVoice)(isRecordingVoice):next;};
let textareaRef=$state({current:null as HTMLTextAreaElement|null});
let fileInputRef=$state({current:null as HTMLInputElement|null});
let emojiContainerRef=$state({current:null as HTMLDivElement|null});
let typingTimerRef=$state({current:null as NodeJS.Timeout | null|null});
let isTypingActiveRef=$state({current:false as unknown});
$effect(()=>{showEmojiPicker;return untrack(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiContainerRef.current && !emojiContainerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });});
$effect(()=>{selectedFile;return untrack(() => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreviewUrl(null);
    }
  });});
$effect(()=>{onTyping;return untrack(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      if (isTypingActiveRef.current && onTyping) {
        onTyping(false);
      }
    };
  });});
const signalTyping = (active: boolean) => {
    if (!onTyping) return;
    if (active) {
      if (!isTypingActiveRef.current) {
        isTypingActiveRef.current = true;
        onTyping(true);
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        isTypingActiveRef.current = false;
        onTyping(false);
      }, 3500);
    } else {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      if (isTypingActiveRef.current) {
        isTypingActiveRef.current = false;
        onTyping(false);
      }
    }
  };
const validateAndSelectFile = (file: File) => {
    setFileError(null);
    const mime = file.type.toLowerCase();
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    const isImage = mime.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    const isPdf = mime === "application/pdf" || ext === ".pdf";

    if (!isImage && !isPdf) {
      setFileError("Unsupported file format. Please attach a JPEG, PNG, WebP image or PDF document.");
      return;
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      setFileError(`Image exceeds 5MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    if (isPdf && file.size > MAX_PDF_SIZE) {
      setFileError(`PDF exceeds 10MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    setSelectedFile(file);
  };
const handleFileChange = (e: Event & {currentTarget:HTMLInputElement}) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
    // Reset file input so the same file can be selected again if cancelled
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
const handleClearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setFileError(null);
  };
const handleInsertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart ?? content.length;
      const end = el.selectionEnd ?? content.length;
      const nextContent = content.substring(0, start) + emoji + content.substring(end);
      setContent(nextContent);
      setShowEmojiPicker(false);
      setTimeout(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + emoji.length;
      }, 0);
    } else {
      setContent((prev) => prev + emoji);
      setShowEmojiPicker(false);
    }
  };
const handleVoiceSend = async (file: File) => {
    if (!onSendAttachment) {
      throw new Error("Voice messages are not supported in this view.");
    }
    await onSendAttachment(file);
    setIsRecordingVoice(false);
  };
const canSubmit=$derived(!disabled && !sending && (content.trim().length > 0 || selectedFile !== null));
async function handleSubmit(event?: SubmitEvent) {
    if (event) event.preventDefault();
    if (!canSubmit) return;

    signalTyping(false);
    setShowEmojiPicker(false);

    const caption = content.trim();

    try {
      if (selectedFile && onSendAttachment) {
        const fileToUpload = selectedFile;
        setContent("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        await onSendAttachment(fileToUpload, caption || undefined);
        handleClearSelectedFile();
      } else if (caption) {
        setContent("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        await onSendMessage(caption);
      }
    } catch (cause) {
      setFileError(cause instanceof Error ? cause.message : "Message could not be sent.");
      // Restore input on failure
      if (caption) setContent(caption);
    } finally {
      textareaRef.current?.focus();
    }
  }
function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }
function handleInput(event: Event & { currentTarget: HTMLTextAreaElement }) {
    const val = event.currentTarget.value;
    setContent(val);

    const target = event.currentTarget;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 140)}px`;

    if (val.trim().length > 0) {
      signalTyping(true);
    } else {
      signalTyping(false);
    }
  }
function handleBlur() {
    signalTyping(false);
  }
</script>
{#if isRecordingVoice}<div class="border-t border-border bg-surface p-3 sm:p-4">
        <VoiceRecorder onSendVoice={handleVoiceSend} onCancel={() => setIsRecordingVoice(false)} onError={(err) => setFileError(err)} disabled={disabled || sending} />
      </div>{:else}<div class="border-t border-border bg-surface p-3 sm:p-4 space-y-2">
      
      {#if fileError}<div class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-in fade-in">
          <div class="flex items-center gap-1.5">
            <SvgIcon name="AlertCircle" class="size-3.5 shrink-0 text-rose-600" />
            <span>{fileError}</span>
          </div>
          <button type="button" onclick={() => setFileError(null)} class="text-rose-500 hover:text-rose-800" aria-label="Dismiss error">
            <SvgIcon name="X" class="size-3" />
          </button>
        </div>{/if}

      
      {#if selectedFile}<div class="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-border shadow-2xs animate-in fade-in">
          <div class="flex items-center gap-2.5 min-w-0">
            {#if filePreviewUrl}<img src={filePreviewUrl} alt="Upload preview" class="size-10 rounded-lg object-cover border border-slate-200 shrink-0" />{:else}<div class="flex size-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700 shrink-0">
                <SvgIcon name="FileText" class="size-5" />
              </div>{/if}
            <div class="min-w-0">
              <p class="text-xs font-semibold text-foreground truncate">
                {selectedFile.name}
              </p>
              <p class="text-[11px] text-muted">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <button type="button" onclick={handleClearSelectedFile} class="p-1 rounded-full text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Remove attachment" aria-label="Remove attachment">
            <SvgIcon name="X" class="size-4" />
          </button>
        </div>{/if}

      
      <form onsubmit={handleSubmit} class="relative flex items-end gap-1.5 sm:gap-2">
        
        <input bind:this={fileInputRef.current} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onchange={handleFileChange} class="hidden" aria-hidden="true" />

        
        <button type="button" onclick={() => fileInputRef.current?.click()} disabled={disabled || sending} class="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-slate-100 transition-colors disabled:opacity-50" title="Attach image or document" aria-label="Attach file">
          <SvgIcon name="Paperclip" class="size-5" />
        </button>

        
        <div bind:this={emojiContainerRef.current} class="relative">
          <button type="button" onclick={() => setShowEmojiPicker((prev) => !prev)} disabled={disabled || sending} class="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted hover:text-amber-600 hover:bg-slate-100 transition-colors disabled:opacity-50" title="Insert emoji" aria-label="Insert emoji">
            <SvgIcon name="Smile" class="size-5" />
          </button>

          {#if showEmojiPicker}<div class="absolute bottom-12 left-0 z-50">
              <EmojiPicker onSelectEmoji={handleInsertEmoji} onClose={() => setShowEmojiPicker(false)} />
            </div>{/if}
        </div>

        
        <div class="relative flex-1">
          <textarea bind:this={textareaRef.current} rows={1} value={content} oninput={handleInput} onkeydown={handleKeyDown} onblur={handleBlur} disabled={disabled || sending} placeholder={selectedFile
                ? "Add an optional caption… (Press Enter to send)"
                : "Write a message… (Press Enter to send, Shift+Enter for new line)"} aria-label="Write a message" class="w-full resize-none rounded-xl border border-border bg-slate-50/80 px-3.5 py-2.5 text-sm text-foreground shadow-2xs transition-colors placeholder:text-muted focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed" style:max-height={"140px"}></textarea>
        </div>

        
        <Button type="button" onclick={() => setIsRecordingVoice(true)} disabled={disabled || sending} class="size-10 shrink-0 rounded-xl p-0 bg-slate-100 hover:bg-primary hover:text-white text-slate-700 shadow-2xs transition-colors" title="Record voice message" aria-label="Record voice message">
          <SvgIcon name="Mic" class="size-4" />
        </Button>

        
        <Button type="submit" disabled={!canSubmit} class="size-10 shrink-0 rounded-xl p-0 shadow-xs" title="Send message" aria-label="Send message">
          {#if sending}<SvgIcon name="Loader2" class="size-4 animate-spin" />{:else}<SvgIcon name="Send" class="size-4" />{/if}
        </Button>
      </form>
    </div>{/if}
