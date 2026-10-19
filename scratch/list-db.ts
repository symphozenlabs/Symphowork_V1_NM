import { db } from "../src/db/client";
import { users, organizations, memberships, roles, employees } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function listAll() {
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    platformRole: users.platformRole,
    status: users.status
  }).from(users);
  console.log("Users:", allUsers);

  const allMemberships = await db.select({
    id: memberships.id,
    userId: memberships.userId,
    organizationId: memberships.organizationId,
    roleId: memberships.roleId,
    status: memberships.status
  }).from(memberships);
  console.log("Memberships:", allMemberships);

  const allRoles = await db.select({
    id: roles.id,
    key: roles.key,
    name: roles.name,
    organizationId: roles.organizationId
  }).from(roles);
  console.log("Roles:", allRoles);

  const allEmployees = await db.select({
    id: employees.id,
    userId: employees.userId,
    displayName: employees.displayName,
    departmentId: employees.departmentId,
    status: employees.status
  }).from(employees);
  console.log("Employees:", allEmployees);
}

listAll().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
