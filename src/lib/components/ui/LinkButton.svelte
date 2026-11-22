<script lang="ts">
 import type {Snippet} from 'svelte';import type {HTMLAnchorAttributes} from 'svelte/elements';
 let {variant='primary',size='md',class:className='',children,...rest}:HTMLAnchorAttributes&{variant?:'primary'|'secondary'|'outline'|'ghost'|'link';size?:'sm'|'md'|'lg'|'icon';children?:Snippet}=$props();
 const variants={primary:'bg-primary text-primary-foreground shadow-xs hover:bg-secondary active:scale-[0.99]',secondary:'border border-border bg-surface text-foreground shadow-2xs hover:bg-[#F0F4ED] hover:border-accent/40',outline:'border border-border bg-transparent text-foreground hover:bg-[#F0F4ED] hover:text-primary',ghost:'text-muted hover:bg-[#F0F4ED] hover:text-primary',link:'text-primary underline-offset-4 hover:underline p-0 h-auto font-medium'};
 const sizes={sm:'h-9 px-3 text-xs',md:'h-10 px-4 text-sm',lg:'h-11 px-5 text-sm',icon:'size-9 p-0'};
</script>
<a class={'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary '+variants[variant]+' '+sizes[size]+' '+className} {...rest}>{@render children?.()}</a>

