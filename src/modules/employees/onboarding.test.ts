import { beforeEach, describe, expect, it, vi } from "vitest";
import { employeeHistory, employees, onboarding, onboardingChecklistItems } from "@/db/schema";

const resolveTenantContext = vi.fn();
const authorize = vi.fn();
const recordAudit = vi.fn();

const insertedRecords: Array<{ table: unknown; values: unknown }> = [];
const updatedRecords: Array<{ table: unknown; values: unknown }> = [];

let mockEmployee: { id: string; organizationId: string; status: string } | null = null;
let mockOnboarding: { id: string; employeeId: string; organizationId: string; status: string; completedAt: Date | null } | null = null;
let mockPendingItems: Array<{ id: string; status: string }> = [];
let mockChecklistItem: { id: string; onboardingId: string; organizationId: string; status: string } | null = null;

const db = {
  select: vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn().mockImplementation(() => {
        if (table === employees) {
          return Promise.resolve(mockEmployee ? [mockEmployee] : []);
        }
        if (table === onboarding) {
          return Promise.resolve(mockOnboarding ? [mockOnboarding] : []);
        }
        if (table === onboardingChecklistItems) {
          return Promise.resolve(mockPendingItems);
        }
        return Promise.resolve([]);
      }),
    })),
  })),
  update: vi.fn((table: unknown) => ({
    set: vi.fn((values: unknown) => {
      updatedRecords.push({ table, values });
      return {
        where: vi.fn(() => ({
          returning: vi.fn().mockImplementation(() => {
            if (table === onboarding) {
              return Promise.resolve([{ ...mockOnboarding, ...(values as object) }]);
            }
            if (table === onboardingChecklistItems) {
              return Promise.resolve([{ ...mockChecklistItem, ...(values as object) }]);
            }
            return Promise.resolve([]);
          }),
        })),
      };
    }),
  })),
  insert: vi.fn((table: unknown) => ({
    values: vi.fn((values: unknown) => {
      insertedRecords.push({ table, values });
      return Promise.resolve([]);
    }),
  })),
};

vi.mock("@/modules/tenancy/context", () => ({ resolveTenantContext }));
vi.mock("@/modules/tenancy/authorization", () => ({ authorize }));
vi.mock("@/lib/audit", () => ({ recordAudit }));
vi.mock("@/db/client", () => ({ db }));

const { POST, PATCH } = await import("@/app/api/app/employees/[employeeId]/onboarding/route");

describe("employee onboarding API lifecycle and idempotency", () => {
  const organizationId = "org-1111";
  const employeeId = "emp-2222";
  const userId = "user-3333";
  const existingCompletedAt = new Date("2026-10-01T10:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    insertedRecords.length = 0;
    updatedRecords.length = 0;

    resolveTenantContext.mockResolvedValue({
      organization: { id: organizationId },
      user: { id: userId },
    });
    authorize.mockResolvedValue(true);

    mockEmployee = {
      id: employeeId,
      organizationId,
      status: "onboarding",
    };
    mockOnboarding = {
      id: "onb-4444",
      employeeId,
      organizationId,
      status: "not_started",
      completedAt: null,
    };
    mockPendingItems = [];
    mockChecklistItem = {
      id: "item-5555",
      onboardingId: "onb-4444",
      organizationId,
      status: "pending",
    };
  });

  it("completes pending onboarding and creates an employeeHistory event when checklist is 3/3 complete", async () => {
    mockPendingItems = []; // No pending items remain

    const context = { params: Promise.resolve({ employeeId }) };
    const response = await POST(new Request("http://localhost/api/app/employees/emp-2222/onboarding", { method: "POST" }), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.onboarding.status).toBe("completed");

    // Must update onboarding and employee
    expect(updatedRecords.some((r) => r.table === onboarding)).toBe(true);
    expect(updatedRecords.some((r) => r.table === employees)).toBe(true);

    // Must insert an employeeHistory event
    const historyInsert = insertedRecords.find((r) => r.table === employeeHistory);
    expect(historyInsert).toBeDefined();
    expect(historyInsert!.values).toMatchObject({
      organizationId,
      employeeId,
      eventType: "onboarding_completed",
      newValue: "active",
      actorUserId: userId,
    });
  });

  it("is idempotent: repeated POST on already-completed onboarding returns 200 without duplicate history or timestamp modification", async () => {
    mockOnboarding = {
      id: "onb-4444",
      employeeId,
      organizationId,
      status: "completed",
      completedAt: existingCompletedAt,
    };
    mockEmployee = {
      id: employeeId,
      organizationId,
      status: "active",
    };

    const context = { params: Promise.resolve({ employeeId }) };
    const response = await POST(new Request("http://localhost/api/app/employees/emp-2222/onboarding", { method: "POST" }), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.onboarding.status).toBe("completed");
    expect(new Date(body.onboarding.completedAt)).toEqual(existingCompletedAt);

    // Idempotency: NO updates and NO history inserts performed
    expect(updatedRecords.some((r) => r.table === onboarding)).toBe(false);
    expect(updatedRecords.some((r) => r.table === employees)).toBe(false);
    expect(insertedRecords.some((r) => r.table === employeeHistory)).toBe(false);
  });

  it("rejects POST completion when checklist items are still pending", async () => {
    mockPendingItems = [{ id: "item-1", status: "pending" }];

    const context = { params: Promise.resolve({ employeeId }) };
    const response = await POST(new Request("http://localhost/api/app/employees/emp-2222/onboarding", { method: "POST" }), context);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error?.message).toBe("Complete all onboarding checklist items first.");
    expect(insertedRecords.some((r) => r.table === employeeHistory)).toBe(false);
  });

  it("rejects PATCH checklist modification after onboarding has already been completed", async () => {
    mockOnboarding = {
      id: "onb-4444",
      employeeId,
      organizationId,
      status: "completed",
      completedAt: existingCompletedAt,
    };

    const context = { params: Promise.resolve({ employeeId }) };
    const request = new Request("http://localhost/api/app/employees/emp-2222/onboarding", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId: "item-5555", status: "pending" }),
    });

    const response = await PATCH(request, context);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error?.message).toBe("Checklist items cannot be modified after onboarding is completed.");
    expect(updatedRecords.some((r) => r.table === onboardingChecklistItems)).toBe(false);
  });

  it("allows PATCH checklist modification when onboarding is still in progress", async () => {
    mockOnboarding = {
      id: "onb-4444",
      employeeId,
      organizationId,
      status: "in_progress",
      completedAt: null,
    };

    const context = { params: Promise.resolve({ employeeId }) };
    const request = new Request("http://localhost/api/app/employees/emp-2222/onboarding", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId: "item-5555", status: "completed" }),
    });

    const response = await PATCH(request, context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updatedRecords.some((r) => r.table === onboardingChecklistItems)).toBe(true);
  });
});
