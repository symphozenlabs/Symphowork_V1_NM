<script lang="ts">
import type {Snippet} from 'svelte';
let {variant='default',class:className='',children}:{variant?:'default'|'neutral'|'success'|'warning'|'danger'|'info'|'outline';class?:string;children?:Snippet}=$props();
const variants={default:'border-emerald-200/90 bg-success-bg text-primary',neutral:'border-border bg-slate-100 text-slate-700',success:'border-emerald-200/90 bg-success-bg text-secondary',warning:'border-amber-200 bg-warning-bg text-warning',danger:'border-rose-200 bg-danger-bg text-danger',info:'border-sky-200 bg-info-bg text-info',outline:'border-border bg-transparent text-foreground'};
</script>
<span class={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border '+variants[variant]+' '+className}>{@render children?.()}</span>

