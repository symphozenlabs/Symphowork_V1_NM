<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface VoiceRecorderProps {
  onSendVoice: (file: File, durationSeconds: number) => Promise<void>;
  onCancel: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}
let {
  onSendVoice,
  onCancel,
  onError,
  disabled = false,
}:VoiceRecorderProps=$props();
let recording=$state(untrack(()=>(false)));
const setRecording=(next:typeof recording|((previous:typeof recording)=>typeof recording))=>{recording=typeof next==="function"?(next as (previous:typeof recording)=>typeof recording)(recording):next;};
let duration=$state(untrack(()=>(0)));
const setDuration=(next:typeof duration|((previous:typeof duration)=>typeof duration))=>{duration=typeof next==="function"?(next as (previous:typeof duration)=>typeof duration)(duration):next;};
let audioBlob=$state<Blob | null>(untrack(()=>(null)));
const setAudioBlob=(next:typeof audioBlob|((previous:typeof audioBlob)=>typeof audioBlob))=>{audioBlob=typeof next==="function"?(next as (previous:typeof audioBlob)=>typeof audioBlob)(audioBlob):next;};
let previewUrl=$state<string | null>(untrack(()=>(null)));
const setPreviewUrl=(next:typeof previewUrl|((previous:typeof previewUrl)=>typeof previewUrl))=>{previewUrl=typeof next==="function"?(next as (previous:typeof previewUrl)=>typeof previewUrl)(previewUrl):next;};
let isPlayingPreview=$state(untrack(()=>(false)));
const setIsPlayingPreview=(next:typeof isPlayingPreview|((previous:typeof isPlayingPreview)=>typeof isPlayingPreview))=>{isPlayingPreview=typeof next==="function"?(next as (previous:typeof isPlayingPreview)=>typeof isPlayingPreview)(isPlayingPreview):next;};
let previewProgress=$state(untrack(()=>(0)));
const setPreviewProgress=(next:typeof previewProgress|((previous:typeof previewProgress)=>typeof previewProgress))=>{previewProgress=typeof next==="function"?(next as (previous:typeof previewProgress)=>typeof previewProgress)(previewProgress):next;};
let sending=$state(untrack(()=>(false)));
const setSending=(next:typeof sending|((previous:typeof sending)=>typeof sending))=>{sending=typeof next==="function"?(next as (previous:typeof sending)=>typeof sending)(sending):next;};
let micError=$state<string | null>(untrack(()=>(null)));
const setMicError=(next:typeof micError|((previous:typeof micError)=>typeof micError))=>{micError=typeof next==="function"?(next as (previous:typeof micError)=>typeof micError)(micError):next;};
let mediaRecorderRef=$state({current:null as MediaRecorder | null|null});
let audioChunksRef=$state({current:[] as Blob[]});
let timerRef=$state({current:null as NodeJS.Timeout | null|null});
let streamRef=$state({current:null as MediaStream | null|null});
let previewAudioRef=$state({current:null as HTMLAudioElement | null|null});
const cleanupStream=$derived.by(()=>{return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };});
$effect(()=>{cleanupStream;previewUrl;return untrack(() => {
    const currentPreviewUrl = previewUrl;
    return () => {
      cleanupStream();
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    };
  });});
$effect(()=>{cleanupStream;onError;return untrack(() => {
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
  });});
const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };
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
let recordedFile: {blob:Blob;file:File}|null=null;
const handleSend = async () => {
    if (sending || disabled) return;
    setSending(true);
    try {
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
          setAudioBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          setRecording(false);
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

      const ext = blobToSend.type.includes("ogg")
        ? ".ogg"
        : blobToSend.type.includes("mp4")
        ? ".mp4"
        : ".webm";
      const file = recordedFile?.blob === blobToSend ? recordedFile.file : new File([blobToSend], `voice-message-${Date.now()}${ext}`, {
        type: blobToSend.type,
      });

      recordedFile={blob:blobToSend,file};
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
</script>
{#if micError}<div class="flex items-center justify-between gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
        <div class="flex items-center gap-2">
          <SvgIcon name="AlertCircle" class="size-4 shrink-0 text-rose-600" />
          <span>{micError}</span>
        </div>
        <Button type="button" variant="outline" size="sm" onclick={handleCancel} class="h-7 text-xs border-rose-300 hover:bg-rose-100">
          Dismiss
        </Button>
      </div>{:else}<div class="flex items-center justify-between gap-3 p-2.5 sm:p-3 bg-slate-50 border border-border rounded-xl shadow-xs animate-in fade-in duration-200">
      
      <button type="button" onclick={handleCancel} disabled={sending} class="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" title="Discard recording" aria-label="Discard voice message">
        <SvgIcon name="Trash2" class="size-4" />
      </button>

      
      <div class="flex-1 flex items-center gap-3 min-w-0 px-2">
        {#if recording}<div class="flex items-center gap-2.5">
            <span class="relative flex size-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full size-3 bg-rose-600"></span>
            </span>
            <span class="text-xs font-semibold text-rose-700 tracking-wider">
              {formatTimer(duration)}
            </span>
            <span class="text-[11px] text-muted truncate">
              (Max 2:00)
            </span>
          </div>{:else}<div class="flex-1 flex items-center gap-2">
            <button type="button" onclick={handleTogglePreviewPlay} class="flex size-7 items-center justify-center rounded-full bg-primary text-white shadow-xs hover:bg-primary/90 transition-transform active:scale-95" aria-label={isPlayingPreview ? "Pause preview" : "Play preview"}>
              {#if isPlayingPreview}<SvgIcon name="Pause" class="size-3.5 fill-current" />{:else}<SvgIcon name="Play" class="size-3.5 fill-current ml-0.5" />{/if}
            </button>
            <div class="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div class="bg-primary h-full transition-all duration-100" style:width={`${previewProgress}%`}></div>
            </div>
            <span class="text-xs font-medium text-slate-600 tabular-nums">
              {formatTimer(duration)}
            </span>
          </div>{/if}
      </div>

      
      <div class="flex items-center gap-1.5">
        {#if recording}<Button type="button" variant="ghost" size="sm" onclick={handleStopRecording} class="h-9 px-2.5 text-xs text-slate-700 hover:bg-slate-200 gap-1.5" title="Stop & review recording" aria-label="Review recording">
            <SvgIcon name="Square" class="size-3.5 fill-current" />
            <span class="hidden sm:inline">Preview</span>
          </Button>{/if}

        <Button type="button" onclick={handleSend} disabled={sending || disabled} class="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-xs gap-1.5 text-xs font-semibold" title="Send voice message" aria-label="Send voice message">
          {#if sending}<SvgIcon name="Loader2" class="size-4 animate-spin" />{:else}
              <SvgIcon name="Send" class="size-3.5" />
              <span class="hidden sm:inline">Send</span>
            {/if}
        </Button>
      </div>
    </div>{/if}
