"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  isOutgoing?: boolean;
}

export function AudioPlayer({ src, isOutgoing = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
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
  }, [src]);

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = Number(e.target.value);
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

  if (hasError) {
    return (
      <div className="flex items-center gap-2 py-1 text-xs opacity-75">
        <AlertCircle className="size-4" />
        <span>Audio could not be played</span>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[200px] sm:min-w-[240px]">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full shadow-xs transition-transform active:scale-90",
          isOutgoing
            ? "bg-white text-primary hover:bg-slate-100"
            : "bg-primary text-white hover:bg-primary/90"
        )}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
      >
        {isPlaying ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Scrubber & Duration */}
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className={cn(
              "w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none",
              isOutgoing
                ? "bg-white/30 accent-white"
                : "bg-slate-200 accent-primary"
            )}
            style={{
              backgroundSize: `${progressPercent}% 100%`,
            }}
            aria-label="Audio scrubber"
          />
        </div>

        <div
          className={cn(
            "flex justify-between items-center text-[10px] tabular-nums font-medium",
            isOutgoing ? "text-emerald-100/90" : "text-muted"
          )}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback speed toggle */}
      <button
        type="button"
        onClick={cyclePlaybackRate}
        className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight transition-colors",
          isOutgoing
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
        )}
        title="Change playback speed"
        aria-label={`Playback speed ${playbackRate}x`}
      >
        {playbackRate}x
      </button>
    </div>
  );
}
