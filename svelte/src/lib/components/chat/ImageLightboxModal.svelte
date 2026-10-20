<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface ImageLightboxModalProps {
  src: string;
  alt: string;
  fileName: string;
  onClose: () => void;
}
let dialogElement=$state<HTMLDivElement | undefined>(undefined);
let {
  src,
  alt,
  fileName,
  onClose,
}:ImageLightboxModalProps=$props();

$effect(() => { dialogElement?.focus(); });
</script>
<div bind:this={dialogElement} role="dialog" tabindex="-1" aria-modal="true" aria-label="Image Preview" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150" onclick={(event) => { if (event.target === event.currentTarget) onClose(); }} onkeydown={(event) => { if (event.key === "Escape") onClose(); }}>
      <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
        
        <div class="absolute top-2 right-2 flex items-center gap-2 z-10 bg-black/50 backdrop-blur-md rounded-full px-2 py-1">
          <a href={src} download={fileName} class="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors" title="Download image" aria-label="Download image">
            <SvgIcon name="Download" class="size-4" />
          </a>
          <button type="button" onclick={onClose} class="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors" aria-label="Close image preview">
            <SvgIcon name="X" class="size-4" />
          </button>
        </div>

        
        
        <img src={src} alt={alt || fileName} class="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl" />

        
        <div class="mt-2 text-xs text-white/90 text-center truncate max-w-md bg-black/40 px-3 py-1 rounded-full">
          {fileName}
        </div>
      </div>
    </div>
