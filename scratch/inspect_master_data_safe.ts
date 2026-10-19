import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/db/client");
  const { departments, designations, shifts, employmentTypes, locations, organizations, roles } = await import("../src/db/schema");
  const orgs = await db.select({ id: organizations.id, name: organizations.name, slug: organizations.slug }).from(organizations);
  console.log("Organizations:", JSON.stringify(orgs, null, 2));

  for (const org of orgs) {
    console.log(`\n--- Org: ${org.name} (${org.id}) ---`);
    const depts = await db.select().from(departments);
    console.log(`Departments count: ${depts.length}`);
    for (const d of depts) {
      console.log(`  Dept: [${d.id}] ${d.code} - ${d.name} (org: ${d.organizationId})`);
    }

    const desigs = await db.select().from(designations);
    console.log(`Designations count: ${desigs.length}`);
    for (const d of desigs) {
      console.log(`  Desig: [${d.id}] ${d.code} - ${d.name} (org: ${d.organizationId})`);
    }

    const shs = await db.select().from(shifts);
    console.log(`Shifts count: ${shs.length}`);
    for (const s of shs) {
      console.log(`  Shift: [${s.id}] ${s.code} - ${s.name} (${s.startTime} - ${s.endTime}) (org: ${s.organizationId})`);
    }

    const ets = await db.select().from(employmentTypes);
    console.log(`EmploymentTypes count: ${ets.length}`);
    for (const e of ets) {
      console.log(`  EmpType: [${e.id}] ${e.code} - ${e.name} (org: ${e.organizationId})`);
    }

    const locs = await db.select().from(locations);
    console.log(`Locations count: ${locs.length}`);
    for (const l of locs) {
      console.log(`  Location: [${l.id}] ${l.code} - ${l.name} (org: ${l.organizationId})`);
    }

    const rls = await db.select().from(roles);
    console.log(`Roles count: ${rls.length}`);
    for (const r of rls) {
      console.log(`  Role: [${r.id}] ${r.key} - ${r.name} (org: ${r.organizationId})`);
    }
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
