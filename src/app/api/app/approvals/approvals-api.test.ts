import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppError } from "@/lib/errors";

let mockTenant: {
  organization: { id: string } | null;
  user: { id: string };
} = {
  organization: { id: "org-1" },
  user: { id: "user-1" },
};

let mockAuthorizeAnyShouldThrow = false;

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: vi.fn(() => Promise.resolve(mockTenant)),
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  authorizeAny: vi.fn(() => {
    if (mockAuthorizeAnyShouldThrow) {
      throw new AppError("FORBIDDEN", "You are not authorized to perform this action.", 403);
    }
    return Promise.resolve({ id: "user-1", platformRole: "NONE" });
  }),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          innerJoin: () => ({
            where: () => ({
              orderBy: () => Promise.resolve([]),
            }),
          }),
        }),
      }),
    }),
  },
}));

import { GET } from "./route";
import { GET as getTask, POST as postTask } from "./[taskId]/route";

describe("Approvals API Authorization Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTenant = {
      organization: { id: "org-1" },
      user: { id: "user-1" },
    };
    mockAuthorizeAnyShouldThrow = false;
  });

  it("GET /api/app/approvals rejects unauthorized users with 403", async () => {
    mockAuthorizeAnyShouldThrow = true;
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.error.message).toBe("You are not authorized to perform this action.");
  });

  it("GET /api/app/approvals allows authorized users", async () => {
    mockAuthorizeAnyShouldThrow = false;
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tasks).toEqual([]);
  });

  it("GET /api/app/approvals/[taskId] rejects unauthorized users with 403", async () => {
    mockAuthorizeAnyShouldThrow = true;
    const request = new Request("http://localhost/api/app/approvals/task-1");
    const response = await getTask(request, { params: Promise.resolve({ taskId: "task-1" }) });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("POST /api/app/approvals/[taskId] rejects unauthorized users with 403", async () => {
    mockAuthorizeAnyShouldThrow = true;
    const request = new Request("http://localhost/api/app/approvals/task-1", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    const response = await postTask(request, { params: Promise.resolve({ taskId: "task-1" }) });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
