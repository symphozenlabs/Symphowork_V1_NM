import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { and, eq } = await import("drizzle-orm");
  const { db, sql } = await import("@/db/client");
  const {
    employees,
    memberships,
    organizations,
    roles,
    shifts,
    users,
  } = await import("@/db/schema");
  const { authenticate } = await import("@/modules/identity/auth");

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "naresh-technologies"))
    .limit(1);

  if (!org) throw new Error("Org not found");

  const [shift1] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.organizationId, org.id), eq(shifts.code, "GENERAL_DAY")))
    .limit(1);

  const [shift2] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.organizationId, org.id), eq(shifts.code, "SHIFT_2_EVENING")))
    .limit(1);

  console.log("=== SHIFTS VERIFICATION ===");
  console.log(`Shift 1: ${shift1.name} [${shift1.id}] (${shift1.startTime} - ${shift1.endTime}) Overnight: ${shift1.overnight}`);
  console.log(`Shift 2: ${shift2.name} [${shift2.id}] (${shift2.startTime} - ${shift2.endTime}) Overnight: ${shift2.overnight}`);

  const accounts = [
    // Shift 1
    { role: "HR_EXECUTIVE", email: "kavita.hr.exec@dev.local", pwd: "TestUser@2026#Sympho", shift: shift1.id, shiftName: "Shift 1" },
    { role: "HR_ADMIN", email: "arjunsharma@gmail.com", pwd: "Naresh@27452005", shift: shift1.id, shiftName: "Shift 1" },
    { role: "MANAGER", email: "anand.manager@dev.local", pwd: "TestUser@2026#Sympho", shift: shift1.id, shiftName: "Shift 1" },
    { role: "TEAM_LEAD", email: "vikram.lead@dev.local", pwd: "TestUser@2026#Sympho", shift: shift1.id, shiftName: "Shift 1" },
    { role: "EMPLOYEE", email: "amit.employee@dev.local", pwd: "TestUser@2026#Sympho", shift: shift1.id, shiftName: "Shift 1" },
    { role: "FINANCE_ADMIN", email: "suresh.finance@dev.local", pwd: "TestUser@2026#Sympho", shift: shift1.id, shiftName: "Shift 1" },
    { role: "PROJECT_MANAGER", email: "rohan.pm@dev.local", pwd: "TestUser@2026#Sympho", shift: shift1.id, shiftName: "Shift 1" },
    { role: "RECRUITER", email: "sneha.recruiter@dev.local", pwd: "TestUser@2026#Sympho", shift: shift1.id, shiftName: "Shift 1" },

    // Shift 2
    { role: "HR_EXECUTIVE", email: "attendance.hrexec.shift2@dev.local", pwd: "TestUser@2026#Sympho", shift: shift2.id, shiftName: "Shift 2" },
    { role: "HR_ADMIN", email: "attendance.hradmin.shift2@dev.local", pwd: "TestUser@2026#Sympho", shift: shift2.id, shiftName: "Shift 2" },
    { role: "MANAGER", email: "attendance.manager.shift2@dev.local", pwd: "TestUser@2026#Sympho", shift: shift2.id, shiftName: "Shift 2" },
    { role: "TEAM_LEAD", email: "attendance.teamlead.shift2@dev.local", pwd: "TestUser@2026#Sympho", shift: shift2.id, shiftName: "Shift 2" },
    { role: "EMPLOYEE", email: "attendance.employee.shift2@dev.local", pwd: "TestUser@2026#Sympho", shift: shift2.id, shiftName: "Shift 2" },
    { role: "FINANCE_ADMIN", email: "attendance.finance.shift2@dev.local", pwd: "TestUser@2026#Sympho", shift: shift2.id, shiftName: "Shift 2" },
    { role: "PROJECT_MANAGER", email: "attendance.pm.shift2@dev.local", pwd: "TestUser@2026#Sympho", shift: shift2.id, shiftName: "Shift 2" },
    { role: "RECRUITER", email: "attendance.recruiter.shift2@dev.local", pwd: "TestUser@2026#Sympho", shift: shift2.id, shiftName: "Shift 2" },
  ];

  console.log("\n=== VERIFYING 16 ACCOUNTS (8 ROLES x 2 SHIFTS) ===");
  let verifiedCount = 0;

  for (const acc of accounts) {
    const auth = await authenticate({ email: acc.email, password: acc.pwd });
    if (!auth?.user?.id) {
      throw new Error(`Auth failed for ${acc.email}`);
    }

    const [emp] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.organizationId, org.id), eq(employees.userId, auth.user.id)))
      .limit(1);

    if (!emp) throw new Error(`Employee record missing for ${acc.email}`);
    if (emp.shiftId !== acc.shift) {
      throw new Error(`Shift mismatch for ${acc.email}: expected ${acc.shift}, got ${emp.shiftId}`);
    }

    const [mem] = await db
      .select({ roleKey: roles.key })
      .from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .where(and(eq(memberships.organizationId, org.id), eq(memberships.userId, auth.user.id)))
      .limit(1);

    if (mem?.roleKey !== acc.role) {
      throw new Error(`Role mismatch for ${acc.email}: expected ${acc.role}, got ${mem?.roleKey}`);
    }

    console.log(`✓ [${acc.shiftName}] ${acc.role.padEnd(16)} | ${emp.displayName.padEnd(42)} | ${acc.email.padEnd(38)} | Verified`);
    verifiedCount++;
  }

  console.log(`\nSuccessfully verified ${verifiedCount} / ${accounts.length} accounts!`);
  await sql.end();
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
