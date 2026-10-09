<script lang="ts">
  import { page } from "$app/state";
  let message = $state("Verifying your email…"); let error = $state("");
  $effect(() => { const token = page.url.searchParams.get("token"); if (!token) { message = "Verification link is missing its token."; return; } fetch("/api/auth/verify-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) }).then(async (response) => { const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error?.message ?? "Unable to verify email."); message = "Email verified successfully. You can sign in."; }).catch((cause) => { error = cause instanceof Error ? cause.message : "Unable to verify email."; message = "Email verification failed."; }); });
</script>
<section class="card"><p class="eyebrow">Account verification</p><h1>{message}</h1>{#if error}<p class="error" role="alert">{error}</p>{/if}<a href="/login">Go to sign in</a></section>
<style>
  .card { background: white; border: 1px solid #e1e7f0; border-radius: 1rem; margin: auto; max-width: 32rem; padding: 2rem; } .eyebrow { color: #168f76; font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; } .error { background: #fff1f1; border-radius: .5rem; color: #a52929; padding: .7rem; }
</style>
