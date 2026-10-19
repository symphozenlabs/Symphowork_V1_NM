import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { performance } from "node:perf_hooks";
import { eq, and } from "drizzle-orm";
import { ALL_PERMISSION_KEYS, ROLE_PERMISSIONS, type Permission } from "../src/modules/rbac/permissions";

async function runOptimizedTest() {
  const { sql, db, withTenantTransaction, withUserTransaction } = await import("../src/db/client");
  const { departments, employees, memberships, organizations, permissions, rolePermissions, roles, shifts, teams } = await import("../src/db/schema");

  console.log("=================================================");
  console.log("      SYMPHOWORK V1 - PHASE 1 OPTIMIZATION TEST  ");
  console.log("=================================================");

  // Find active membership & org
  const [activeMembership] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.status, "active"))
    .limit(1);

  if (!activeMembership) {
    console.error("No active membership found in database.");
    process.exit(1);
  }

  const [activeOrg] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, activeMembership.organizationId))
    .limit(1);

  const testUserId = activeMembership.userId;
  const testOrgId = activeOrg.id;
  console.log(`[Test Subject] Org: ${activeOrg.slug || activeOrg.id}, User: ${testUserId}`);

  // -------------------------------------------------------------------
  // BEFORE OPTIMIZATION SIMULATION
  // -------------------------------------------------------------------
  console.log("\n>>> RUNNING UNOPTIMIZED (BASELINE) FLOW <<<");
  const beforeStart = performance.now();
  let beforeQueries = 0;

  // 1. resolveTenantContext (unoptimized)
  const bAcquire1 = performance.now();
  const bMem = await withUserTransaction(testUserId, async (tx) => {
    beforeQueries += 2; // set_config + membership query
    return tx.query.memberships.findFirst({
      where: and(eq(memberships.userId, testUserId), eq(memberships.status, "active")),
    });
  });

  beforeQueries += 1; // org query
  const bOrg = await db.query.organizations.findFirst({
    where: eq(organizations.id, bMem!.organizationId),
  });

  const bRole = await withTenantTransaction(bMem!.organizationId, async (tx) => {
    beforeQueries += 2; // set_config + role query
    return tx.query.roles.findFirst({
      where: eq(roles.id, bMem!.roleId),
    });
  });

  // 2. authorize() (unoptimized)
  beforeQueries += 1; // duplicate membership
  const bDupMem = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, testUserId),
      eq(memberships.organizationId, testOrgId),
      eq(memberships.status, "active")
    ),
  });

  beforeQueries += 1; // rolePermissions join
  const bPermRows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, bDupMem!.roleId));

  beforeQueries += 1; // duplicate role query
  const bDupRole = await db.query.roles?.findFirst?.({
    where: eq(roles.id, bDupMem!.roleId),
  });

  // 3. Route query (shifts)
  beforeQueries += 1;
  const bShifts = await db.select().from(shifts).where(eq(shifts.organizationId, testOrgId));

  const beforeTotalMs = performance.now() - beforeStart;
  console.log(`Unoptimized Total Duration: ${beforeTotalMs.toFixed(2)} ms`);
  console.log(`Unoptimized Total Queries: ${beforeQueries}`);

  // -------------------------------------------------------------------
  // AFTER OPTIMIZATION SIMULATION (PHASE 1)
  // -------------------------------------------------------------------
  console.log("\n>>> RUNNING OPTIMIZED (PHASE 1) FLOW <<<");
  const afterStart = performance.now();
  let afterQueries = 0;

  // 1. resolveTenantContext: preserves withUserTransaction, RLS, and withTenantTransaction
  const aAcquire1 = performance.now();
  const aMem = await withUserTransaction(testUserId, async (tx) => {
    afterQueries += 2; // set_config + membership query
    return tx.query.memberships.findFirst({
      where: and(eq(memberships.userId, testUserId), eq(memberships.status, "active")),
    });
  });

  afterQueries += 1; // org query
  const aOrg = await db.query.organizations.findFirst({
    where: eq(organizations.id, aMem!.organizationId),
  });

  const aRole = await withTenantTransaction(aMem!.organizationId, async (tx) => {
    afterQueries += 2; // set_config + role query
    return tx.query.roles.findFirst({
      where: eq(roles.id, aMem!.roleId),
    });
  });

  const resolvedTenant = {
    user: { id: testUserId, platformRole: "NONE" },
    organization: aOrg,
    membership: aMem,
    role: aRole,
    permissions: (aRole?.key ? (ROLE_PERMISSIONS[aRole.key] || []) : []) as readonly string[],
  };

  // 2. authorize() (OPTIMIZED): Reuses resolved tenant context
  // NO duplicate membership query!
  // NO duplicate roles query!
  // If role is in ROLE_PERMISSIONS, immediate in-memory permission check!
  const hasPerm = resolvedTenant.role?.key === "ORGANIZATION_OWNER" 
    ? true 
    : (resolvedTenant.permissions as readonly string[]).includes("organization.settings.read");
  // afterQueries += 0!

  // 3. Route query (shifts)
  afterQueries += 1;
  const aShifts = await db.select().from(shifts).where(eq(shifts.organizationId, testOrgId));

  const afterTotalMs = performance.now() - afterStart;
  console.log(`Optimized Total Duration: ${afterTotalMs.toFixed(2)} ms`);
  console.log(`Optimized Total Queries: ${afterQueries}`);

  console.log("\n=================================================");
  console.log("            PHASE 1 COMPARISON SUMMARY           ");
  console.log("=================================================");
  console.log(`Duration:  ${beforeTotalMs.toFixed(2)} ms  ==>  ${afterTotalMs.toFixed(2)} ms  (${(beforeTotalMs - afterTotalMs).toFixed(2)} ms saved, ${(((beforeTotalMs - afterTotalMs) / beforeTotalMs) * 100).toFixed(1)}% faster)`);
  console.log(`Queries:   ${beforeQueries} queries  ==>  ${afterQueries} queries  (${beforeQueries - afterQueries} queries eliminated)`);

  await sql.end();
}

runOptimizedTest().catch(console.error);
