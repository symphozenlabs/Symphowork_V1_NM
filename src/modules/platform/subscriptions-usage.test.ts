import { describe, expect, it } from "vitest";
import type { OrganizationUsageRow } from "@/modules/platform/commercial";
import { formatDateInOrganizationTimezone, getSeatCapacityDisplay, getSubscriptionExpiryDisplay, getSubscriptionUsageStatus, listSubscriptionUsageRows } from "./subscriptions-usage";

function makeRow(input: {
  id: string;
  name: string;
  slug: string;
  orgStatus?: string;
  plan?: { id: string; code: string; name: string; maxUsers: number | null } | null;
  subscription?: { status: string; billingStatus: string; billingCycle: string } | null;
  activeEmployees?: number;
  usageStatus?: OrganizationUsageRow["status"];
}): OrganizationUsageRow {
  const plan = input.plan === undefined ? { id: "plan-1", code: "GROWTH", name: "Growth Plan", maxUsers: 150 } : input.plan;
  const subscription = input.subscription === undefined
    ? { status: "active", billingStatus: "active", billingCycle: "annual" }
    : input.subscription;
  return {
    organization: { id: input.id, name: input.name, slug: input.slug, status: input.orgStatus ?? "active" },
    plan,
    subscription,
    activeEmployees: input.activeEmployees ?? 18,
    employeeLimit: plan?.maxUsers ?? null,
    remaining: plan?.maxUsers == null ? null : plan.maxUsers - (input.activeEmployees ?? 18),
    overLimit: plan?.maxUsers != null && (input.activeEmployees ?? 18) > plan.maxUsers,
    nearLimit: input.usageStatus === "near_limit",
    limitReached: input.usageStatus === "limit_reached",
    status: input.usageStatus ?? "within_limit",
    statusLabel: "Within limit",
  } as unknown as OrganizationUsageRow;
}

describe("combined subscriptions and usage view model", () => {
  const rows = [
    makeRow({ id: "1", name: "Naresh Technologies", slug: "naresh-tech", activeEmployees: 18 }),
    makeRow({ id: "2", name: "SymphoWork QA Tenant B", slug: "symphowork-qa", subscription: { status: "active", billingStatus: "trialing", billingCycle: "monthly" }, activeEmployees: 22, usageStatus: "near_limit", plan: { id: "plan-2", code: "QA", name: "QA Plan", maxUsers: 25 } }),
    makeRow({ id: "3", name: "Wizaltia HR", slug: "wizaltia-hr", orgStatus: "suspended", subscription: { status: "suspended", billingStatus: "paused", billingCycle: "monthly" } }),
    makeRow({ id: "4", name: "Unlimited Co", slug: "unlimited", plan: { id: "plan-3", code: "ENT", name: "Enterprise", maxUsers: null }, activeEmployees: 400 }),
    makeRow({ id: "5", name: "Over Limit Co", slug: "over-limit", plan: { id: "plan-4", code: "SMALL", name: "Small Plan", maxUsers: 10 }, activeEmployees: 14, usageStatus: "over_limit" }),
    makeRow({ id: "6", name: "No Plan Co", slug: "no-plan", plan: null, subscription: null, activeEmployees: 0 }),
    makeRow({ id: "7", name: "Zero Seat Co", slug: "zero-seat", plan: { id: "plan-5", code: "ZERO", name: "Zero Seat", maxUsers: 0 }, activeEmployees: 0, usageStatus: "limit_reached" }),
  ];

  it("maps active, trial, suspended, inactive, and attention states", () => {
    expect(getSubscriptionUsageStatus(rows[0]).status).toBe("active");
    expect(getSubscriptionUsageStatus(rows[1]).status).toBe("trialing");
    expect(getSubscriptionUsageStatus(rows[2]).status).toBe("suspended");
    expect(getSubscriptionUsageStatus(rows[5]).status).toBe("inactive");
    expect(getSubscriptionUsageStatus(rows[4]).status).toBe("attention_required");
    expect(getSubscriptionUsageStatus(makeRow({ id: "9", name: "Pending Org", slug: "pending-org", orgStatus: "pending", subscription: null })).status).toBe("attention_required");
    expect(getSubscriptionUsageStatus(makeRow({ id: "8", name: "Past Due", slug: "past-due", subscription: { status: "active", billingStatus: "past_due", billingCycle: "monthly" } })).status).toBe("attention_required");
  });

  it("searches organization name, slug, plan name, and plan code", () => {
    expect(listSubscriptionUsageRows(rows, { query: "Naresh" }).rows.map((row) => row.organization.id)).toEqual(["1"]);
    expect(listSubscriptionUsageRows(rows, { query: "symphowork-qa" }).rows.map((row) => row.organization.id)).toEqual(["2"]);
    expect(listSubscriptionUsageRows(rows, { query: "Enterprise" }).rows.map((row) => row.organization.id)).toEqual(["4"]);
    expect(listSubscriptionUsageRows(rows, { query: "SMALL" }).rows.map((row) => row.organization.id)).toEqual(["5"]);
  });

  it("filters by subscription and usage status, plan, and monthly or annual cadence", () => {
    expect(listSubscriptionUsageRows(rows, { status: "active" }).rows.map((row) => row.organization.id)).toEqual(["1", "4"]);
    expect(listSubscriptionUsageRows(rows, { status: "trialing" }).rows.map((row) => row.organization.id)).toEqual(["2"]);
    expect(listSubscriptionUsageRows(rows, { status: "suspended" }).rows.map((row) => row.organization.id)).toEqual(["3"]);
    expect(listSubscriptionUsageRows(rows, { status: "near_limit" }).rows.map((row) => row.organization.id)).toEqual(["2"]);
    expect(listSubscriptionUsageRows(rows, { status: "over_limit" }).rows.map((row) => row.organization.id)).toEqual(["5"]);
    expect(listSubscriptionUsageRows(rows, { plan: "QA" }).rows.map((row) => row.organization.id)).toEqual(["2"]);
    expect(listSubscriptionUsageRows(rows, { billing: "annual" }).rows.map((row) => row.organization.id)).toEqual(["1", "4", "5", "7"]);
    expect(listSubscriptionUsageRows(rows, { billing: "monthly" }).rows.map((row) => row.organization.id)).toEqual(["2", "3"]);
  });

  it("shows real finite capacity, clamps over-limit remaining to zero, and handles unlimited or missing plans", () => {
    expect(getSeatCapacityDisplay(rows[0])).toEqual({ display: "132 / 150", overBy: 0, kind: "finite" });
    expect(getSeatCapacityDisplay(rows[1])).toEqual({ display: "3 / 25", overBy: 0, kind: "finite" });
    expect(getSeatCapacityDisplay(rows[4])).toEqual({ display: "0 / 10", overBy: 4, kind: "finite" });
    expect(getSeatCapacityDisplay(rows[6])).toEqual({ display: "0 / 0", overBy: 0, kind: "finite" });
    expect(getSeatCapacityDisplay(rows[3])).toEqual({ display: "Unlimited / Unlimited", overBy: 0, kind: "unlimited" });
    expect(getSeatCapacityDisplay(rows[5])).toEqual({ display: "— / —", overBy: 0, kind: "missing" });
  });

  it("paginates the filtered unified set and safely represents an empty result", () => {
    expect(listSubscriptionUsageRows(rows, { page: 2, pageSize: 2 })).toMatchObject({ total: 7, page: 2, pageSize: 2, pageCount: 4, rows: [{ organization: { id: "3" } }, { organization: { id: "4" } }] });
    expect(listSubscriptionUsageRows(rows, { query: "nothing matches" })).toMatchObject({ total: 0, page: 1, pageCount: 1, rows: [] });
  });
});

describe("read-only subscription expiry display", () => {
  const now = new Date("2026-11-25T12:00:00.000Z");

  it("calculates one calendar month from the start and remaining days in local calendar dates", () => {
    expect(getSubscriptionExpiryDisplay({
      startsAt: "2026-11-24T10:00:00.000Z", billingCycle: "monthly", timezone: "UTC", now,
    })).toMatchObject({ date: "2026-12-24", formattedDate: "2026-12-24", remainingDays: 29, state: "active", source: "calculated" });
  });

  it("calculates one calendar year for annual billing", () => {
    expect(getSubscriptionExpiryDisplay({
      startsAt: "2026-11-24T10:00:00.000Z", billingCycle: "annual", timezone: "UTC", now,
    })).toMatchObject({ date: "2027-11-24", remainingDays: 364, state: "active", source: "calculated" });
  });

  it("uses a stored end date before calculating from the billing interval", () => {
    expect(getSubscriptionExpiryDisplay({
      storedEndDate: "2026-12-31T00:00:00.000Z", startsAt: "2026-11-24T00:00:00.000Z",
      billingCycle: "monthly", timezone: "UTC", now,
    })).toMatchObject({ date: "2026-12-31", remainingDays: 36, state: "active", source: "stored" });
  });

  it("clamps month-end starts to the final valid day of February", () => {
    expect(getSubscriptionExpiryDisplay({
      startsAt: "2025-01-31T12:00:00.000Z", billingCycle: "monthly", timezone: "UTC",
      now: new Date("2025-01-01T12:00:00.000Z"),
    })).toMatchObject({ date: "2025-02-28", remainingDays: 58, state: "active" });
  });

  it("handles leap-day annual billing consistently", () => {
    expect(getSubscriptionExpiryDisplay({
      startsAt: "2024-02-29T12:00:00.000Z", billingCycle: "annual", timezone: "UTC",
      now: new Date("2024-03-01T12:00:00.000Z"),
    })).toMatchObject({ date: "2025-02-28", state: "active", source: "calculated" });
  });

  it("returns not configured for missing starts or unsupported intervals", () => {
    expect(getSubscriptionExpiryDisplay({ billingCycle: "monthly", now })).toMatchObject({ date: null, formattedDate: "Not configured", remainingDays: null, state: "not_configured" });
    expect(getSubscriptionExpiryDisplay({ startsAt: "2026-11-24T00:00:00Z", billingCycle: "weekly", now })).toMatchObject({ date: null, formattedDate: "Not configured", remainingDays: null, state: "not_configured" });
    expect(getSubscriptionExpiryDisplay({ storedEndDate: "invalid", startsAt: "2026-11-24T00:00:00Z", billingCycle: "annual", now })).toMatchObject({ date: null, remainingDays: null, state: "not_configured", source: "missing" });
  });

  it("shows zero days and an expired state when the end date is today or earlier", () => {
    expect(getSubscriptionExpiryDisplay({ storedEndDate: "2026-11-25T23:59:00.000Z", timezone: "UTC", now })).toMatchObject({ remainingDays: 0, state: "passed" });
    expect(getSubscriptionExpiryDisplay({ storedEndDate: "2026-11-20T23:59:00.000Z", timezone: "UTC", now })).toMatchObject({ remainingDays: 0, state: "passed" });
  });

  it("compares local calendar dates across timezone boundaries", () => {
    expect(getSubscriptionExpiryDisplay({
      storedEndDate: "2026-11-25T02:00:00.000Z", timezone: "America/Los_Angeles",
      now: new Date("2026-11-25T12:00:00.000Z"),
    })).toMatchObject({ date: "2026-11-24", remainingDays: 0, state: "passed" });
    expect(formatDateInOrganizationTimezone("2026-11-25T02:00:00.000Z", "America/Los_Angeles", "MM/dd/yyyy")).toBe("11/24/2026");
  });
});
