<script lang="ts">
  let email = $state("");
  let password = $state("");
  let error = $state("");
  let loading = $state(false);

  async function submit() {
    error = "";
    loading = true;
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        error = body.error?.message ?? "Unable to sign in.";
        return;
      }
      window.location.assign("/app");
    } catch {
      error = "Unable to sign in. Check your connection and try again.";
    } finally {
      loading = false;
    }
  }
</script>

<section class="card">
  <p class="eyebrow">Workspace access</p>
  <h1>Sign in</h1>
  <p class="muted">Use your existing SymphoWork account.</p>
  <form onsubmit={(event) => { event.preventDefault(); submit(); }} aria-busy={loading}>
    <label>Email <input type="email" bind:value={email} autocomplete="email" required disabled={loading} /></label>
    <label>Password <input type="password" bind:value={password} autocomplete="current-password" required disabled={loading} /></label>
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <button disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
  </form>
  <a class="muted link" href="/">Back to home</a>
</section>

<style>
  .card { background: white; border: 1px solid #e1e7f0; border-radius: 1rem; margin: auto; max-width: 30rem; padding: 2rem; }
  .eyebrow { color: #168f76; font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin-bottom: .25rem; }
  .muted { color: #52617b; }
  form { display: grid; gap: 1rem; margin-top: 1.5rem; }
  label { display: grid; gap: .4rem; font-size: .9rem; font-weight: 700; }
  input { border: 1px solid #cfd8e7; border-radius: .55rem; font: inherit; padding: .75rem; }
  button { background: #168f76; border: 0; border-radius: .55rem; color: white; cursor: pointer; font: inherit; font-weight: 750; padding: .8rem; }
  button:disabled { cursor: wait; opacity: .65; }
  .error { background: #fff1f1; border-radius: .55rem; color: #a52929; padding: .75rem; }
  .link { display: inline-block; margin-top: 1.25rem; }
</style>
