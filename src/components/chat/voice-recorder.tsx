"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Trash2, Send, Play, Pause, Square, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onSendVoice: (file: File, durationSeconds: number) => Promise<void>;
  onCancel: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({
  onSendVoice,
  onCancel,
  onError,
  disabled = false,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop stream tracks helper
  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [cleanupStream, previewUrl]);

  // Start recording on mount
  useEffect(() => {
    let isCancelled = false;

    async function startRecording() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Microphone recording is not supported in this browser.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Choose supported mime type
        let mimeType = "audio/webm";
        if (typeof MediaRecorder !== "undefined") {
          if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            mimeType = "audio/webm;codecs=opus";
          } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
            mimeType = "audio/ogg;codecs=opus";
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            mimeType = "audio/mp4";
          }
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setRecording(false);
          cleanupStream();
        };

        recorder.start(250); // Emit chunk every 250ms
        setRecording(true);
        setDuration(0);

        // Start elapsed timer
        timerRef.current = setInterval(() => {
          setDuration((prev) => {
            // Auto stop at 120 seconds (2 minutes)
            if (prev >= 119) {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
              }
              return 120;
            }
            return prev + 1;
          });
        }, 1000);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
              ? "Microphone access was denied. Please allow microphone permissions in your browser."
              : err.message
            : "Failed to access microphone.";
        setMicError(msg);
        if (onError) onError(msg);
        cleanupStream();
      }
    }

    void startRecording();

    return () => {
      isCancelled = true;
    };
  }, [cleanupStream, onError]);

  // Handle Stop Recording -> enter preview
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  // Handle Cancel Recording
  const handleCancel = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onCancel();
  };

  // Handle Play/Pause Preview
  const handleTogglePreviewPlay = () => {
    if (!previewUrl) return;

    if (!previewAudioRef.current) {
      const audio = new Audio(previewUrl);
      previewAudioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPreviewProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingPreview(false);
        setPreviewProgress(0);
      };
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      void previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  // Handle Send Voice Message
  const handleSend = async () => {
    if (sending) return;

    let blobToSend = audioBlob;
    const finalDuration = duration;

    // If still recording, stop and grab the final blob
    if (recording && mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise<void>((resolve) => {
        if (!mediaRecorderRef.current) return resolve();
        mediaRecorderRef.current.onstop = () => {
          const type = mediaRecorderRef.current?.mimeType || "audio/webm";
          const blob = new Blob(audioChunksRef.current, { type });
          blobToSend = blob;
          cleanupStream();
          resolve();
        };
        mediaRecorderRef.current.stop();
      });
    }

    if (!blobToSend || blobToSend.size === 0) {
      onError?.("Audio recording is empty.");
      return;
    }

    try {
      setSending(true);
      const ext = blobToSend.type.includes("ogg")
        ? ".ogg"
        : blobToSend.type.includes("mp4")
        ? ".mp4"
        : ".webm";
      const file = new File([blobToSend], `voice-message-${Date.now()}${ext}`, {
        type: blobToSend.type,
      });

      await onSendVoice(file, finalDuration);
      cleanupStream();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to send voice message.");
    } finally {
      setSending(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  if (micError) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{micError}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="h-7 text-xs border-rose-300 hover:bg-rose-100"
        >
          Dismiss
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 bg-slate-50 border border-border rounded-xl shadow-xs animate-in fade-in duration-200">
      {/* Left side: Discard / Cancel button */}
      <button
        type="button"
        onClick={handleCancel}
        disabled={sending}
        className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        title="Discard recording"
        aria-label="Discard voice message"
      >
        <Trash2 className="size-4" />
      </button>

      {/* Middle: Recording Status & Timer or Audio Preview */}
      <div className="flex-1 flex items-center gap-3 min-w-0 px-2">
        {recording ? (
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-3 bg-rose-600" />
            </span>
            <span className="text-xs font-semibold text-rose-700 tracking-wider">
              {formatTimer(duration)}
            </span>
            <span className="text-[11px] text-muted truncate">
              (Max 2:00)
            </span>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePreviewPlay}
              className="flex size-7 items-center justify-center rounded-full bg-primary text-white shadow-xs hover:bg-primary/90 transition-transform active:scale-95"
              aria-label={isPlayingPreview ? "Pause preview" : "Play preview"}
            >
              {isPlayingPreview ? (
                <Pause className="size-3.5 fill-current" />
              ) : (
                <Play className="size-3.5 fill-current ml-0.5" />
              )}
            </button>
            <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-100"
                style={{ width: `${previewProgress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-600 tabular-nums">
              {formatTimer(duration)}
            </span>
          </div>
        )}
      </div>

      {/* Right side: Stop Preview or Send */}
      <div className="flex items-center gap-1.5">
        {recording && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleStopRecording}
            className="h-9 px-2.5 text-xs text-slate-700 hover:bg-slate-200 gap-1.5"
            title="Stop & review recording"
            aria-label="Review recording"
          >
            <Square className="size-3.5 fill-current" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
        )}

        <Button
          type="button"
          onClick={handleSend}
          disabled={sending || disabled}
          className="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-xs gap-1.5 text-xs font-semibold"
          title="Send voice message"
          aria-label="Send voice message"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Send className="size-3.5" />
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
