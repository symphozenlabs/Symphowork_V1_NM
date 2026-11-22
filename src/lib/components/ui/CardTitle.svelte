<script lang="ts">import type {Snippet} from 'svelte';let {class:className='',children}:{class?:string;children?:Snippet}=$props();</script>
<h2 class={'text-base font-semibold tracking-tight text-foreground '+className}>{@render children?.()}</h2>

