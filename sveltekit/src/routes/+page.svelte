<svelte:head>
  <title>SymphoWork | Workspace</title>
</svelte:head>

<section class="hero">
  <p class="eyebrow">SvelteKit migration workspace</p>
  <h1>People operations, connected.</h1>
  <p class="lede">This SvelteKit surface is being introduced alongside the existing SymphoWork application. Authentication and invitation flows are the first migration slice.</p>
  <div class="actions">
    <a class="primary" href="/login">Sign in</a>
    <a class="secondary" href="/invitations/accept">Accept an invitation</a>
  </div>
</section>

<style>
  .hero { background: white; border: 1px solid #e1e7f0; border-radius: 1.25rem; box-shadow: 0 1rem 3rem rgb(23 35 61 / 8%); margin: 0 auto; max-width: 48rem; padding: clamp(2rem, 7vw, 5rem); }
  .eyebrow { color: #168f76; font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  h1 { font-size: clamp(2.2rem, 6vw, 4.6rem); letter-spacing: -.05em; line-height: .98; margin: 1rem 0; }
  .lede { color: #52617b; font-size: 1.05rem; line-height: 1.7; max-width: 40rem; }
  .actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 2rem; }
  a { border-radius: .65rem; font-weight: 700; padding: .75rem 1rem; text-decoration: none; }
  .primary { background: #168f76; color: white; }
  .secondary { border: 1px solid #cfd8e7; color: #17233d; }
</style>
