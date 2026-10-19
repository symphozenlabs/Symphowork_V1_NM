import { beforeEach, describe, expect, it, vi } from "vitest";
import { shifts } from "@/db/schema";
import { GET, POST } from "./route";
import { PATCH } from "../[resource]/[itemId]/route";

const { resolveTenantContext, authorize, authorizeAny } = vi.hoisted(() => ({
  resolveTenantContext: vi.fn(),
  authorize: vi.fn(),
  authorizeAny: vi.fn(),
}));

vi.mock("@/modules/tenancy/context", () => ({ resolveTenantContext }));
vi.mock("@/modules/tenancy/authorization", () => ({ authorize, authorizeAny }));

type MockShift = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceMinutes: number;
  overnight: boolean;
  status: "active" | "inactive" | "archived";
};

const orgA = "11111111-1111-4111-8111-111111111111";

let mockShifts: MockShift[] = [];
let lastInsertedShift: (MockShift & Record<string, unknown>) | null = null;
let lastUpdatedShift: Record<string, unknown> | null = null;

vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn().mockImplementation(() => {
          const res = Promise.resolve(table === shifts ? mockShifts : []);
          return Object.assign(res, {
            orderBy: vi.fn().mockReturnValue(Promise.resolve(table === shifts ? mockShifts : [])),
          });
        }),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((values: Record<string, unknown>) => ({
        returning: vi.fn().mockImplementation(async () => {
          lastInsertedShift = { id: "new-shift-id", ...values } as MockShift & Record<string, unknown>;
          mockShifts.push(lastInsertedShift);
          return [lastInsertedShift];
        }),
      })),
    })),
    execute: vi.fn().mockImplementation(async () => {
      return [{ id: "shift-1", ...lastUpdatedShift }];
    }),
  },
}));

describe("Shifts API — Creation, Editing, Validation & Retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastInsertedShift = null;
    lastUpdatedShift = null;
    mockShifts = [
      {
        id: "shift-1",
        organizationId: orgA,
        name: "General Day Shift",
        code: "GEN-DAY",
        startTime: "09:00:00",
        endTime: "18:00:00",
        breakMinutes: 60,
        graceMinutes: 15,
        overnight: false,
        status: "active",
      },
      {
        id: "shift-2",
        organizationId: orgA,
        name: "Night Owls",
        code: "NIGHT-1",
        startTime: "22:00:00",
        endTime: "06:00:00",
        breakMinutes: 45,
        graceMinutes: 10,
        overnight: true,
        status: "active",
      },
    ];

    resolveTenantContext.mockResolvedValue({
      organization: { id: orgA, name: "Acme Corp" },
      membership: { id: "mem-1", roleId: "role-admin", status: "active" },
    });

    authorize.mockResolvedValue(undefined);
    authorizeAny.mockResolvedValue(undefined);
  });

  it("POST creates a valid daytime shift with timings and schedule parameters", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Morning Shift",
        code: "MORN-01",
        startTime: "08:00",
        endTime: "16:30",
        breakMinutes: 45,
        graceMinutes: 10,
        overnight: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.item).toBeDefined();
    expect(body.item.name).toBe("Morning Shift");
    expect(lastInsertedShift?.startTime).toBe("08:00");
    expect(lastInsertedShift?.endTime).toBe("16:30");
    expect(lastInsertedShift?.breakMinutes).toBe(45);
    expect(lastInsertedShift?.graceMinutes).toBe(10);
    expect(lastInsertedShift?.overnight).toBe(false);
  });

  it("POST allows creating an overnight shift when overnight is true", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Overnight Operations",
        code: "NIGHT-OP",
        startTime: "21:00",
        endTime: "05:00",
        breakMinutes: 60,
        graceMinutes: 15,
        overnight: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(lastInsertedShift?.overnight).toBe(true);
  });

  it("POST rejects end time earlier than start time if overnight is false", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Invalid Day Shift",
        code: "INV-01",
        startTime: "18:00",
        endTime: "09:00",
        overnight: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("End time must be after start time");
  });

  it("POST rejects identical start and end times", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Zero Duration Shift",
        code: "ZERO-01",
        startTime: "09:00",
        endTime: "09:00",
        overnight: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("Start time and end time cannot be identical");
  });

  it("POST rejects invalid time formats", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bad Format Shift",
        code: "BAD-TIME",
        startTime: "9am",
        endTime: "5pm",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("Invalid start time format");
  });

  it("GET lists shifts with status filter", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts?status=active");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(body.items.length).toBe(2);
  });

  it("PATCH /api/app/master-data/shifts/[itemId] updates shift timings via camelCase payload", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts/shift-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated Day Shift",
        startTime: "08:30",
        endTime: "17:30",
        breakMinutes: 50,
        graceMinutes: 12,
        overnight: false,
      }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ resource: "shifts", itemId: "shift-1" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("PATCH /api/app/master-data/shifts/[itemId] rejects invalid overnight configuration", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts/shift-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startTime: "22:00",
        endTime: "06:00",
        overnight: false,
      }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ resource: "shifts", itemId: "shift-1" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("End time must be after start time unless marked as an overnight shift");
  });

  it("POST defaults graceMinutes to 15 when omitted from creation payload", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Default Grace Shift",
        code: "DEF-GRACE",
        startTime: "09:00",
        endTime: "18:00",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(lastInsertedShift?.graceMinutes).toBe(15);
    expect(lastInsertedShift?.breakMinutes).toBe(60);
  });

  it("POST defaults graceMinutes to 15 when empty string or null is provided", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Empty Grace Shift",
        code: "EMP-GRACE",
        startTime: "10:00",
        endTime: "19:00",
        graceMinutes: "",
        breakMinutes: "",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(lastInsertedShift?.graceMinutes).toBe(15);
    expect(lastInsertedShift?.breakMinutes).toBe(60);
  });

  it("POST rejects negative graceMinutes", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Negative Grace Shift",
        code: "NEG-GRACE",
        startTime: "09:00",
        endTime: "18:00",
        graceMinutes: -5,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("Grace period cannot be negative");
  });

  it("POST rejects non-integer graceMinutes", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Fractional Grace Shift",
        code: "FRAC-GRACE",
        startTime: "09:00",
        endTime: "18:00",
        graceMinutes: 12.5,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("Grace period must be an integer");
  });

  it("PATCH preserves explicit custom grace-period values including 0", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts/shift-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        graceMinutes: 0,
      }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ resource: "shifts", itemId: "shift-1" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("PATCH rejects negative graceMinutes", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts/shift-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        graceMinutes: -10,
      }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ resource: "shifts", itemId: "shift-1" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("Grace period must be a non-negative integer");
  });

  it("PATCH rejects non-integer graceMinutes", async () => {
    const req = new Request("http://localhost/api/app/master-data/shifts/shift-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        graceMinutes: 7.5,
      }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ resource: "shifts", itemId: "shift-1" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("Grace period must be a non-negative integer");
  });
});
