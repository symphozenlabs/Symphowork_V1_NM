<script lang="ts">
  import { onMount } from "svelte";

  type RecordValue = Record<string, unknown>;
  let { title, description, endpoint } = $props<{ title: string; description: string; endpoint?: string }>();
  let data = $state<RecordValue>({});
  let error = $state("");
  let loading = $state(true);
  let refreshing = $state(false);
  let query = $state("");

  const label = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (value) => value.toUpperCase());
  const scalar = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return "Details available";
    return String(value);
  };
  const rows = () => {
    const candidate = Object.values(data).find((value) => Array.isArray(value));
    return (Array.isArray(candidate) ? candidate : []).filter((row) => {
      if (!query.trim()) return true;
      return JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase());
    }) as RecordValue[];
  };
  const metrics = () => Object.entries(data).filter(([, value]) => typeof value !== "object" || value === null).slice(0, 4);

  async function load() {
    if (!endpoint) { loading = false; return; }
    refreshing = true; error = "";
    try {
      const response = await fetch(endpoint);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error?.message ?? "Unable to load this workspace data.");
      data = body as RecordValue;
    } catch (cause) { error = cause instanceof Error ? cause.message : "Unable to load this workspace data."; }
    finally { loading = false; refreshing = false; }
  }

  onMount(load);
</script>

<svelte:head><title>{title} · SymphoWork</title></svelte:head>
<section class="heading"><div><p class="eyebrow">SymphoWork workspace</p><h1>{title}</h1><p class="description">{description}</p></div><button class="secondary" onclick={load} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh"}</button></section>
{#if loading}<div class="state">Loading workspace data…</div>
{:else if error}<div class="state error" role="alert"><strong>Unable to load this view.</strong><span>{error}</span><button class="secondary" onclick={load}>Try again</button></div>
{:else}
  {#if metrics().length}<div class="metrics">{#each metrics() as [key, value]}<div class="metric"><span>{label(key)}</span><strong>{scalar(value)}</strong></div>{/each}</div>{/if}
  {#if rows().length}
    <div class="toolbar"><div><h2>Records</h2><p>{rows().length} result{rows().length === 1 ? "" : "s"}</p></div><input aria-label="Filter records" bind:value={query} placeholder="Filter records" /></div>
    <div class="table-wrap"><table><thead><tr>{#each Object.keys(rows()[0]).filter((key) => !["organizationId", "userId", "tokenHash"].includes(key)).slice(0, 6) as key}<th>{label(key)}</th>{/each}</tr></thead><tbody>{#each rows() as row}<tr>{#each Object.keys(rows()[0]).filter((key) => !["organizationId", "userId", "tokenHash"].includes(key)).slice(0, 6) as key}<td>{scalar(row[key])}</td>{/each}</tr>{/each}</tbody></table></div>
  {:else}<div class="state empty"><h2>No records yet</h2><p>This workspace is connected and returned no records for your current authorization context.</p></div>{/if}
{/if}

<style>
  .heading { align-items: end; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 1.5rem; }
  .eyebrow { color: #168f76; font-size: .75rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); letter-spacing: -.04em; margin: .4rem 0; } h2 { margin: 0; } p { margin: .35rem 0 0; }
  .description, .toolbar p, .state p { color: #52617b; max-width: 50rem; }
  button, input { border: 1px solid #d7dfeb; border-radius: .55rem; font: inherit; padding: .65rem .8rem; } button { cursor: pointer; font-weight: 700; } button:disabled { cursor: wait; opacity: .6; } .secondary { background: white; color: #18304e; }
  .metrics { display: grid; gap: .8rem; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); margin-bottom: 1rem; } .metric, .state, .toolbar, .table-wrap { background: white; border: 1px solid #e1e7f0; border-radius: 1rem; } .metric { padding: 1rem; } .metric span { color: #52617b; display: block; font-size: .8rem; } .metric strong { display: block; font-size: 1.4rem; margin-top: .35rem; }
  .toolbar { align-items: center; display: flex; justify-content: space-between; margin-bottom: .75rem; padding: 1rem 1.25rem; } .toolbar input { max-width: 16rem; width: 100%; }
  .table-wrap { overflow-x: auto; } table { border-collapse: collapse; min-width: 42rem; width: 100%; } th, td { border-bottom: 1px solid #edf0f5; padding: .85rem 1rem; text-align: left; vertical-align: top; } th { color: #52617b; font-size: .75rem; letter-spacing: .04em; text-transform: uppercase; } tr:last-child td { border-bottom: 0; }
  .state { color: #52617b; display: flex; flex-direction: column; gap: .7rem; padding: 1.25rem; } .error { background: #fff7f7; border-color: #f1c4c4; color: #a52929; } .empty { min-height: 8rem; justify-content: center; }
  @media (max-width: 640px) { .heading, .toolbar { align-items: stretch; flex-direction: column; } .toolbar input { max-width: none; } }
</style>
