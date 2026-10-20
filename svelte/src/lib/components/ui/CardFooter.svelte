<script lang="ts">import type {Snippet} from 'svelte';let {class:className='',children}:{class?:string;children?:Snippet}=$props();</script>
<div class={'flex items-center p-5 pt-0 border-t border-border mt-3 '+className}>{@render children?.()}</div>

