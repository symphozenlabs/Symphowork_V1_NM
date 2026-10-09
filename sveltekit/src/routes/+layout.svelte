<script lang="ts">
  let { children } = $props();
</script>

<svelte:head>
  <title>SymphoWork</title>
  <meta name="description" content="SymphoWork workspace" />
</svelte:head>

<div class="shell">
  <header class="topbar">
    <a class="brand" href="/">SymphoWork</a>
    <nav aria-label="Primary navigation">
      <a href="/login">Sign in</a>
      <a href="/invitations/accept">Accept invitation</a>
    </nav>
  </header>
  <main>{@render children()}</main>
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: #f6f8fb; color: #17233d; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  .shell { min-height: 100vh; }
  .topbar { align-items: center; background: #17233d; color: white; display: flex; justify-content: space-between; padding: 1rem clamp(1rem, 5vw, 5rem); }
  .brand { color: white; font-size: 1.1rem; font-weight: 750; text-decoration: none; }
  nav { display: flex; gap: 1rem; }
  nav a { color: #dce7ff; font-size: .9rem; text-decoration: none; }
  nav a:hover { color: white; }
  main { margin: 0 auto; max-width: 72rem; padding: clamp(2rem, 7vw, 6rem) 1rem; }
</style>
