import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { db, sql } = await import("@/db/client");
  const { organizations, employees, memberships, roles, departments } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  console.log("=== Organizations ===");
  const orgs = await db.select().from(organizations);
  console.log(orgs.map(o => ({ id: o.id, name: o.name, slug: o.slug })));

  console.log("=== Roles in DB ===");
  const allRoles = await db.select().from(roles);
  console.log(allRoles.map(r => ({ id: r.id, key: r.key, name: r.name })));

  console.log("=== Departments ===");
  const depts = await db.select().from(departments);
  console.log(depts.map(d => ({ id: d.id, orgId: d.organizationId, name: d.name, code: d.code, head: d.headEmployeeId })));

  console.log("=== Employees & Memberships ===");
  for (const org of orgs) {
    console.log(`\n--- Org: ${org.name} (${org.id}) ---`);
    const orgEmps = await db.select().from(employees).where(eq(employees.organizationId, org.id));
    console.log(`Found ${orgEmps.length} employees`);
    for (const emp of orgEmps) {
      let roleInfo = "no user/membership";
      if (emp.userId) {
        const mems = await db
          .select({ roleKey: roles.key, roleName: roles.name })
          .from(memberships)
          .innerJoin(roles, eq(roles.id, memberships.roleId))
          .where(eq(memberships.userId, emp.userId));
        roleInfo = mems.map(m => m.roleKey).join(", ") || "no role in membership";
      }
      console.log(`- ${emp.displayName} (${emp.employeeId}): status=${emp.status}, jobTitle=${emp.jobTitle}, userId=${emp.userId}, roles=[${roleInfo}]`);
    }
  }

  await sql.end();
}

main().catch(console.error).finally(() => process.exit(0));
