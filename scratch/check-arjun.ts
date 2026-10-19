import { db } from "../src/db/client";
import { users, employees, memberships, roles, shifts, organizations } from "../src/db/schema";
import { eq, or, ilike } from "drizzle-orm";

async function main() {
  console.log("Searching for Arjun...");
  const matchedUsers = await db.select().from(users).where(
    or(
      ilike(users.email, "%arjun%"),
      ilike(users.fullName, "%arjun%")
    )
  );
  console.log("Matched users:", JSON.stringify(matchedUsers, null, 2));

  const matchedEmployees = await db.select().from(employees).where(
    or(
      ilike(employees.displayName, "%arjun%"),
      ilike(employees.workEmail, "%arjun%"),
      ilike(employees.personalEmail, "%arjun%")
    )
  );
  console.log("Matched employees:", JSON.stringify(matchedEmployees, null, 2));

  for (const u of matchedUsers) {
    const mems = await db.select().from(memberships).where(eq(memberships.userId, u.id));
    console.log(`Memberships for user ${u.id} (${u.email}):`, mems);
    for (const m of mems) {
      const [r] = await db.select().from(roles).where(eq(roles.id, m.roleId));
      console.log(`Role for membership ${m.id}:`, r);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
