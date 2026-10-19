"use client";

import React, { useRef, useState, useEffect, KeyboardEvent, FormEvent } from "react";
import { Send, Loader2, Paperclip, Smile, Mic, X, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "./emoji-picker";
import { VoiceRecorder } from "./voice-recorder";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB

interface ChatInputBarProps {
  onSendMessage: (content: string) => Promise<void>;
  onSendAttachment?: (file: File, caption?: string) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  sending: boolean;
  disabled?: boolean;
}

export function ChatInputBar({
  onSendMessage,
  onSendAttachment,
  onTyping,
  sending,
  disabled = false,
}: ChatInputBarProps) {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingActiveRef = useRef(false);

  // Close emoji picker on click outside
  useEffect(() => {
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
  }, [showEmojiPicker]);

  // Clean up object URL when selectedFile changes
  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreviewUrl(null);
    }
  }, [selectedFile]);

  // Stop typing on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      if (isTypingActiveRef.current && onTyping) {
        onTyping(false);
      }
    };
  }, [onTyping]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  const canSubmit = !disabled && !sending && (content.trim().length > 0 || selectedFile !== null);

  async function handleSubmit(event?: FormEvent) {
    if (event) event.preventDefault();
    if (!canSubmit) return;

    signalTyping(false);
    setShowEmojiPicker(false);

    const caption = content.trim();

    try {
      if (selectedFile && onSendAttachment) {
        const fileToUpload = selectedFile;
        handleClearSelectedFile();
        setContent("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        await onSendAttachment(fileToUpload, caption || undefined);
      } else if (caption) {
        setContent("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        await onSendMessage(caption);
      }
    } catch {
      // Restore input on failure
      if (caption) setContent(caption);
    } finally {
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  function handleInput(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = event.target.value;
    setContent(val);

    const target = event.target;
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

  if (isRecordingVoice) {
    return (
      <div className="border-t border-border bg-surface p-3 sm:p-4">
        <VoiceRecorder
          onSendVoice={handleVoiceSend}
          onCancel={() => setIsRecordingVoice(false)}
          onError={(err) => setFileError(err)}
          disabled={disabled || sending}
        />
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-surface p-3 sm:p-4 space-y-2">
      {/* File Validation Error Banner */}
      {fileError && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="size-3.5 shrink-0 text-rose-600" />
            <span>{fileError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFileError(null)}
            className="text-rose-500 hover:text-rose-800"
            aria-label="Dismiss error"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Selected File Preview Chip */}
      {selectedFile && (
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-border shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            {filePreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={filePreviewUrl}
                alt="Upload preview"
                className="size-10 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700 shrink-0">
                <FileText className="size-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-muted">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearSelectedFile}
            className="p-1 rounded-full text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Remove attachment"
            aria-label="Remove attachment"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Main Composer Row */}
      <form onSubmit={handleSubmit} className="relative flex items-end gap-1.5 sm:gap-2">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />

        {/* Attachment Paperclip Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-slate-100 transition-colors disabled:opacity-50"
          title="Attach image or document"
          aria-label="Attach file"
        >
          <Paperclip className="size-5" />
        </button>

        {/* Emoji Button & Popover */}
        <div ref={emojiContainerRef} className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={disabled || sending}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted hover:text-amber-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Insert emoji"
            aria-label="Insert emoji"
          >
            <Smile className="size-5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50">
              <EmojiPicker
                onSelectEmoji={handleInsertEmoji}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>

        {/* Text Area */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={disabled || sending}
            placeholder={
              selectedFile
                ? "Add an optional caption… (Press Enter to send)"
                : "Write a message… (Press Enter to send, Shift+Enter for new line)"
            }
            aria-label="Write a message"
            className="w-full resize-none rounded-xl border border-border bg-slate-50/80 px-3.5 py-2.5 text-sm text-foreground shadow-2xs transition-colors placeholder:text-muted focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: "140px" }}
          />
        </div>

        {/* Voice message recording button */}
        <Button
          type="button"
          onClick={() => setIsRecordingVoice(true)}
          disabled={disabled || sending}
          className="size-10 shrink-0 rounded-xl p-0 bg-slate-100 hover:bg-primary hover:text-white text-slate-700 shadow-2xs transition-colors"
          title="Record voice message"
          aria-label="Record voice message"
        >
          <Mic className="size-4" />
        </Button>

        {/* Send message button */}
        <Button
          type="submit"
          disabled={!canSubmit}
          className="size-10 shrink-0 rounded-xl p-0 shadow-xs"
          title="Send message"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
