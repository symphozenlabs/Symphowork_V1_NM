<script lang="ts">import type {Snippet} from 'svelte';let {class:className='',children}:{class?:string;children?:Snippet}=$props();</script>
<div class={'p-5 pb-3 '+className}>{@render children?.()}</div>

