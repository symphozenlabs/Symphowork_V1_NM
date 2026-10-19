import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/db/client");
  const { shifts, employees } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");

  console.log("=== SHIFT DETAILS ===");
  const shList = await db.select().from(shifts);
  console.log(JSON.stringify(shList, null, 2));

  console.log("=== EMPLOYEES SHIFT ASSIGNMENT ===");
  const empList = await db.select({
    id: employees.id,
    employeeId: employees.employeeId,
    displayName: employees.displayName,
    workEmail: employees.workEmail,
    shiftId: employees.shiftId,
  }).from(employees);
  console.log(JSON.stringify(empList, null, 2));
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
