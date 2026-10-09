<script lang="ts">
  import { onMount } from "svelte";

  type Item = Record<string, unknown>;
  const resources = [
    { key: "departments", label: "Departments", endpoint: "/api/app/master-data/departments", writable: true },
    { key: "designations", label: "Designations", endpoint: "/api/app/master-data/designations", writable: true },
    { key: "locations", label: "Locations", endpoint: "/api/app/master-data/locations", writable: true },
    { key: "teams", label: "Teams", endpoint: "/api/app/master-data/teams", writable: true },
    { key: "employment-types", label: "Employment types", endpoint: "/api/app/master-data/employment-types", writable: true },
    { key: "shifts", label: "Shifts", endpoint: "/api/app/master-data/shifts", writable: false },
    { key: "holidays", label: "Holidays", endpoint: "/api/app/master-data/holidays", writable: false },
    { key: "working-days", label: "Working days", endpoint: "/api/app/master-data/working-days", writable: false }
  ] as const;
  let active = $state<string>(resources[0].key);
  let records = $state<Record<string, Item[]>>({});
  let loading = $state(true); let saving = $state(false); let error = $state(""); let notice = $state("");
  let name = $state(""); let code = $state("");
  const current = () => resources.find((resource) => resource.key === active) ?? resources[0];
  const label = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (value) => value.toUpperCase());

  async function load() {
    loading = true; error = "";
    try {
      const results = await Promise.all(resources.map(async (resource) => {
        const response = await fetch(resource.endpoint); const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error?.message ?? `Unable to load ${resource.label.toLowerCase()}.`);
        return [resource.key, Array.isArray(body.items) ? body.items : []] as const;
      }));
      records = Object.fromEntries(results);
    } catch (cause) { error = cause instanceof Error ? cause.message : "Unable to load organization settings."; }
    finally { loading = false; }
  }
  async function create() {
    if (!name.trim() || !code.trim()) { error = "Name and code are required."; return; }
    saving = true; error = ""; notice = "";
    try {
      const response = await fetch(current().endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim(), code: code.trim() }) });
      const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error?.message ?? "Unable to create this record.");
      name = ""; code = ""; notice = `${current().label.slice(0, -1)} created.`; await load();
    } catch (cause) { error = cause instanceof Error ? cause.message : "Unable to create this record."; }
    finally { saving = false; }
  }
  onMount(load);
</script>

<svelte:head><title>Organization settings · SymphoWork</title></svelte:head>
<section class="heading"><div><p class="eyebrow">Organization setup</p><h1>Organization settings</h1><p>Manage tenant master data through the existing authorized APIs.</p></div><button class="secondary" onclick={load} disabled={loading}>Refresh all</button></section>
{#if error}<div class="alert" role="alert">{error}</div>{/if}{#if notice}<div class="success" role="status">{notice}</div>{/if}
<div class="layout"><nav class="tabs" aria-label="Master data sections">{#each resources as resource}<button class:active={active === resource.key} onclick={() => { active = resource.key; notice = ""; }}>{resource.label}<span>{records[resource.key]?.length ?? 0}</span></button>{/each}</nav>
  <div class="content"><div class="content-head"><div><p class="eyebrow">{current().label}</p><h2>{records[active]?.length ?? 0} records</h2></div>{#if current().writable}<div class="form"><input aria-label="Name" bind:value={name} placeholder="Name" /><input aria-label="Code" bind:value={code} placeholder="Code" /><button onclick={create} disabled={saving}>{saving ? "Saving…" : "Add"}</button></div>{/if}</div>
    {#if loading}<div class="state">Loading settings…</div>{:else if records[active]?.length}<div class="table-wrap"><table><thead><tr>{#each Object.keys(records[active][0]).filter((key) => !["organizationId"].includes(key)).slice(0, 6) as key}<th>{label(key)}</th>{/each}</tr></thead><tbody>{#each records[active] as row}<tr>{#each Object.keys(records[active][0]).filter((key) => !["organizationId"].includes(key)).slice(0, 6) as key}<td>{row[key] === null || row[key] === undefined ? "—" : typeof row[key] === "object" ? "Details available" : String(row[key])}</td>{/each}</tr>{/each}</tbody></table></div>{:else}<div class="state"><h3>No {current().label.toLowerCase()} configured</h3><p>{current().writable ? "Use the form above to add the first record." : "This section is connected and currently has no records."}</p></div>{/if}
  </div>
</div>

<style>
  .heading { align-items: end; display: flex; justify-content: space-between; margin-bottom: 1.25rem; } .eyebrow { color: #168f76; font-size: .75rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; } h1 { margin: .4rem 0; } h2, h3 { margin: 0; } p { color: #52617b; margin: .35rem 0 0; } button, input { border: 1px solid #d7dfeb; border-radius: .55rem; font: inherit; padding: .65rem .75rem; } button { cursor: pointer; font-weight: 700; } button:disabled { cursor: wait; opacity: .6; } .secondary { background: white; color: #18304e; } .alert, .success { border-radius: .65rem; margin-bottom: 1rem; padding: .8rem 1rem; } .alert { background: #fff1f1; color: #a52929; } .success { background: #ecfbf4; color: #13714f; }
  .layout { display: grid; gap: 1rem; grid-template-columns: 14rem 1fr; } .tabs, .content, .state, .table-wrap { background: white; border: 1px solid #e1e7f0; border-radius: 1rem; } .tabs { align-self: start; display: grid; gap: .25rem; padding: .5rem; } .tabs button { align-items: center; background: transparent; border: 0; display: flex; justify-content: space-between; text-align: left; width: 100%; } .tabs button.active { background: #e9f8f3; color: #13714f; } .tabs span { color: #52617b; font-size: .8rem; }
  .content { min-width: 0; padding: 1.25rem; } .content-head { align-items: end; display: flex; justify-content: space-between; margin-bottom: 1rem; } .form { display: flex; gap: .5rem; } .form input { max-width: 10rem; } .form button { background: #13714f; color: white; }
  .table-wrap { overflow-x: auto; } table { border-collapse: collapse; min-width: 32rem; width: 100%; } th, td { border-bottom: 1px solid #edf0f5; padding: .75rem; text-align: left; } th { color: #52617b; font-size: .75rem; text-transform: uppercase; } .state { color: #52617b; padding: 2rem; } @media (max-width: 760px) { .heading, .content-head { align-items: stretch; flex-direction: column; gap: .8rem; } .layout { grid-template-columns: 1fr; } .tabs { grid-template-columns: repeat(2, 1fr); } .form { flex-wrap: wrap; } .form input { flex: 1; max-width: none; } }
</style>
