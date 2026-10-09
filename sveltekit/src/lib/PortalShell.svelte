<script lang="ts">
  type Link = { href: string; label: string };
  let { title, links, children } = $props<{ title: string; links: Link[]; children: () => unknown }>();
</script>

<div class="portal">
  <aside>
    <a class="brand" href="/">SymphoWork <small>{title}</small></a>
    <nav aria-label={`${title} navigation`}>
      {#each links as link}<a href={link.href}>{link.label}</a>{/each}
    </nav>
    <a class="signout" href="/login">Sign out</a>
  </aside>
  <section class="content">
    <header><span>{title}</span><a href="/app/profile">Profile</a></header>
    <main>{@render children()}</main>
  </section>
</div>

<style>
  .portal { background: #f6f8fb; display: grid; grid-template-columns: 16rem 1fr; min-height: 100vh; }
  aside { background: #17233d; color: white; display: flex; flex-direction: column; padding: 1.25rem; }
  .brand { color: white; font-size: 1.15rem; font-weight: 800; text-decoration: none; }
  .brand small { color: #9db1d9; display: block; font-size: .75rem; font-weight: 500; margin-top: .3rem; }
  nav { display: grid; gap: .25rem; margin-top: 2rem; }
  nav a, .signout { border-radius: .5rem; color: #dbe5fb; padding: .65rem .75rem; text-decoration: none; }
  nav a:hover, .signout:hover { background: #273b63; color: white; }
  .signout { margin-top: auto; }
  .content { min-width: 0; }
  header { align-items: center; background: white; border-bottom: 1px solid #e1e7f0; display: flex; justify-content: space-between; padding: 1rem 2rem; }
  header a { color: #168f76; font-weight: 700; text-decoration: none; }
  main { margin: 0 auto; max-width: 100rem; padding: 2rem; }
  @media (max-width: 760px) { .portal { grid-template-columns: 1fr; } aside { padding: .8rem; } nav { display: flex; flex-wrap: wrap; margin-top: 1rem; } .signout { margin-top: .5rem; } main { padding: 1rem; } }
</style>
