<script lang="ts">
  import PortalShell from "$lib/PortalShell.svelte";
  let { children } = $props();
  const links = [
    { href: "/app", label: "Overview" }, { href: "/app/employees", label: "Employees" },
    { href: "/app/attendance", label: "Attendance" }, { href: "/app/leave", label: "Leave" },
    { href: "/app/payroll", label: "Payroll" }, { href: "/app/expenses", label: "Expenses" },
    { href: "/app/documents", label: "Documents" }, { href: "/app/recruitment", label: "Recruitment" },
    { href: "/app/approvals", label: "Approvals" }, { href: "/app/reports", label: "Reports" },
    { href: "/app/settings", label: "Settings" }
  ];
</script>
<PortalShell title="Workspace" {links}>{@render children()}</PortalShell>
