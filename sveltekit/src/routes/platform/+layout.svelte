<script lang="ts">
  import PortalShell from "$lib/PortalShell.svelte";
  let { children } = $props();
  const links = [
    { href: "/platform", label: "Overview" }, { href: "/platform/organizations", label: "Organizations" },
    { href: "/platform/provisioning", label: "Provisioning" }, { href: "/platform/plans", label: "Plans" },
    { href: "/platform/subscriptions", label: "Subscriptions" }, { href: "/platform/analytics", label: "Analytics" },
    { href: "/platform/health", label: "Health" }, { href: "/platform/support", label: "Support" },
    { href: "/platform/configuration", label: "Configuration" }, { href: "/platform/users", label: "Platform users" },
    { href: "/platform/audit", label: "Audit" }
  ];
</script>
<PortalShell title="Platform console" {links}>{@render children()}</PortalShell>
