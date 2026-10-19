import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

/**
 * Idempotent Tenant Role-Permission Synchronization Script
 *
 * This safe utility iterates through all active tenant organizations,
 * ensures system roles exist, and inserts any missing role-permissions
 * using ON CONFLICT DO NOTHING without modifying custom permissions.
 *
 * Usage:
 *   pnpm tsx scripts/sync-tenant-permissions.ts [organizationId]
 */
async function main() {
  const { db, sql } = await import("@/db/client");
  const { organizations } = await import("@/db/schema");
  const { syncOrganizationRolePermissions } = await import("@/modules/platform/provisioning");

  const targetOrgId = process.argv[2];

  let orgList: Array<{ id: string; name: string }>;
  if (targetOrgId) {
    orgList = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where((t, { eq }) => eq(t.id, targetOrgId));
  } else {
    orgList = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations);
  }

  console.log(`Found ${orgList.length} organization(s) to synchronize.`);

  for (const org of orgList) {
    console.log(`Synchronizing role permissions for: ${org.name} (${org.id})...`);
    const res = await syncOrganizationRolePermissions(org.id);
    console.log(` -> Synced ${res.roleCount} roles (${res.syncedCount} role-permission mappings verified).`);
  }

  console.log("Synchronization completed successfully.");
  await sql.end();
}

main().catch((err) => {
  console.error("Permission sync failed:", err);
  process.exit(1);
});
