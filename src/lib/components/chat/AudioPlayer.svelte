<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface AudioPlayerProps {
  src: string;
  isOutgoing?: boolean;
}
let { src, isOutgoing = false }:AudioPlayerProps=$props();
let isPlaying=$state(untrack(()=>(false)));
const setIsPlaying=(next:typeof isPlaying|((previous:typeof isPlaying)=>typeof isPlaying))=>{isPlaying=typeof next==="function"?(next as (previous:typeof isPlaying)=>typeof isPlaying)(isPlaying):next;};
let currentTime=$state(untrack(()=>(0)));
const setCurrentTime=(next:typeof currentTime|((previous:typeof currentTime)=>typeof currentTime))=>{currentTime=typeof next==="function"?(next as (previous:typeof currentTime)=>typeof currentTime)(currentTime):next;};
let duration=$state(untrack(()=>(0)));
const setDuration=(next:typeof duration|((previous:typeof duration)=>typeof duration))=>{duration=typeof next==="function"?(next as (previous:typeof duration)=>typeof duration)(duration):next;};
let playbackRate=$state(untrack(()=>(1)));
const setPlaybackRate=(next:typeof playbackRate|((previous:typeof playbackRate)=>typeof playbackRate))=>{playbackRate=typeof next==="function"?(next as (previous:typeof playbackRate)=>typeof playbackRate)(playbackRate):next;};
let hasError=$state(untrack(()=>(false)));
const setHasError=(next:typeof hasError|((previous:typeof hasError)=>typeof hasError))=>{hasError=typeof next==="function"?(next as (previous:typeof hasError)=>typeof hasError)(hasError):next;};
let audioRef=$state({current:null as HTMLAudioElement | null|null});
$effect(()=>{src;return untrack(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setHasError(false);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  });});
const togglePlay = () => {
    if (!audioRef.current || hasError) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setHasError(true);
      });
    }
  };
const handleSeek = (e: Event & {currentTarget:HTMLInputElement}) => {
    if (!audioRef.current) return;
    const seekTime = Number(e.currentTarget.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
const cyclePlaybackRate = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };
const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem.toString().padStart(2, "0")}`;
  };
const progressPercent=$derived(duration > 0 ? (currentTime / duration) * 100 : 0);

import { cn } from '$lib/utils';</script>
{#if hasError}<div class="flex items-center gap-2 py-1 text-xs opacity-75">
        <SvgIcon name="AlertCircle" class="size-4" />
        <span>Audio could not be played</span>
      </div>{:else}<div class="flex items-center gap-2.5 py-1 min-w-[200px] sm:min-w-[240px]">
      
      <button type="button" onclick={togglePlay} class={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full shadow-xs transition-transform active:scale-90",
          isOutgoing
            ? "bg-white text-primary hover:bg-slate-100"
            : "bg-primary text-white hover:bg-primary/90"
        )} aria-label={isPlaying ? "Pause voice message" : "Play voice message"}>
        {#if isPlaying}<SvgIcon name="Pause" class="size-4 fill-current" />{:else}<SvgIcon name="Play" class="size-4 fill-current ml-0.5" />{/if}
      </button>

      
      <div class="flex-1 flex flex-col justify-center gap-1">
        <div class="relative flex items-center">
          <input type="range" min={0} max={duration || 100} value={currentTime} onchange={handleSeek} class={cn(
              "w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none",
              isOutgoing
                ? "bg-white/30 accent-white"
                : "bg-slate-200 accent-primary"
            )} style:background-size={`${progressPercent}% 100%`} aria-label="Audio scrubber" />
        </div>

        <div class={cn(
            "flex justify-between items-center text-[10px] tabular-nums font-medium",
            isOutgoing ? "text-emerald-100/90" : "text-muted"
          )}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      
      <button type="button" onclick={cyclePlaybackRate} class={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight transition-colors",
          isOutgoing
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
        )} title="Change playback speed" aria-label={`Playback speed ${playbackRate}x`}>
        {playbackRate}x
      </button>
    </div>{/if}
