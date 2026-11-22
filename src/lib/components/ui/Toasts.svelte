<script lang="ts">import {toasts} from '$lib/client/toast';</script>
<div class="fixed right-4 bottom-4 z-[100] flex max-w-sm flex-col gap-3" aria-live="polite">
 {#each $toasts as toast (toast.id)}
  <div role={toast.type==='error'?'alert':'status'} class={'rounded-xl border bg-surface px-4 py-3 text-sm shadow-lg '+(toast.type==='error'?'border-danger-border text-danger':toast.type==='success'?'border-success-border text-success':'border-border text-foreground')}>{toast.message}</div>
 {/each}
</div>

