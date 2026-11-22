<script lang="ts">
 import Modal from './Modal.svelte';import Button from './Button.svelte';
 let{open=$bindable(false),onOpenChange,title,description,confirmText='Confirm',cancelText='Cancel',variant='primary',isLoading=false,onConfirm}:{open?:boolean;onOpenChange?:(value:boolean)=>void;title:string;description:string|import('svelte').Snippet;confirmText?:string;cancelText?:string;variant?:'primary'|'destructive'|'warning';isLoading?:boolean;onConfirm:()=>void|Promise<void>}=$props();
 $effect(()=>{if(!open)onOpenChange?.(false);});
</script>
<Modal bind:open {title}><div class="mb-6 text-sm leading-relaxed text-muted">{#if typeof description==='string'}{description}{:else}{@render description()}{/if}</div><div class="flex justify-end gap-3"><Button variant="secondary" disabled={isLoading} onclick={()=>{open=false;onOpenChange?.(false);}}>{cancelText}</Button><Button variant={variant==='warning'?'primary':variant} disabled={isLoading} onclick={onConfirm}>{isLoading?'Please wait…':confirmText}</Button></div></Modal>

