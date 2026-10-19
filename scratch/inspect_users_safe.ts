import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { db, sql } = await import("@/db/client");
  const { organizations, users, memberships, roles, employees, departments, teams, invitations } = await import("@/db/schema");

  console.log("--- USERS (NO PASSWORDS) ---");
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    fullName: users.fullName,
    platformRole: users.platformRole,
    status: users.status
  }).from(users);
  console.log(allUsers);

  console.log("--- MEMBERSHIPS ---");
  const mems = await db.select({
    id: memberships.id,
    userId: memberships.userId,
    organizationId: memberships.organizationId,
    roleId: memberships.roleId,
    status: memberships.status
  }).from(memberships);
  console.log(mems);

  console.log("--- EMPLOYEES ---");
  const emps = await db.select({
    id: employees.id,
    organizationId: employees.organizationId,
    userId: employees.userId,
    employeeNumber: employees.employeeId,
    displayName: employees.displayName,
    email: employees.workEmail,
    departmentId: employees.departmentId,
    teamId: employees.teamId,
    status: employees.status
  }).from(employees);
  console.log(emps);

  console.log("--- INVITATIONS (NO TOKENS) ---");
  const invs = await db.select({
    id: invitations.id,
    organizationId: invitations.organizationId,
    employeeId: invitations.employeeId,
    invitedEmail: invitations.invitedEmail,
    intendedRole: invitations.intendedRole,
    status: invitations.status
  }).from(invitations);
  console.log(invs);

  await sql.end();
}

main().catch(console.error).finally(() => process.exit(0));
