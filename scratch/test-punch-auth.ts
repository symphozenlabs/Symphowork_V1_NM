import { db } from "../src/db/client";
import { users, employees, memberships, roles } from "../src/db/schema";
import { can } from "../src/modules/tenancy/authorization";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Testing attendance punch authorization...");

  const testEmails = ["arjunsharma@gmail.com", "amit.employee@dev.local", "kavita.hr.exec@dev.local"];

  for (const email of testEmails) {
    const [u] = await db.select().from(users).where(eq(users.email, email));
    if (!u) {
      console.log(`User not found: ${email}`);
      continue;
    }

    const [mem] = await db.select().from(memberships).where(eq(memberships.userId, u.id));
    if (!mem) {
      console.log(`No active membership for user: ${email}`);
      continue;
    }

    const [role] = await db.select().from(roles).where(eq(roles.id, mem.roleId));
    console.log(`\nUser: ${email} (${u.fullName})`);
    console.log(`Organization: ${mem.organizationId}`);
    console.log(`Role: ${role?.key} (${role?.name})`);

    const [emp] = await db.select().from(employees).where(eq(employees.userId, u.id));
    console.log(`Employee: ${emp?.id} (${emp?.displayName}), status: ${emp?.status}, shiftId: ${emp?.shiftId}`);

    for (const perm of ["attendance.read", "attendance.clockin", "attendance.clockout", "attendance.break"] as const) {
      const allowed = await can({
        userId: u.id,
        organizationId: mem.organizationId,
        permission: perm,
      });
      console.log(`  Permission '${perm}': ${allowed}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
