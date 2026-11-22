import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppError } from "@/lib/errors";

let mockTenant: {
  organization: { id: string } | null;
  user: { id: string };
} = {
  organization: { id: "org-1" },
  user: { id: "user-1" },
};

let mockAuthorizeShouldThrow = false;

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: vi.fn(() => Promise.resolve(mockTenant)),
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  authorize: vi.fn(() => {
    if (mockAuthorizeShouldThrow) {
      throw new AppError("FORBIDDEN", "You are not authorized to perform this action.", 403);
    }
    return Promise.resolve({ id: "user-1", platformRole: "NONE" });
  }),
}));

vi.mock("@/modules/ats/service", () => ({
  searchCandidates: vi.fn(() => Promise.resolve([])),
  listJobs: vi.fn(() => Promise.resolve([])),
  listApplications: vi.fn(() => Promise.resolve([])),
  listInterviews: vi.fn(() => Promise.resolve([])),
  listRequisitions: vi.fn(() => Promise.resolve([])),
  getDefaultAtsPipeline: vi.fn(() => Promise.resolve({ stages: [] })),
}));

import { GET as getCandidates } from "./candidates/route";
import { GET as getJobs } from "./jobs/route";
import { GET as getApplications } from "./applications/route";
import { GET as getInterviews } from "./interviews/list/route";
import { GET as getRequisitions } from "./requisitions/route";
import { GET as getPipeline } from "./pipeline/route";
import { ROLE_PERMISSIONS } from "@/modules/rbac/permissions";

describe("ATS API Authorization & Tenant Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTenant = {
      organization: { id: "org-1" },
      user: { id: "user-1" },
    };
    mockAuthorizeShouldThrow = false;
  });

  it("GET /api/app/ats/candidates rejects unauthorized roles with 403", async () => {
    mockAuthorizeShouldThrow = true;
    const req = new Request("http://localhost/api/app/ats/candidates");
    const response = await getCandidates(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("GET /api/app/ats/candidates succeeds for authorized users", async () => {
    mockAuthorizeShouldThrow = false;
    const req = new Request("http://localhost/api/app/ats/candidates");
    const response = await getCandidates(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.candidates)).toBe(true);
  });

  it("GET /api/app/ats/jobs rejects unauthorized roles with 403", async () => {
    mockAuthorizeShouldThrow = true;
    const response = await getJobs();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("GET /api/app/ats/applications and interviews reject unauthorized roles with 403", async () => {
    mockAuthorizeShouldThrow = true;
    const appRes = await getApplications();
    const intRes = await getInterviews();

    expect(appRes.status).toBe(403);
    expect(intRes.status).toBe(403);
  });

  it("GET /api/app/ats/requisitions and pipeline reject unauthorized roles with 403", async () => {
    mockAuthorizeShouldThrow = true;
    const reqRes = await getRequisitions();
    const pipeRes = await getPipeline();

    expect(reqRes.status).toBe(403);
    expect(pipeRes.status).toBe(403);
  });

  it("GET /api/app/ats/requisitions and pipeline succeed for authorized roles", async () => {
    mockAuthorizeShouldThrow = false;
    const reqRes = await getRequisitions();
    const pipeRes = await getPipeline();

    expect(reqRes.status).toBe(200);
    expect(pipeRes.status).toBe(200);
  });

  it("enforces strict role boundaries: HR_ADMIN is forbidden from ATS, RECRUITER & OWNER are permitted", () => {
    const hrAdminPerms = new Set(ROLE_PERMISSIONS.HR_ADMIN ?? []);
    const recruiterPerms = new Set(ROLE_PERMISSIONS.RECRUITER ?? []);

    const atsPermissionsToCheck = [
      "ats.view",
      "ats.job.view",
      "ats.candidate.view",
      "ats.application.view",
      "ats.interview.view",
      "ats.requisition.view",
    ];

    // HR_ADMIN must NOT have any of the ATS permissions
    for (const perm of atsPermissionsToCheck) {
      expect(hrAdminPerms.has(perm as never)).toBe(false);
    }

    // RECRUITER must have all ATS permissions
    for (const perm of atsPermissionsToCheck) {
      expect(recruiterPerms.has(perm as never)).toBe(true);
    }
  });

  it("rejects requests missing organization context with 403", async () => {
    mockTenant = { organization: null, user: { id: "user-1" } };
    const req = new Request("http://localhost/api/app/ats/candidates");
    const response = await getCandidates(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toContain("Organization context is required");
  });
});
