<script lang="ts">
 import type { Snippet } from 'svelte';
 let {
  open = $bindable(false),
  title,
  children,
  class: className = '',
  lockScroll = false,
  onclose,
 }: {
  open?: boolean;
  title: string;
  children?: Snippet;
  class?: string;
  lockScroll?: boolean;
  onclose?: () => void;
 } = $props();

 let dialog: HTMLDialogElement;
 let previousFocus: HTMLElement | null = null;
 let wasOpen = false;

 function requestClose() {
  if (!open) return;
  open = false;
  onclose?.();
 }

 $effect(() => {
  if (!dialog) return;
  if (open && !wasOpen) {
   wasOpen = true;
   previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
   if (!dialog.open) dialog.showModal();
  } else if (!open && wasOpen) {
   wasOpen = false;
   if (dialog.open) dialog.close();
   const target = previousFocus;
   previousFocus = null;
   if (target?.isConnected) {
    queueMicrotask(() => target.focus());
   }
  }
 });

 $effect(() => {
  if (!open || !lockScroll) return;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => { document.body.style.overflow = previousOverflow; };
 });
</script>
<dialog
 bind:this={dialog}
 aria-label={title}
 class={'m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/50 focus:outline-none ' + className}
 onclose={() => { if (open) requestClose(); }}
 oncancel={(e) => { e.preventDefault(); requestClose(); }}
 onclick={(e) => { if (e.target === dialog) requestClose(); }}
 onkeydown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); requestClose(); } }}
>
 <div class="sticky -top-6 z-10 -mx-6 -mt-6 mb-5 flex items-center justify-between gap-4 border-b border-border/60 bg-inherit px-6 py-4">
  <h2 class="text-lg font-bold text-foreground">{title}</h2>
  <button
   type="button"
   class="rounded-lg px-2 py-1 text-muted hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
   aria-label="Close dialog"
   onclick={requestClose}
  >✕</button>
 </div>
 {@render children?.()}
</dialog>
