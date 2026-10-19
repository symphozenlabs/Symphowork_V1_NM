import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TEST_PASSWORD = "TestUser@2026#Sympho";

interface Shift2AccountDef {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  roleKey: string;
  departmentCode: string;
  teamCode?: string;
}

const SHIFT_2_ACCOUNTS: Shift2AccountDef[] = [
  {
    firstName: "Kavita",
    lastName: "Menon (Shift 2)",
    displayName: "Attendance Test - HR Executive - Shift 2",
    email: "attendance.hrexec.shift2@dev.local",
    phone: "+919876543221",
    roleKey: "HR_EXECUTIVE",
    departmentCode: "HR",
  },
  {
    firstName: "Arjun",
    lastName: "Kumar (Shift 2)",
    displayName: "Attendance Test - HR Admin - Shift 2",
    email: "attendance.hradmin.shift2@dev.local",
    phone: "+919876543222",
    roleKey: "HR_ADMIN",
    departmentCode: "HR",
  },
  {
    firstName: "Anand",
    lastName: "Rao (Shift 2)",
    displayName: "Attendance Test - Manager - Shift 2",
    email: "attendance.manager.shift2@dev.local",
    phone: "+919876543223",
    roleKey: "MANAGER",
    departmentCode: "ENG",
  },
  {
    firstName: "Vikram",
    lastName: "Mehta (Shift 2)",
    displayName: "Attendance Test - Team Lead - Shift 2",
    email: "attendance.teamlead.shift2@dev.local",
    phone: "+919876543224",
    roleKey: "TEAM_LEAD",
    departmentCode: "ENG",
    teamCode: "FE-CORE",
  },
  {
    firstName: "Amit",
    lastName: "Patel (Shift 2)",
    displayName: "Attendance Test - Employee - Shift 2",
    email: "attendance.employee.shift2@dev.local",
    phone: "+919876543225",
    roleKey: "EMPLOYEE",
    departmentCode: "ENG",
    teamCode: "FE-CORE",
  },
  {
    firstName: "Suresh",
    lastName: "Iyer (Shift 2)",
    displayName: "Attendance Test - Finance Admin - Shift 2",
    email: "attendance.finance.shift2@dev.local",
    phone: "+919876543226",
    roleKey: "FINANCE_ADMIN",
    departmentCode: "FIN",
  },
  {
    firstName: "Rohan",
    lastName: "Deshmukh (Shift 2)",
    displayName: "Attendance Test - Project Manager - Shift 2",
    email: "attendance.pm.shift2@dev.local",
    phone: "+919876543227",
    roleKey: "PROJECT_MANAGER",
    departmentCode: "ENG",
  },
  {
    firstName: "Sneha",
    lastName: "Kapoor (Shift 2)",
    displayName: "Attendance Test - Recruiter - Shift 2",
    email: "attendance.recruiter.shift2@dev.local",
    phone: "+919876543228",
    roleKey: "RECRUITER",
    departmentCode: "HR",
  },
];

async function main() {
  const { and, eq, sql: dSql } = await import("drizzle-orm");
  const { db, sql } = await import("@/db/client");
  const {
    departments,
    employees,
    employeeHistory,
    invitations,
    memberships,
    onboarding,
    onboardingChecklistItems,
    organizations,
    roles,
    shifts,
    teams,
    users,
  } = await import("@/db/schema");
  const { createOpaqueToken, hashToken } = await import("@/lib/crypto");
  const { acceptInvitation } = await import("@/modules/platform/invitations");
  const { authenticate } = await import("@/modules/identity/auth");
  const { recordAudit } = await import("@/lib/audit");

  // 1. Locate organization: Naresh Technologies
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "naresh-technologies"))
    .limit(1);

  if (!org) {
    throw new Error("Organization Naresh Technologies not found.");
  }
  console.log(`Found organization: ${org.name} (${org.id})`);

  // Locate Org Owner
  const [ownerMem] = await db
    .select({ userId: memberships.userId, roleKey: roles.key })
    .from(memberships)
    .innerJoin(roles, eq(roles.id, memberships.roleId))
    .where(
      and(
        eq(memberships.organizationId, org.id),
        eq(roles.key, "ORGANIZATION_OWNER"),
        eq(memberships.status, "active")
      )
    )
    .limit(1);

  if (!ownerMem) {
    throw new Error("Organization Owner membership not found.");
  }
  const actorUserId = ownerMem.userId;
  console.log(`Actor User ID (Org Owner): ${actorUserId}`);

  // 2. Verify Shift 1
  const [shift1] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.organizationId, org.id), eq(shifts.code, "GENERAL_DAY")))
    .limit(1);

  if (!shift1) {
    throw new Error("Shift 1 (General Day Shift) not found in organization.");
  }
  console.log(`Shift 1 confirmed: ${shift1.name} (${shift1.startTime} - ${shift1.endTime}, break: ${shift1.breakMinutes}m, grace: ${shift1.graceMinutes}m)`);

  // 3. Ensure Shift 2 (Organization Shift 2 – Evening)
  let [shift2] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.organizationId, org.id), eq(shifts.code, "SHIFT_2_EVENING")))
    .limit(1);

  if (!shift2) {
    console.log("Creating Shift 2 (Organization Shift 2 – Evening)...");
    const [created] = await db
      .insert(shifts)
      .values({
        organizationId: org.id,
        name: "Organization Shift 2 – Evening",
        code: "SHIFT_2_EVENING",
        startTime: "18:00:00",
        endTime: "03:00:00",
        breakMinutes: 60,
        graceMinutes: 15,
        overnight: true,
        status: "active",
      })
      .returning();
    shift2 = created;
    console.log(`✓ Shift 2 created: ${shift2.name} (${shift2.id}) - 18:00 to 03:00 (Overnight: ${shift2.overnight})`);
  } else {
    console.log(`Shift 2 already exists: ${shift2.name} (${shift2.id})`);
  }

  // 4. Update Shift 1 assignments for existing Shift 1 test accounts
  console.log("\nVerifying/updating Shift 1 assignments for existing accounts...");
  const shift1Emails = [
    "kavita.hr.exec@dev.local",
    "arjun.kumar.test@example.com",
    "arjunsharma@gmail.com",
    "suresh.finance@dev.local",
    "anand.manager@dev.local",
    "vikram.lead@dev.local",
    "amit.employee@dev.local",
    "rohan.pm@dev.local",
    "sneha.recruiter@dev.local",
  ];

  for (const email of shift1Emails) {
    const [emp] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.organizationId, org.id), eq(employees.workEmail, email.toLowerCase())))
      .limit(1);

    if (emp) {
      if (emp.shiftId !== shift1.id) {
        await db
          .update(employees)
          .set({ shiftId: shift1.id, updatedAt: new Date() })
          .where(eq(employees.id, emp.id));
        console.log(`  Assigned Shift 1 to ${emp.displayName} (${email})`);
      } else {
        console.log(`  ${emp.displayName} already assigned to Shift 1`);
      }
    }
  }

  // Fetch departments & teams
  const allDepts = await db.select().from(departments).where(eq(departments.organizationId, org.id));
  const deptMap = Object.fromEntries(allDepts.map((d) => [d.code, d.id]));

  const allTeams = await db.select().from(teams).where(eq(teams.organizationId, org.id));
  const teamMap = Object.fromEntries(allTeams.map((t) => [t.code, t.id]));

  // 5. Create / Ensure Shift 2 accounts
  console.log("\nProcessing Shift 2 accounts...");
  for (const acc of SHIFT_2_ACCOUNTS) {
    console.log(`\nAccount: ${acc.displayName} (${acc.roleKey}) - ${acc.email}`);

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, acc.email.toLowerCase()))
      .limit(1);

    let employeeRecord: typeof employees.$inferSelect;

    if (!existingUser) {
      const deptId = deptMap[acc.departmentCode];
      const tId = acc.teamCode ? teamMap[acc.teamCode] : null;

      // Increment employee ID counter
      const [orgRow] = await db
        .update(organizations)
        .set({ employeeIdNext: dSql`${organizations.employeeIdNext} + 1`, updatedAt: new Date() })
        .where(eq(organizations.id, org.id))
        .returning({
          prefix: organizations.employeeIdPrefix,
          next: organizations.employeeIdNext,
          padding: organizations.employeeIdPadding,
        });

      const empNum = orgRow.next - 1;
      const employeeId = `${orgRow.prefix}${String(empNum).padStart(orgRow.padding, "0")}`;

      const [createdEmp] = await db
        .insert(employees)
        .values({
          organizationId: org.id,
          employeeId,
          firstName: acc.firstName,
          lastName: acc.lastName,
          displayName: acc.displayName,
          personalEmail: acc.email,
          workEmail: acc.email,
          phone: acc.phone,
          departmentId: deptId,
          teamId: tId,
          shiftId: shift2.id,
          status: "invited",
        })
        .returning();

      const [onboard] = await db
        .insert(onboarding)
        .values({
          organizationId: org.id,
          employeeId: createdEmp.id,
          status: "invited",
        })
        .returning();

      await db.insert(onboardingChecklistItems).values([
        { organizationId: org.id, onboardingId: onboard.id, title: "Complete profile", sortOrder: 1 },
        { organizationId: org.id, onboardingId: onboard.id, title: "Verify contact details", sortOrder: 2 },
        { organizationId: org.id, onboardingId: onboard.id, title: "HR review", sortOrder: 3 },
      ]);

      await db.insert(employeeHistory).values({
        organizationId: org.id,
        employeeId: createdEmp.id,
        eventType: "joining",
        newValue: JSON.stringify({ status: createdEmp.status, employeeId: createdEmp.employeeId, targetRole: acc.roleKey, shiftId: shift2.id }),
        actorUserId,
      });

      employeeRecord = createdEmp;
      console.log(`  Created employee record: ${employeeRecord.employeeId}`);

      // Create invitation
      const token = createOpaqueToken();
      await db.insert(invitations).values({
        organizationId: org.id,
        employeeId: employeeRecord.id,
        invitationType: "employee",
        invitedEmail: acc.email.toLowerCase(),
        intendedRole: acc.roleKey,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
        status: "pending",
      });

      // Accept invitation
      await acceptInvitation({
        token,
        fullName: acc.displayName,
        password: TEST_PASSWORD,
      });

      // Activate onboarding & employee
      await db
        .update(onboardingChecklistItems)
        .set({
          status: "completed",
          completedAt: new Date(),
          completedByUserId: actorUserId,
        })
        .where(eq(onboardingChecklistItems.organizationId, org.id));

      await db
        .update(onboarding)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(onboarding.employeeId, employeeRecord.id));

      await db
        .update(employees)
        .set({
          status: "active",
          shiftId: shift2.id,
          updatedAt: new Date(),
        })
        .where(eq(employees.id, employeeRecord.id));

      console.log(`  ✓ Employee activated and assigned to Shift 2.`);
    } else {
      console.log(`  User already exists: ${acc.email}`);
      const [emp] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, existingUser.id))
        .limit(1);
      employeeRecord = emp;

      if (employeeRecord && employeeRecord.shiftId !== shift2.id) {
        await db
          .update(employees)
          .set({ shiftId: shift2.id, updatedAt: new Date() })
          .where(eq(employees.id, employeeRecord.id));
        console.log(`  Updated shift assignment to Shift 2 for ${acc.displayName}`);
      }
    }

    // Verify login
    const authResult = await authenticate({
      email: acc.email,
      password: TEST_PASSWORD,
    });

    if (authResult?.user?.id) {
      console.log(`  ✓ Authentication verified for ${acc.email}`);
    } else {
      throw new Error(`Authentication verification failed for ${acc.email}`);
    }
  }

  console.log("\n========================================================");
  console.log("ALL SHIFT SETUP & TEST ACCOUNTS VERIFIED SUCCESSFULLY");
  console.log("========================================================");

  await sql.end();
}

main().catch((err) => {
  console.error("Setup error:", err);
  process.exit(1);
});
