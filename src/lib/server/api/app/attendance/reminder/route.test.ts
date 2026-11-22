import { beforeEach, describe, expect, it, vi } from "vitest";

const mockResolveTenantContext = vi.fn();
const mockCheckAndEnsureAttendanceReminder = vi.fn();

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: () => mockResolveTenantContext(),
}));

vi.mock("@/modules/attendance/reminder", () => ({
  checkAndEnsureAttendanceReminder: (...args: unknown[]) => mockCheckAndEnsureAttendanceReminder(...args),
}));

import { GET } from "./route";

describe("GET /api/app/attendance/reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when organization context is missing", async () => {
    mockResolveTenantContext.mockResolvedValue({
      organization: null,
      user: { id: "user-1" },
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error.message).toContain("Organization context is required");
  });

  it("returns reminder check result for authenticated user in organization", async () => {
    mockResolveTenantContext.mockResolvedValue({
      organization: { id: "org-1", name: "Acme Corp" },
      user: { id: "user-kavita" },
    });

    mockCheckAndEnsureAttendanceReminder.mockResolvedValue({
      eligible: true,
      required: true,
      completed: false,
      workDate: "2026-10-18",
      shift: {
        id: "shift-1",
        name: "General Day Shift",
        startTime: "09:00:00",
        endTime: "18:00:00",
      },
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.eligible).toBe(true);
    expect(data.required).toBe(true);
    expect(data.shift.name).toBe("General Day Shift");
    expect(mockCheckAndEnsureAttendanceReminder).toHaveBeenCalledWith({
      organizationId: "org-1",
      userId: "user-kavita",
    });
  });
});
