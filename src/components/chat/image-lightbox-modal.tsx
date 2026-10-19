"use client";

import React, { useEffect } from "react";
import { X, Download } from "lucide-react";

interface ImageLightboxModalProps {
  src: string;
  alt: string;
  fileName: string;
  onClose: () => void;
}

export function ImageLightboxModal({
  src,
  alt,
  fileName,
  onClose,
}: ImageLightboxModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="Image Preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls Bar */}
        <div className="absolute top-2 right-2 flex items-center gap-2 z-10 bg-black/50 backdrop-blur-md rounded-full px-2 py-1">
          <a
            href={src}
            download={fileName}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            title="Download image"
            aria-label="Download image"
          >
            <Download className="size-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Close image preview"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Full Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || fileName}
          className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
        />

        {/* Caption/Filename */}
        <div className="mt-2 text-xs text-white/90 text-center truncate max-w-md bg-black/40 px-3 py-1 rounded-full">
          {fileName}
        </div>
      </div>
    </div>
  );
}
