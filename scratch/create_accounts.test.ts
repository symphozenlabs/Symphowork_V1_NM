import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { db, sql } from "@/db/client";
import {
  departments,
  employees,
  invitations,
  memberships,
  onboarding,
  onboardingChecklistItems,
  organizations,
  roles,
  teams,
  users,
} from "@/db/schema";
import { createOpaqueToken, hashToken } from "@/lib/crypto";
import { AppError } from "@/lib/errors";

const ACTOR_USER_ID = "4358d645-376f-4de6-8813-a6d487e1e9a2"; // Naresh S, Organization Owner

// Mock authorize to run real authorization via `can` without needing Next.js cookies()
vi.mock("@/modules/tenancy/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/tenancy/authorization")>();
  return {
    ...actual,
    authorize: vi.fn().mockImplementation(async (input: { organizationId?: string; permission: any }) => {
      const isAllowed = await actual.can({
        userId: ACTOR_USER_ID,
        organizationId: input.organizationId,
        permission: input.permission,
      });
      if (!isAllowed) {
        throw new AppError("FORBIDDEN", "Unauthorized in test.", 403);
      }
      return { id: ACTOR_USER_ID };
    }),
  };
});

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

describe("Prepare Role-Based Manual Testing Accounts", () => {
  it("creates, accepts invitations, activates, and verifies all 7 missing roles", async () => {
    const { createEmployee } = await import("@/modules/employees/service");
    const { updateDepartment, updateDepartmentTeam } = await import("@/modules/departments/service");
    const { acceptInvitation } = await import("@/modules/platform/invitations");
    const { authenticateUser } = await import("@/modules/identity/auth");

    // 1. Locate organization: Naresh Technologies
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "naresh-technologies"))
      .limit(1);

    expect(org).toBeDefined();
    expect(org.id).toBe("c4e8802c-182c-460e-bc45-42faafc45836");

    // 2. Locate Departments: HR and ENG
    const [hrDept] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.organizationId, org.id), eq(departments.code, "HR")))
      .limit(1);
    expect(hrDept).toBeDefined();

    const [engDept] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.organizationId, org.id), eq(departments.code, "ENG")))
      .limit(1);
    expect(engDept).toBeDefined();

    // 3. Locate Team: FE-CORE
    const [feCoreTeam] = await db
      .select()
      .from(teams)
      .where(and(eq(teams.organizationId, org.id), eq(teams.code, "FE-CORE")))
      .limit(1);
    expect(feCoreTeam).toBeDefined();

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

    for (const acc of TEST_ACCOUNTS) {
      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, acc.email.toLowerCase()))
        .limit(1);

      let employeeRecord: typeof employees.$inferSelect;

      if (!existingUser) {
        const deptId = acc.departmentCode ? deptMap[acc.departmentCode] : undefined;
        const tId = acc.teamCode ? teamMap[acc.teamCode] : undefined;

        // Create employee via real service
        const { employee } = await createEmployee(org.id, ACTOR_USER_ID, {
          firstName: acc.firstName,
          lastName: acc.lastName,
          personalEmail: acc.email,
          workEmail: acc.email,
          phone: acc.phone,
          departmentId: deptId,
          teamId: tId,
          targetRole: acc.roleKey,
          status: "invited",
        });
        employeeRecord = employee;

        // Create invitation
        const token = createOpaqueToken();
        await db.insert(invitations).values({
          organizationId: org.id,
          employeeId: employee.id,
          invitationType: "employee",
          invitedEmail: acc.email.toLowerCase(),
          intendedRole: acc.roleKey,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 7 * 86_400_000),
          status: "pending",
        });

        // Accept invitation via real service
        await acceptInvitation({
          token,
          fullName: acc.displayName,
          password: TEST_PASSWORD,
        });

        // Complete onboarding to activate employee
        await db
          .update(onboardingChecklistItems)
          .set({
            status: "completed",
            completedAt: new Date(),
            completedByUserId: ACTOR_USER_ID,
          })
          .where(eq(onboardingChecklistItems.organizationId, org.id));

        await db
          .update(onboarding)
          .set({
            status: "completed",
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(onboarding.employeeId, employee.id));

        await db
          .update(employees)
          .set({
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(employees.id, employee.id));
      } else {
        const [emp] = await db
          .select()
          .from(employees)
          .where(eq(employees.userId, existingUser.id))
          .limit(1);
        employeeRecord = emp;
      }

      // Assign Department Manager
      if (acc.isDepartmentManager && acc.departmentCode) {
        const targetDeptId = deptMap[acc.departmentCode];
        await updateDepartment(org.id, ACTOR_USER_ID, targetDeptId, {
          headEmployeeId: employeeRecord.id,
        });
      }

      // Assign Team Lead
      if (acc.isTeamLead && acc.departmentCode && acc.teamCode) {
        const targetDeptId = deptMap[acc.departmentCode];
        const targetTeamId = teamMap[acc.teamCode];
        await updateDepartmentTeam(org.id, ACTOR_USER_ID, targetDeptId, targetTeamId, {
          teamLeadEmployeeId: employeeRecord.id,
        });
      }

      // Verify authentication via real authenticateUser
      const authResult = await authenticateUser({
        email: acc.email,
        password: TEST_PASSWORD,
      });

      expect(authResult?.user?.id).toBeDefined();

      // Verify membership role in database
      const [mem] = await db
        .select({ roleKey: roles.key })
        .from(memberships)
        .innerJoin(roles, eq(roles.id, memberships.roleId))
        .where(and(eq(memberships.organizationId, org.id), eq(memberships.userId, authResult.user.id)))
        .limit(1);

      expect(mem?.roleKey).toBe(acc.roleKey);

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

    expect(createdSummary).toHaveLength(7);

    // Update credentials files
    const credPath = path.resolve(process.cwd(), "crediantials.txt");
    const altCredPath = path.resolve(process.cwd(), "credentials.txt");

    let existingContent = "";
    if (fs.existsSync(credPath)) {
      existingContent = fs.readFileSync(credPath, "utf8");
    }

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

    if (!existingContent.includes("Role-Based Manual Testing Accounts")) {
      fs.appendFileSync(credPath, appendText, "utf8");
    }

    const updatedCred = fs.readFileSync(credPath, "utf8");
    fs.writeFileSync(altCredPath, updatedCred, "utf8");

    await sql.end();
  }, 60000);
});
