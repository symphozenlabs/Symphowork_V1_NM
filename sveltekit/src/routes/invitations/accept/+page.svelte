<script lang="ts">
  import { page } from "$app/state";

  let fullName = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let invitation = $state<{ organization: { name: string }; invitedEmail: string }>();
  let error = $state("");
  let loading = $state(false);

  $effect(() => {
    const token = page.url.searchParams.get("token") ?? "";
    if (!token) { error = "This invitation link is missing its token."; return; }
    fetch(`/api/auth/invitations/accept/preview?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message ?? "Invitation unavailable.");
        invitation = body.invitation;
      })
      .catch((cause) => { error = cause instanceof Error ? cause.message : "Invitation unavailable."; });
  });

  async function submit() {
    const token = page.url.searchParams.get("token") ?? "";
    error = "";
    if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) { error = "Password must be 12 characters with upper, lower, and numeric characters."; return; }
    if (password !== confirmPassword) { error = "Passwords do not match."; return; }
    loading = true;
    try {
      const response = await fetch("/api/auth/invitations/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, fullName: fullName || undefined, password }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { error = body.error?.message ?? "Unable to accept invitation."; return; }
      window.location.assign("/app");
    } catch { error = "Unable to accept invitation. Check your connection and try again."; }
    finally { loading = false; }
  }
</script>

<section class="card">
  <p class="eyebrow">Business Owner onboarding</p>
  <h1>Accept invitation</h1>
  {#if error && !invitation}<p class="error" role="alert">{error}</p><a href="/login">Go to sign in</a>
  {:else if !invitation}<p class="muted">Checking invitation…</p>
  {:else}
    <div class="summary"><strong>{invitation.organization.name}</strong><span>Invited email: {invitation.invitedEmail}</span></div>
    <p class="muted">Create your password to enter this workspace. No separate registration is required.</p>
    <form onsubmit={(event) => { event.preventDefault(); submit(); }} aria-busy={loading}>
      <label>Full name <input bind:value={fullName} minlength="2" disabled={loading} /></label>
      <label>Password <input type="password" bind:value={password} minlength="12" required disabled={loading} /></label>
      <small class="muted">At least 12 characters with uppercase, lowercase, and a number.</small>
      <label>Confirm password <input type="password" bind:value={confirmPassword} minlength="12" required disabled={loading} /></label>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <button disabled={loading}>{loading ? "Accepting invitation…" : "Accept Invitation & Continue"}</button>
    </form>
  {/if}
</section>

<style>
  .card { background: white; border: 1px solid #e1e7f0; border-radius: 1rem; margin: auto; max-width: 34rem; padding: 2rem; }
  .eyebrow { color: #168f76; font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  .muted { color: #52617b; line-height: 1.6; }
  .summary { background: #f4f7fb; border-radius: .65rem; display: grid; gap: .35rem; margin: 1.5rem 0; padding: 1rem; }
  form { display: grid; gap: 1rem; margin-top: 1.5rem; }
  label { display: grid; gap: .4rem; font-size: .9rem; font-weight: 700; }
  input { border: 1px solid #cfd8e7; border-radius: .55rem; font: inherit; padding: .75rem; }
  button { background: #168f76; border: 0; border-radius: .55rem; color: white; cursor: pointer; font: inherit; font-weight: 750; padding: .8rem; }
  button:disabled { cursor: wait; opacity: .65; }
  .error { background: #fff1f1; border-radius: .55rem; color: #a52929; padding: .75rem; }
</style>
