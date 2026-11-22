<script lang="ts">
 import type { Snippet } from 'svelte';
 import type { HTMLButtonAttributes } from 'svelte/elements';
 let { variant = 'primary', size = 'md', class: className = '', children, ...rest }: HTMLButtonAttributes & { variant?: 'primary'|'secondary'|'outline'|'ghost'|'destructive'|'link'; size?: 'sm'|'md'|'lg'|'icon'; children?: Snippet } = $props();
 const variants = {
 primary: 'bg-primary text-primary-foreground shadow-xs hover:bg-secondary active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
 secondary: 'border border-border bg-surface text-foreground shadow-2xs hover:bg-[#F0F4ED] hover:border-accent/40 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
 outline: 'border border-border bg-transparent text-foreground hover:bg-[#F0F4ED] hover:text-primary active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
 ghost: 'text-muted hover:bg-[#F0F4ED] hover:text-primary active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
 destructive:'bg-danger text-white shadow-xs hover:bg-[#B91C32] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger',
 link:'text-primary underline-offset-4 hover:underline p-0 h-auto font-medium focus-visible:outline-2 focus-visible:outline-primary'
 };
 const sizes={sm:'h-9 px-3 text-xs',md:'h-10 px-4 text-sm',lg:'h-11 px-5 text-sm',icon:'size-9 p-0'};
</script>
<button class={['inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all select-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer',variants[variant],sizes[size],className].join(' ')} {...rest}>{@render children?.()}</button>

