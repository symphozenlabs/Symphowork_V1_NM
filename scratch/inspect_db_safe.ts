import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { db, sql } = await import("@/db/client");
  const { organizations, users, memberships, roles, employees, departments, teams } = await import("@/db/schema");

  console.log("--- ORGANIZATIONS ---");
  const orgs = await db.select({ id: organizations.id, name: organizations.name, slug: organizations.slug, status: organizations.status }).from(organizations);
  console.log(orgs);

  console.log("--- ROLES ---");
  const allRoles = await db.select({ id: roles.id, organizationId: roles.organizationId, key: roles.key, name: roles.name }).from(roles);
  console.log(allRoles);

  console.log("--- DEPARTMENTS ---");
  const depts = await db.select().from(departments);
  console.log(depts.map(d => ({ id: d.id, organizationId: d.organizationId, code: d.code, name: d.name, headEmployeeId: d.headEmployeeId, status: d.status })));

  console.log("--- TEAMS ---");
  const allTeams = await db.select().from(teams);
  console.log(allTeams.map(t => ({ id: t.id, organizationId: t.organizationId, departmentId: t.departmentId, code: t.code, name: t.name })));

  console.log("--- USERS (NO PASSWORDS) ---");
  const allUsers = await db.select({ id: users.id, email: users.email, fullName: users.fullName, isPlatformOwner: users.isPlatformOwner, status: users.status }).from(users);
  console.log(allUsers);

  console.log("--- MEMBERSHIPS ---");
  const mems = await db.select({ id: memberships.id, userId: memberships.userId, organizationId: memberships.organizationId, roleId: memberships.roleId, status: memberships.status }).from(memberships);
  console.log(mems);

  console.log("--- EMPLOYEES ---");
  const emps = await db.select({ id: employees.id, organizationId: employees.organizationId, userId: employees.userId, employeeNumber: employees.employeeId, displayName: employees.displayName, email: employees.workEmail, departmentId: employees.departmentId, teamId: employees.teamId, status: employees.status }).from(employees);
  console.log(emps);

  await sql.end();
}

main().catch(console.error).finally(() => process.exit(0));
