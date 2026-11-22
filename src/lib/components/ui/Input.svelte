<script lang="ts">
 import type { HTMLInputAttributes } from 'svelte/elements';
 let { value = $bindable(''), class: className = '', ...rest }: HTMLInputAttributes = $props();
</script>
<input class={'h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-2xs transition-colors placeholder:text-muted focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 aria-invalid:border-danger aria-invalid:focus-visible:outline-danger ' + className} {...rest} bind:value />

