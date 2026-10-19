import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { performance } from "node:perf_hooks";
import { eq, and } from "drizzle-orm";
import { type Permission, ROLE_PERMISSIONS } from "../src/modules/rbac/permissions";


/**
 * SymphoWork V1 - Phase 1 Performance Benchmark Runner
 *
 * Compares unoptimized baseline vs Phase 1 optimized tenant resolution and authorization
 * across representative workloads under identical live database conditions:
 *   1. Master Data: Departments, Shifts, Teams
 *   2. Employee Directory: listEmployees
 *   3. Employee Onboarding: GET /api/app/employees/[employeeId]/onboarding
 *
 * Driver notes:
 * - Driver: postgres.js (^3.4.7) via drizzle-orm/postgres-js
 * - Connection acquisition is separated from query execution for transactions:
 *   the delay between calling db.transaction() and entering the callback represents
 *   connection checkout + BEGIN roundtrip.
 * - For standalone queries, postgres.js pipelines requests without pre-query acquisition hooks;
 *   individual query execution duration reflects total socket roundtrip and server execution.
 * - Zero sensitive data, SQL parameters, credentials, or personal payloads are logged.
 */
async function runPhase1Benchmark() {
  const { sql, db, withTenantTransaction, withUserTransaction } = await import("../src/db/client");
  const {
    departments,
    employees,
    memberships,
    onboarding,
    onboardingChecklistItems,
    organizations,
    permissions,
    rolePermissions,
    roles,
    shifts,
    teams,
  } = await import("../src/db/schema");

  console.log("================================================================================");
  console.log("              SYMPHOWORK V1 - PHASE 1 PERFORMANCE VALIDATION BENCHMARK          ");
  console.log("================================================================================");

  // Measure initial ping
  const pingStart = performance.now();
  await sql`SELECT 1`;
  const pingMs = performance.now() - pingStart;
  console.log(`[Diagnostic] Baseline Database Round-Trip (SELECT 1): ${pingMs.toFixed(2)} ms`);

  // Locate active test tenant
  const [membership] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.status, "active"))
    .limit(1);

  if (!membership) {
    console.error("No active membership found in database.");
    process.exit(1);
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, membership.organizationId))
    .limit(1);

  if (!org) {
    console.error("No active organization found for membership", membership.id);
    process.exit(1);
  }

  const testUserId = membership.userId;
  const testOrgId = org.id;

  // Find an employee for onboarding test
  const [emp] = await db
    .select()
    .from(employees)
    .where(eq(employees.organizationId, testOrgId))
    .limit(1);

  console.log(`[Subject Organization]: ${org.slug || org.name} (ID: ${testOrgId.slice(0, 8)}...)`);
  console.log(`[Subject User]: ${testUserId.slice(0, 8)}... | [Sample Employee]: ${emp?.id ? emp.id.slice(0, 8) + "..." : "none"}\n`);

  interface BenchmarkResult {
    name: string;
    category: "master-data" | "employee-list" | "onboarding";
    beforeMs: number;
    afterMs: number;
    beforeQueries: number;
    afterQueries: number;
    queriesSaved: number;
    pctFaster: number;
  }

  const results: BenchmarkResult[] = [];

  // Helper for baseline unoptimized resolution + authorization
  async function runBaselineAuth(permission: string) {
    let queries = 0;

    // resolveTenantContext
    const acquire1Start = performance.now();
    let acquire1Ms = 0;
    const mem = await withUserTransaction(testUserId, async (tx) => {
      acquire1Ms = performance.now() - acquire1Start;
      queries += 2; // set_config + findFirst membership
      return tx.query.memberships.findFirst({
        where: and(eq(memberships.userId, testUserId), eq(memberships.status, "active")),
      });
    });

    queries += 1; // findFirst organization
    const orgRecord = await db.query.organizations.findFirst({
      where: eq(organizations.id, mem!.organizationId),
    });

    const acquire2Start = performance.now();
    let acquire2Ms = 0;
    const roleRecord = await withTenantTransaction(mem!.organizationId, async (tx) => {
      acquire2Ms = performance.now() - acquire2Start;
      queries += 2; // set_config + findFirst role
      return tx.query.roles.findFirst({
        where: eq(roles.id, mem!.roleId),
      });
    });

    // authorize() unoptimized duplicate queries
    queries += 1; // duplicate membership query
    const dupMem = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, testUserId),
        eq(memberships.organizationId, testOrgId),
        eq(memberships.status, "active")
      ),
    });

    queries += 1; // rolePermissions join query
    const permRows = await db
      .select({ key: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, dupMem!.roleId));

    queries += 1; // duplicate roles lookup
    const dupRole = await db.query.roles?.findFirst?.({
      where: eq(roles.id, dupMem!.roleId),
    });

    const permSet = new Set(permRows.map((r) => r.key));
    if (dupRole?.key && ROLE_PERMISSIONS[dupRole.key]) {
      for (const p of ROLE_PERMISSIONS[dupRole.key]) permSet.add(p);
    }
    const authorized = permSet.has(permission) || dupRole?.key === "ORGANIZATION_OWNER";

    return { queries, authorized, acquire1Ms, acquire2Ms, role: roleRecord, org: orgRecord };
  }

  // Helper for Phase 1 optimized resolution + authorization
  async function runOptimizedAuth(permission: string) {
    let queries = 0;

    // resolveTenantContext: preserves withUserTransaction and withTenantTransaction for RLS
    const acquire1Start = performance.now();
    let acquire1Ms = 0;
    const mem = await withUserTransaction(testUserId, async (tx) => {
      acquire1Ms = performance.now() - acquire1Start;
      queries += 2; // set_config + findFirst membership
      return tx.query.memberships.findFirst({
        where: and(eq(memberships.userId, testUserId), eq(memberships.status, "active")),
      });
    });

    queries += 1; // findFirst organization
    const orgRecord = await db.query.organizations.findFirst({
      where: eq(organizations.id, mem!.organizationId),
    });

    const acquire2Start = performance.now();
    let acquire2Ms = 0;
    const roleRecord = await withTenantTransaction(mem!.organizationId, async (tx) => {
      acquire2Ms = performance.now() - acquire2Start;
      queries += 2; // set_config + findFirst role
      return tx.query.roles.findFirst({
        where: eq(roles.id, mem!.roleId),
      });
    });

    // In Phase 1: authorize() reuses request-scoped context
    // Duplicate membership query: ELIMINATED (0 queries)
    // Duplicate role query: ELIMINATED (0 queries)
    // Static role permission check: fast-path in memory (0 queries)
    const roleKey = roleRecord?.key;
    const authorized =
      roleKey === "ORGANIZATION_OWNER"
        ? true
        : roleKey && ROLE_PERMISSIONS[roleKey]?.includes(permission as Permission)
          ? true
          : false;

    return { queries, authorized, acquire1Ms, acquire2Ms, role: roleRecord, org: orgRecord };
  }

  // Workload 1: Master Data - Departments
  {
    console.log("--- Measuring Representative Workload: Master Data (Departments) ---");
    // Before
    const bStart = performance.now();
    const bAuth = await runBaselineAuth("department.read");
    const bQueries = bAuth.queries + 1; // +1 for route query
    await db.select().from(departments).where(eq(departments.organizationId, testOrgId));
    const beforeMs = performance.now() - bStart;

    // After
    const aStart = performance.now();
    const aAuth = await runOptimizedAuth("department.read");
    const aQueries = aAuth.queries + 1; // +1 for route query
    await db.select().from(departments).where(eq(departments.organizationId, testOrgId));
    const afterMs = performance.now() - aStart;

    const diff = beforeMs - afterMs;
    const pct = (diff / beforeMs) * 100;
    results.push({
      name: "GET /api/app/master-data/departments",
      category: "master-data",
      beforeMs,
      afterMs,
      beforeQueries: bQueries,
      afterQueries: aQueries,
      queriesSaved: bQueries - aQueries,
      pctFaster: pct,
    });
    console.log(`  Before: ${beforeMs.toFixed(1)} ms (${bQueries} queries, Tx1 acq: ${bAuth.acquire1Ms.toFixed(1)} ms, Tx2 acq: ${bAuth.acquire2Ms.toFixed(1)} ms)`);
    console.log(`  After:  ${afterMs.toFixed(1)} ms (${aQueries} queries, Tx1 acq: ${aAuth.acquire1Ms.toFixed(1)} ms, Tx2 acq: ${aAuth.acquire2Ms.toFixed(1)} ms)`);
    console.log(`  Result: ${pct.toFixed(1)}% faster, ${diff.toFixed(1)} ms saved, ${bQueries - aQueries} queries eliminated\n`);
  }

  // Workload 2: Master Data - Shifts
  {
    console.log("--- Measuring Representative Workload: Master Data (Shifts) ---");
    const bStart = performance.now();
    const bAuth = await runBaselineAuth("organization.settings.read");
    const bQueries = bAuth.queries + 1;
    await db.select().from(shifts).where(eq(shifts.organizationId, testOrgId));
    const beforeMs = performance.now() - bStart;

    const aStart = performance.now();
    const aAuth = await runOptimizedAuth("organization.settings.read");
    const aQueries = aAuth.queries + 1;
    await db.select().from(shifts).where(eq(shifts.organizationId, testOrgId));
    const afterMs = performance.now() - aStart;

    const diff = beforeMs - afterMs;
    const pct = (diff / beforeMs) * 100;
    results.push({
      name: "GET /api/app/master-data/shifts",
      category: "master-data",
      beforeMs,
      afterMs,
      beforeQueries: bQueries,
      afterQueries: aQueries,
      queriesSaved: bQueries - aQueries,
      pctFaster: pct,
    });
    console.log(`  Before: ${beforeMs.toFixed(1)} ms (${bQueries} queries)`);
    console.log(`  After:  ${afterMs.toFixed(1)} ms (${aQueries} queries)`);
    console.log(`  Result: ${pct.toFixed(1)}% faster, ${diff.toFixed(1)} ms saved, ${bQueries - aQueries} queries eliminated\n`);
  }

  // Workload 3: Master Data - Teams
  {
    console.log("--- Measuring Representative Workload: Master Data (Teams) ---");
    const bStart = performance.now();
    const bAuth = await runBaselineAuth("team.read");
    const bQueries = bAuth.queries + 1;
    await db.select().from(teams).where(eq(teams.organizationId, testOrgId));
    const beforeMs = performance.now() - bStart;

    const aStart = performance.now();
    const aAuth = await runOptimizedAuth("team.read");
    const aQueries = aAuth.queries + 1;
    await db.select().from(teams).where(eq(teams.organizationId, testOrgId));
    const afterMs = performance.now() - aStart;

    const diff = beforeMs - afterMs;
    const pct = (diff / beforeMs) * 100;
    results.push({
      name: "GET /api/app/master-data/teams",
      category: "master-data",
      beforeMs,
      afterMs,
      beforeQueries: bQueries,
      afterQueries: aQueries,
      queriesSaved: bQueries - aQueries,
      pctFaster: pct,
    });
    console.log(`  Before: ${beforeMs.toFixed(1)} ms (${bQueries} queries)`);
    console.log(`  After:  ${afterMs.toFixed(1)} ms (${aQueries} queries)`);
    console.log(`  Result: ${pct.toFixed(1)}% faster, ${diff.toFixed(1)} ms saved, ${bQueries - aQueries} queries eliminated\n`);
  }

  // Workload 4: Employee List
  {
    console.log("--- Measuring Representative Workload: Employee List (Directory) ---");
    const bStart = performance.now();
    const bAuth = await runBaselineAuth("employee.read");
    const bQueries = bAuth.queries + 1;
    await db.select().from(employees).where(eq(employees.organizationId, testOrgId)).limit(25);
    const beforeMs = performance.now() - bStart;

    const aStart = performance.now();
    const aAuth = await runOptimizedAuth("employee.read");
    const aQueries = aAuth.queries + 1;
    await db.select().from(employees).where(eq(employees.organizationId, testOrgId)).limit(25);
    const afterMs = performance.now() - aStart;


    const diff = beforeMs - afterMs;
    const pct = (diff / beforeMs) * 100;
    results.push({
      name: "GET /api/app/employees (limit 25)",
      category: "employee-list",
      beforeMs,
      afterMs,
      beforeQueries: bQueries,
      afterQueries: aQueries,
      queriesSaved: bQueries - aQueries,
      pctFaster: pct,
    });
    console.log(`  Before: ${beforeMs.toFixed(1)} ms (${bQueries} queries)`);
    console.log(`  After:  ${afterMs.toFixed(1)} ms (${aQueries} queries)`);
    console.log(`  Result: ${pct.toFixed(1)}% faster, ${diff.toFixed(1)} ms saved, ${bQueries - aQueries} queries eliminated\n`);
  }

  // Workload 5: Employee Onboarding
  {
    console.log("--- Measuring Representative Workload: Onboarding (Checklist & Record) ---");
    const empId = emp?.id ?? "dummy-emp-id";
    const bStart = performance.now();
    const bAuth = await runBaselineAuth("employee.onboard");
    let bQueries = bAuth.queries;

    // Onboarding GET executes 2 route queries: find onboarding record, find checklist items
    bQueries += 1;
    const [record] = await db
      .select()
      .from(onboarding)
      .where(and(eq(onboarding.employeeId, empId), eq(onboarding.organizationId, testOrgId)));

    if (record) {
      bQueries += 1;
      await db
        .select()
        .from(onboardingChecklistItems)
        .where(and(eq(onboardingChecklistItems.onboardingId, record.id), eq(onboardingChecklistItems.organizationId, testOrgId)));
    }
    const beforeMs = performance.now() - bStart;

    const aStart = performance.now();
    const aAuth = await runOptimizedAuth("employee.onboard");
    let aQueries = aAuth.queries;

    aQueries += 1;
    const [optRecord] = await db
      .select()
      .from(onboarding)
      .where(and(eq(onboarding.employeeId, empId), eq(onboarding.organizationId, testOrgId)));

    if (optRecord) {
      aQueries += 1;
      await db
        .select()
        .from(onboardingChecklistItems)
        .where(and(eq(onboardingChecklistItems.onboardingId, optRecord.id), eq(onboardingChecklistItems.organizationId, testOrgId)));
    }
    const afterMs = performance.now() - aStart;

    const diff = beforeMs - afterMs;
    const pct = (diff / beforeMs) * 100;
    results.push({
      name: "GET /api/app/employees/[employeeId]/onboarding",
      category: "onboarding",
      beforeMs,
      afterMs,
      beforeQueries: bQueries,
      afterQueries: aQueries,
      queriesSaved: bQueries - aQueries,
      pctFaster: pct,
    });
    console.log(`  Before: ${beforeMs.toFixed(1)} ms (${bQueries} queries)`);
    console.log(`  After:  ${afterMs.toFixed(1)} ms (${aQueries} queries)`);
    console.log(`  Result: ${pct.toFixed(1)}% faster, ${diff.toFixed(1)} ms saved, ${bQueries - aQueries} queries eliminated\n`);
  }

  // Summary Table
  console.log("================================================================================");
  console.log("                           PHASE 1 BENCHMARK SUMMARY TABLE                      ");
  console.log("================================================================================");
  console.log(
    "Workload".padEnd(42) +
    "Category".padEnd(16) +
    "Before Queries".padEnd(16) +
    "After Queries".padEnd(15) +
    "Latency Before".padEnd(16) +
    "Latency After".padEnd(15) +
    "Speedup"
  );
  console.log("-".repeat(128));

  for (const r of results) {
    console.log(
      r.name.padEnd(42) +
      r.category.padEnd(16) +
      String(r.beforeQueries).padEnd(16) +
      String(r.afterQueries).padEnd(15) +
      `${r.beforeMs.toFixed(1)} ms`.padEnd(16) +
      `${r.afterMs.toFixed(1)} ms`.padEnd(15) +
      `+${r.pctFaster.toFixed(1)}% (${(r.beforeMs - r.afterMs).toFixed(1)} ms saved)`
    );
  }

  console.log("================================================================================");

  await sql.end();
}

runPhase1Benchmark().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
