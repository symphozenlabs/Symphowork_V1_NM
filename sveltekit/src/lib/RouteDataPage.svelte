<script lang="ts">
  import { onMount } from "svelte";
  let { title, description, endpoint } = $props<{ title: string; description: string; endpoint?: string }>();
  let data = $state<unknown>(); let error = $state(""); let loading = $state(true);
  onMount(async () => { if (!endpoint) { loading = false; return; } try { const response = await fetch(endpoint); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error?.message ?? "Unable to load this page."); data = body; } catch (cause) { error = cause instanceof Error ? cause.message : "Unable to load this page."; } finally { loading = false; } });
</script>
<section class="heading"><p class="eyebrow">SymphoWork</p><h1>{title}</h1><p>{description}</p></section>{#if loading}<div class="state">Loading…</div>{:else if error}<div class="state error" role="alert">{error}</div>{:else}<div class="state"><h2>Live workspace data</h2>{#if data}<pre>{JSON.stringify(data, null, 2)}</pre>{:else}<p>No data is available for this view yet.</p>{/if}</div>{/if}
<style>
  .heading { margin-bottom: 1.5rem; } .eyebrow { color: #168f76; font-size: .75rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; } h1 { margin: .4rem 0; } .heading p:last-child, .state { color: #52617b; } .state { background: white; border: 1px solid #e1e7f0; border-radius: 1rem; padding: 1.25rem; } .error { background: #fff1f1; color: #a52929; } pre { background: #f6f8fb; border-radius: .6rem; max-height: 34rem; overflow: auto; padding: 1rem; white-space: pre-wrap; }
</style>
