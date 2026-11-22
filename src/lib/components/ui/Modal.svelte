<script lang="ts">
 import type { Snippet } from 'svelte';
 let { open = $bindable(false), title, children, class: className = '' }: { open?: boolean; title:string; children?:Snippet; class?:string } = $props();
 let dialog: HTMLDialogElement;
 $effect(() => { if (!dialog) return; if(open && !dialog.open) dialog.showModal(); else if(!open && dialog.open) dialog.close(); });
</script>
<dialog bind:this={dialog} aria-label={title} class={'m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/50 '+className} onclose={()=>open=false} oncancel={()=>open=false} onclick={e=>{if(e.target===dialog)open=false;}} onkeydown={e=>{if(e.key==='Escape')open=false;}}>
 <div class="mb-5 flex items-center justify-between gap-4"><h2 class="text-lg font-bold">{title}</h2><button type="button" class="rounded-lg px-2 py-1 text-muted hover:bg-background" aria-label="Close dialog" onclick={()=>open=false}>✕</button></div>
 {@render children?.()}
</dialog>

