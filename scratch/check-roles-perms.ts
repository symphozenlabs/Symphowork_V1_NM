import { db } from "../src/db/client";
import { roles, rolePermissions, permissions } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Checking DB roles and permissions...");
  const dbRoles = await db.select().from(roles);
  for (const r of dbRoles) {
    const rps = await db
      .select({ key: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, r.id));
    console.log(`Role: ${r.key} (${r.name}), Org: ${r.organizationId}, DB Perms count: ${rps.length}`);
    const attPerms = rps.filter((p) => p.key.startsWith("attendance"));
    console.log(`  Attendance DB perms:`, attPerms.map((p) => p.key));
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
