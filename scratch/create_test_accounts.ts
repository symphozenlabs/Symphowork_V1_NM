import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";

// Secure test password meeting validatePassword requirements (>=12, upper, lower, digit, symbol)
// Will NEVER be logged or printed to stdout
const TEST_PASSWORD = "TestUser@2026#Sympho";

interface TestAccountDef {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  roleKey: string;
  departmentCode?: string;
  teamCode?: string;
  isDepartmentManager?: boolean;
  isTeamLead?: boolean;
}

const TEST_ACCOUNTS: TestAccountDef[] = [
  {
    firstName: "Kavita",
    lastName: "Menon",
    displayName: "Kavita Menon",
    email: "kavita.hr.exec@dev.local",
    phone: "+919876543211",
    roleKey: "HR_EXECUTIVE",
    departmentCode: "HR",
  },
  {
    firstName: "Suresh",
    lastName: "Iyer",
    displayName: "Suresh Iyer",
    email: "suresh.finance@dev.local",
    phone: "+919876543212",
    roleKey: "FINANCE_ADMIN",
    departmentCode: undefined, // department-optional
  },
  {
    firstName: "Anand",
    lastName: "Rao",
    displayName: "Anand Rao",
    email: "anand.manager@dev.local",
    phone: "+919876543213",
    roleKey: "MANAGER",
    departmentCode: "ENG",
    isDepartmentManager: true,
  },
  {
    firstName: "Vikram",
    lastName: "Mehta",
    displayName: "Vikram Mehta",
    email: "vikram.lead@dev.local",
    phone: "+919876543214",
    roleKey: "TEAM_LEAD",
    departmentCode: "ENG",
    teamCode: "FE-CORE",
    isTeamLead: true,
  },
  {
    firstName: "Rohan",
    lastName: "Deshmukh",
    displayName: "Rohan Deshmukh",
    email: "rohan.pm@dev.local",
    phone: "+919876543215",
    roleKey: "PROJECT_MANAGER",
    departmentCode: "ENG",
  },
  {
    firstName: "Sneha",
    lastName: "Kapoor",
    displayName: "Sneha Kapoor",
    email: "sneha.recruiter@dev.local",
    phone: "+919876543216",
    roleKey: "RECRUITER",
    departmentCode: "HR",
  },
  {
    firstName: "Amit",
    lastName: "Patel",
    displayName: "Amit Patel",
    email: "amit.employee@dev.local",
    phone: "+919876543217",
    roleKey: "EMPLOYEE",
    departmentCode: "ENG",
    teamCode: "FE-CORE",
  },
];

async function main() {
  console.log("Starting test accounts creation process...");

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
    teams,
    users,
  } = await import("@/db/schema");
  const { createOpaqueToken, hashToken } = await import("@/lib/crypto");
  const { can } = await import("@/modules/tenancy/authorization");
  const { canAssignRole } = await import("@/modules/rbac/permissions");
  const { isDepartmentRequiredForRole } = await import("@/modules/employees/service");
  const {
    createDepartment,
    createDepartmentTeam,
    updateDepartment,
    updateDepartmentTeam,
  } = await import("@/modules/departments/service");
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

  // 2. Locate Organization Owner actor
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

  // Verify actor permission to create employees
  const canCreate = await can({
    userId: actorUserId,
    organizationId: org.id,
    permission: "employee.create",
  });
  if (!canCreate) {
    throw new Error("Actor user is not authorized to create employees.");
  }
  console.log("✓ Actor permission 'employee.create' verified via tenancy authorization.");

  // 3. Departments setup:
  // Ensure "HR" exists
  const [hrDept] = await db
    .select()
    .from(departments)
    .where(and(eq(departments.organizationId, org.id), eq(departments.code, "HR")))
    .limit(1);

  if (!hrDept) {
    throw new Error("Expected HR department was not found.");
  }
  console.log(`HR Department confirmed: ${hrDept.name} (${hrDept.id})`);

  // Ensure "ENG" (Engineering) exists
  let engDept = (
    await db
      .select()
      .from(departments)
      .where(and(eq(departments.organizationId, org.id), eq(departments.code, "ENG")))
      .limit(1)
  )[0];

  if (!engDept) {
    console.log("Creating Engineering (ENG) department...");
    engDept = await createDepartment(org.id, actorUserId, {
      code: "ENG",
      name: "Engineering",
      description: "Engineering and technology development department.",
      status: "active",
    });
    console.log(`Created ENG Department: ${engDept.name} (${engDept.id})`);
  } else {
    console.log(`ENG Department already exists: ${engDept.name} (${engDept.id})`);
  }

  // 4. Teams setup:
  // Ensure "FE-CORE" exists in ENG department
  let feCoreTeam = (
    await db
      .select()
      .from(teams)
      .where(and(eq(teams.organizationId, org.id), eq(teams.code, "FE-CORE")))
      .limit(1)
  )[0];

  if (!feCoreTeam) {
    console.log("Creating Frontend Core (FE-CORE) team in ENG department...");
    feCoreTeam = await createDepartmentTeam(org.id, actorUserId, engDept.id, {
      code: "FE-CORE",
      name: "Frontend Core",
      description: "Frontend web and UI application team.",
      status: "active",
    });
    console.log(`Created FE-CORE Team: ${feCoreTeam.name} (${feCoreTeam.id})`);
  } else {
    console.log(`FE-CORE Team already exists: ${feCoreTeam.name} (${feCoreTeam.id})`);
  }

  const deptMap: Record<string, string> = {
    HR: hrDept.id,
    ENG: engDept.id,
  };

  const teamMap: Record<string, string> = {
    "FE-CORE": feCoreTeam.id,
  };

  const createdSummary: {
    displayName: string;
    roleKey: string;
    email: string;
    department?: string;
    team?: string;
    status: string;
  }[] = [];

  // 5. Account creation for each role
  for (const acc of TEST_ACCOUNTS) {
    console.log(`\nProcessing account: ${acc.displayName} (${acc.roleKey})...`);

    // Verify assignable role permission
    if (!canAssignRole(ownerMem.roleKey, acc.roleKey)) {
      throw new Error(`Owner cannot assign role ${acc.roleKey}`);
    }

    // Verify department requirement rule
    const isDeptReq = isDepartmentRequiredForRole(acc.roleKey);
    if (isDeptReq && !acc.departmentCode) {
      throw new Error(`Department is required for role ${acc.roleKey}`);
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, acc.email.toLowerCase()))
      .limit(1);

    let employeeRecord: typeof employees.$inferSelect;

    if (!existingUser) {
      const deptId = acc.departmentCode ? deptMap[acc.departmentCode] : null;
      const tId = acc.teamCode ? teamMap[acc.teamCode] : null;

      // Create employee record following standard employee creation flow
      console.log(`  Creating employee record for ${acc.displayName}...`);
      const empResult = await db.transaction(async (tx) => {
        // Increment employee ID counter
        const [orgRow] = await tx
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

        const [createdEmp] = await tx
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
            status: "invited",
          })
          .returning();

        const [onboard] = await tx
          .insert(onboarding)
          .values({
            organizationId: org.id,
            employeeId: createdEmp.id,
            status: "invited",
          })
          .returning();

        await tx.insert(onboardingChecklistItems).values([
          { organizationId: org.id, onboardingId: onboard.id, title: "Complete profile", sortOrder: 1 },
          { organizationId: org.id, onboardingId: onboard.id, title: "Verify contact details", sortOrder: 2 },
          { organizationId: org.id, onboardingId: onboard.id, title: "HR review", sortOrder: 3 },
        ]);

        await tx.insert(employeeHistory).values({
          organizationId: org.id,
          employeeId: createdEmp.id,
          eventType: "joining",
          newValue: JSON.stringify({ status: createdEmp.status, employeeId: createdEmp.employeeId, targetRole: acc.roleKey }),
          actorUserId,
        });

        return createdEmp;
      });

      employeeRecord = empResult;
      console.log(`  Employee record created: ${employeeRecord.employeeId} (${employeeRecord.id})`);

      await recordAudit({
        actorUserId,
        organizationId: org.id,
        action: "employee_created",
        resource: "employee",
        resourceId: employeeRecord.id,
        metadata: { employeeId: employeeRecord.employeeId, targetRole: acc.roleKey },
      });

      // Create invitation
      console.log(`  Creating invitation for ${acc.email}...`);
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

      // Accept invitation and set password using application's acceptInvitation module
      console.log(`  Accepting invitation and establishing credentials...`);
      await acceptInvitation({
        token,
        fullName: acc.displayName,
        password: TEST_PASSWORD,
      });

      // Complete onboarding checklist items and mark employee active
      console.log(`  Completing onboarding to activate employee...`);
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
          updatedAt: new Date(),
        })
        .where(eq(employees.id, employeeRecord.id));

      console.log(`  Employee activated: ${acc.displayName}`);
    } else {
      console.log(`  User account already exists: ${acc.email}`);
      const [emp] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, existingUser.id))
        .limit(1);
      employeeRecord = emp;
    }

    // If Department Manager, assign as department head
    if (acc.isDepartmentManager && acc.departmentCode) {
      const targetDeptId = deptMap[acc.departmentCode];
      console.log(`  Assigning ${acc.displayName} as department head of ${acc.departmentCode}...`);
      await updateDepartment(org.id, actorUserId, targetDeptId, {
        headEmployeeId: employeeRecord.id,
      });
      console.log(`  Department manager assigned successfully.`);
    }

    // If Team Lead, assign as team lead
    if (acc.isTeamLead && acc.departmentCode && acc.teamCode) {
      const targetDeptId = deptMap[acc.departmentCode];
      const targetTeamId = teamMap[acc.teamCode];
      console.log(`  Assigning ${acc.displayName} as team lead of ${acc.teamCode}...`);
      await updateDepartmentTeam(org.id, actorUserId, targetDeptId, targetTeamId, {
        teamLeadEmployeeId: employeeRecord.id,
      });
      console.log(`  Team lead assigned successfully.`);
    }

    // Verify authentication
    console.log(`  Testing authentication via authenticate...`);
    const authResult = await authenticate({
      email: acc.email,
      password: TEST_PASSWORD,
    });

    if (authResult?.user?.id) {
      console.log(`  ✓ Login verified successfully for ${acc.email}`);
    } else {
      throw new Error(`Authentication verification failed for ${acc.email}`);
    }

    // Verify membership role
    const [mem] = await db
      .select({ roleKey: roles.key })
      .from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .where(and(eq(memberships.organizationId, org.id), eq(memberships.userId, authResult.user.id)))
      .limit(1);

    if (mem?.roleKey !== acc.roleKey) {
      throw new Error(`Role mismatch for ${acc.email}: expected ${acc.roleKey}, got ${mem?.roleKey}`);
    }
    console.log(`  ✓ Role verified: ${mem.roleKey}`);

    createdSummary.push({
      displayName: acc.displayName,
      roleKey: acc.roleKey,
      email: acc.email,
      department: acc.departmentCode
        ? `${acc.departmentCode === "HR" ? "Human Resources" : "Engineering"} (${acc.departmentCode})${acc.isDepartmentManager ? " - Assigned Department Manager" : ""}`
        : "N/A",
      team: acc.teamCode
        ? `Frontend Core (${acc.teamCode})${acc.isTeamLead ? " - Assigned Team Lead" : ""}`
        : "N/A",
      status: "Active (Invitation accepted & onboarded)",
    });
  }

  // 6. Append to credentials file
  console.log("\nUpdating credentials files...");
  const credPath = path.resolve(process.cwd(), "crediantials.txt");
  const altCredPath = path.resolve(process.cwd(), "credentials.txt");

  let existingContent = "";
  if (fs.existsSync(credPath)) {
    existingContent = fs.readFileSync(credPath, "utf8");
  }

  // Build appended section
  let appendText = "";
  if (!existingContent.endsWith("\n")) {
    appendText += "\n\n";
  } else if (!existingContent.endsWith("\n\n")) {
    appendText += "\n";
  }

  appendText += "----------------------------------------\n";
  appendText += "Role-Based Manual Testing Accounts (Naresh Technologies)\n";
  appendText += "----------------------------------------\n\n";

  for (const item of createdSummary) {
    appendText += `Display Name: ${item.displayName}\n`;
    appendText += `Role: ${item.roleKey}\n`;
    appendText += `Email: ${item.email}\n`;
    appendText += `Password: ${TEST_PASSWORD}\n`;
    appendText += `Department: ${item.department}\n`;
    appendText += `Team: ${item.team}\n`;
    appendText += `Status: ${item.status}\n\n`;
  }

  // Only append if section not already present
  if (!existingContent.includes("Role-Based Manual Testing Accounts")) {
    fs.appendFileSync(credPath, appendText, "utf8");
    console.log("Appended new test accounts section to crediantials.txt");
  } else {
    console.log("Section already present in crediantials.txt. Preserving existing.");
  }

  // Also maintain credentials.txt with identical content
  const updatedCred = fs.readFileSync(credPath, "utf8");
  fs.writeFileSync(altCredPath, updatedCred, "utf8");
  console.log("Synchronized credentials.txt with identical content.");

  await sql.end();
  console.log("\nAll 7 missing roles successfully created, verified, and recorded!");
}

main()
  .catch((err) => {
    console.error("Setup script failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
