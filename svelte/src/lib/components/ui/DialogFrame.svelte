<script lang="ts">
import{type Snippet}from'svelte';let{open,onOpenChange,children}:{open:boolean;onOpenChange:(open:boolean)=>void;children:Snippet}=$props();let dialog:HTMLDialogElement;const id=$props.id();
$effect(()=>{if(!dialog)return;if(open&&!dialog.open)dialog.showModal();else if(!open&&dialog.open)dialog.close();});
</script>
<dialog bind:this={dialog} aria-labelledby={id} class="m-0 max-h-none max-w-none overflow-visible border-0 bg-transparent p-0 backdrop:bg-slate-900/60 backdrop:backdrop-blur-xs" oncancel={e=>{e.preventDefault();onOpenChange(false);}} onclick={e=>{if(e.target===dialog)onOpenChange(false);}} onkeydown={e=>{if(e.key==='Escape'){e.preventDefault();onOpenChange(false);}}}>
{#if open}<div id={id} class="sr-only">Configuration dialog</div>{@render children()}{/if}
</dialog>
