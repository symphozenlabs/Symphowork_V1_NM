<script lang="ts">import type {Snippet} from 'svelte';let {class:className='',children}:{class?:string;children?:Snippet}=$props();</script>
<p class={'text-xs text-muted leading-relaxed mt-1 '+className}>{@render children?.()}</p>

