import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { performance } from "node:perf_hooks";
import { eq, and } from "drizzle-orm";
import { ROLE_PERMISSIONS } from "../src/modules/rbac/permissions";

async function runBaseline() {
  const { sql, db, withTenantTransaction, withUserTransaction } = await import("../src/db/client");
  const { departments, employees, memberships, organizations, permissions, rolePermissions, roles, shifts, teams } = await import("../src/db/schema");

  console.log("=================================================");
  console.log("       SYMPHOWORK V1 - PERFORMANCE BASELINE      ");
  console.log("=================================================");

  // 1. Measure raw database ping / TCP roundtrip
  const pingStart = performance.now();
  await sql`SELECT 1`;
  const pingMs = performance.now() - pingStart;
  console.log(`[Diagnostic] Direct DB Ping RTT: ${pingMs.toFixed(2)} ms`);

  // Find an active membership from DB to test realistic tenant flow
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

  if (!activeOrg) {
    console.error("No active organization found for membership", activeMembership.id);
    process.exit(1);
  }

  const testUserId = activeMembership.userId;
  const testOrgId = activeOrg.id;
  console.log(`[Test Subject] Org: ${activeOrg.slug || activeOrg.id}, User: ${testUserId}`);

  // Test 1: Current resolveTenantContext implementation
  console.log("\n--- TEST 1: Current resolveTenantContext ---");
  const resolveStart = performance.now();
  let stepQueryCount = 0;

  // Step 1a: Membership find inside withUserTransaction
  const acquireStart1 = performance.now();
  let acquireMs1 = 0;
  const mem = await withUserTransaction(testUserId, async (tx) => {
    acquireMs1 = performance.now() - acquireStart1;
    stepQueryCount++; // set_config
    stepQueryCount++; // select membership
    return tx.query.memberships.findFirst({
      where: and(eq(memberships.userId, testUserId), eq(memberships.status, "active")),
    });
  });

  // Step 1b: Organization lookup on db
  stepQueryCount++;
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, mem!.organizationId),
  });

  // Step 1c: Role lookup inside withTenantTransaction
  const acquireStart2 = performance.now();
  let acquireMs2 = 0;
  const role = await withTenantTransaction(mem!.organizationId, async (tx) => {
    acquireMs2 = performance.now() - acquireStart2;
    stepQueryCount++; // set_config
    stepQueryCount++; // select role
    return tx.query.roles.findFirst({
      where: eq(roles.id, mem!.roleId),
    });
  });

  const resolveTotalMs = performance.now() - resolveStart;
  console.log(`resolveTenantContext Duration: ${resolveTotalMs.toFixed(2)} ms`);
  console.log(`Queries executed: ${stepQueryCount} (includes 2 set_config, 1 membership, 1 org, 1 role)`);
  console.log(`Connection acquisition + BEGIN: Tx1: ${acquireMs1.toFixed(2)} ms, Tx2: ${acquireMs2.toFixed(2)} ms`);

  // Test 2: Current authorize() implementation (following resolveTenantContext)
  console.log("\n--- TEST 2: Current authorize() immediately following resolveTenantContext ---");
  const authStart = performance.now();
  let authQueryCount = 0;

  // can() executes membership query again
  authQueryCount++;
  const duplicateMem = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, testUserId),
      eq(memberships.organizationId, testOrgId),
      eq(memberships.status, "active")
    ),
  });

  // can() executes getRolePermissionSet
  authQueryCount++; // rolePermissions inner join permissions
  const permRows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, duplicateMem!.roleId));

  authQueryCount++; // roles query duplicate
  const duplicateRole = await db.query.roles?.findFirst?.({
    where: eq(roles.id, duplicateMem!.roleId),
  });

  const permSet = new Set(permRows.map((r) => r.key));
  if (duplicateRole && duplicateRole.key && ROLE_PERMISSIONS[duplicateRole.key]) {
    for (const p of ROLE_PERMISSIONS[duplicateRole.key]) {
      permSet.add(p);
    }
  }

  const authTotalMs = performance.now() - authStart;
  console.log(`authorize Duration: ${authTotalMs.toFixed(2)} ms`);
  console.log(`Duplicate Queries executed: ${authQueryCount} (1 duplicate membership, 1 rolePermissions join, 1 duplicate role)`);

  // Test 3: Master Data - Shifts (/api/app/master-data/shifts)
  console.log("\n--- TEST 3: Full shifts endpoint simulation ---");
  const shiftsStart = performance.now();
  // Handler query
  const shiftItems = await db.select().from(shifts).where(eq(shifts.organizationId, testOrgId));
  const shiftsRouteQueryMs = performance.now() - shiftsStart;
  const shiftsTotalMs = shiftsRouteQueryMs + resolveTotalMs + authTotalMs;
  console.log(`Shifts Route Handler query only: ${shiftsRouteQueryMs.toFixed(2)} ms`);
  console.log(`Total Shifts Endpoint Duration (Auth + Route Query): ${shiftsTotalMs.toFixed(2)} ms`);
  console.log(`Total Sequential Queries for Shifts: ${stepQueryCount + authQueryCount + 1}`);

  // Test 4: Master Data - Departments (/api/app/master-data/departments)
  console.log("\n--- TEST 4: Full departments endpoint simulation ---");
  const deptsStart = performance.now();
  const deptItems = await db.select().from(departments).where(eq(departments.organizationId, testOrgId));
  const deptsRouteQueryMs = performance.now() - deptsStart;
  const deptsTotalMs = deptsRouteQueryMs + resolveTotalMs + authTotalMs;
  console.log(`Departments Route Handler query only: ${deptsRouteQueryMs.toFixed(2)} ms`);
  console.log(`Total Departments Endpoint Duration: ${deptsTotalMs.toFixed(2)} ms`);
  console.log(`Total Sequential Queries for Departments: ${stepQueryCount + authQueryCount + 1}`);

  // Test 5: Master Data - Teams (/api/app/master-data/teams)
  console.log("\n--- TEST 5: Full teams endpoint simulation ---");
  const teamsStart = performance.now();
  const teamItems = await db.select().from(teams).where(eq(teams.organizationId, testOrgId));
  const teamsRouteQueryMs = performance.now() - teamsStart;
  const teamsTotalMs = teamsRouteQueryMs + resolveTotalMs + authTotalMs;
  console.log(`Teams Route Handler query only: ${teamsRouteQueryMs.toFixed(2)} ms`);
  console.log(`Total Teams Endpoint Duration: ${teamsTotalMs.toFixed(2)} ms`);
  console.log(`Total Sequential Queries for Teams: ${stepQueryCount + authQueryCount + 1}`);

  // Test 6: Employees list query
  console.log("\n--- TEST 6: Employee list query simulation ---");
  const empStart = performance.now();
  const empCount = await db.select().from(employees).where(eq(employees.organizationId, testOrgId)).limit(25);
  const empRouteQueryMs = performance.now() - empStart;
  const empTotalMs = empRouteQueryMs + resolveTotalMs + authTotalMs;
  console.log(`Employee List (limit 25) query only: ${empRouteQueryMs.toFixed(2)} ms`);
  console.log(`Total Employees (page 1) Duration: ${empTotalMs.toFixed(2)} ms`);

  await sql.end();
}

runBaseline().catch(console.error);
