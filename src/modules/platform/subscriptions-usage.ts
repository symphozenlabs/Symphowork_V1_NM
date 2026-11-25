import type { OrganizationUsageRow } from "@/modules/platform/commercial";

export type SubscriptionUsageStatus = "active" | "trialing" | "attention_required" | "suspended" | "inactive";
export type UnifiedSubscriptionUsageStatus = SubscriptionUsageStatus | "within_limit" | "near_limit" | "limit_reached" | "over_limit";

export interface SubscriptionValidityInput {
  storedEndDate?: string | Date | null;
  startsAt?: string | Date | null;
  billingCycle?: string | null;
  timezone?: string | null;
  dateFormat?: string | null;
  now?: Date;
}

export interface SubscriptionExpiryDisplay {
  date: string | null;
  formattedDate: string;
  remainingDays: number | null;
  state: "active" | "passed" | "not_configured";
  source: "stored" | "calculated" | "missing";
}

function datePartsInTimezone(value: Date, timezone: string): { year: number; month: number; day: number } | null {
  if (!Number.isFinite(value.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const year = get("year");
    const month = get("month");
    const day = get("day");
    return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day) ? { year, month, day } : null;
  } catch {
    return null;
  }
}

function isoCalendarDate(parts: { year: number; month: number; day: number }): string {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function parseInstant(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function addCalendarMonth(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const targetYear = year + Math.floor(month / 12);
  const targetMonth = month % 12 + 1;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const target = new Date(Date.UTC(targetYear, targetMonth - 1, Math.min(day, lastDay)));
  return isoCalendarDate({ year: target.getUTCFullYear(), month: target.getUTCMonth() + 1, day: target.getUTCDate() });
}

function addCalendarYear(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year + 1, month, 0)).getUTCDate();
  return isoCalendarDate({ year: year + 1, month, day: Math.min(day, lastDay) });
}

function calendarDaysBetween(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((endUtc - startUtc) / 86_400_000);
}

function formatCalendarDate(date: string, dateFormat: string): string {
  const [year, month, day] = date.split("-");
  if (dateFormat === "dd/MM/yyyy") return `${day}/${month}/${year}`;
  if (dateFormat === "MM/dd/yyyy") return `${month}/${day}/${year}`;
  return `${year}-${month}-${day}`;
}

export function formatDateInOrganizationTimezone(
  value: string | Date | null | undefined,
  timezone = "UTC",
  dateFormat = "yyyy-MM-dd",
): string {
  const instant = parseInstant(value);
  const parts = instant && datePartsInTimezone(instant, timezone);
  return parts ? formatCalendarDate(isoCalendarDate(parts), dateFormat) : "Not configured";
}

/** Read-only calendar validity display. This function never changes the subscription record or its status. */
export function getSubscriptionExpiryDisplay(input: SubscriptionValidityInput): SubscriptionExpiryDisplay {
  const timezone = input.timezone || "UTC";
  const now = input.now ?? new Date();
  const today = datePartsInTimezone(now, timezone);
  if (!today) return { date: null, formattedDate: "Not configured", remainingDays: null, state: "not_configured", source: "missing" };
  const todayDate = isoCalendarDate(today);
  const finish = (date: string, source: "stored" | "calculated"): SubscriptionExpiryDisplay => ({
    date,
    formattedDate: formatCalendarDate(date, input.dateFormat ?? "yyyy-MM-dd"),
    remainingDays: Math.max(0, calendarDaysBetween(todayDate, date)),
    state: date > todayDate ? "active" : "passed",
    source,
  });

  if (input.storedEndDate != null) {
    const stored = parseInstant(input.storedEndDate);
    const parts = stored && datePartsInTimezone(stored, timezone);
    if (!parts) return { date: null, formattedDate: "Not configured", remainingDays: null, state: "not_configured", source: "missing" };
    return finish(isoCalendarDate(parts), "stored");
  }

  const start = parseInstant(input.startsAt);
  const startParts = start && datePartsInTimezone(start, timezone);
  if (!startParts || !today) return { date: null, formattedDate: "Not configured", remainingDays: null, state: "not_configured", source: "missing" };
  const startDate = isoCalendarDate(startParts);
  let endDate: string | null = null;
  if (input.billingCycle === "monthly") endDate = addCalendarMonth(startDate);
  else if (input.billingCycle === "annual") endDate = addCalendarYear(startDate);

  if (!endDate) return { date: null, formattedDate: "Not configured", remainingDays: null, state: "not_configured", source: "missing" };
  return finish(endDate, "calculated");
}

export interface ListSubscriptionsUsageInput {
  query?: string;
  status?: UnifiedSubscriptionUsageStatus | "all";
  plan?: string;
  billing?: string;
  page?: number;
  pageSize?: number;
}

export interface SubscriptionUsageRow extends OrganizationUsageRow {
  subscriptionStatus: SubscriptionUsageStatus;
  subscriptionStatusLabel: string;
}

export function getSeatCapacityDisplay(row: Pick<OrganizationUsageRow, "plan" | "employeeLimit" | "activeEmployees">) {
  if (!row.plan) return { display: "— / —", overBy: 0, kind: "missing" as const };
  if (row.employeeLimit === null) return { display: "Unlimited / Unlimited", overBy: 0, kind: "unlimited" as const };
  const remaining = Math.max(0, row.employeeLimit - row.activeEmployees);
  return {
    display: `${remaining} / ${row.employeeLimit}`,
    overBy: Math.max(0, row.activeEmployees - row.employeeLimit),
    kind: "finite" as const,
  };
}

export function getSubscriptionUsageStatus(row: OrganizationUsageRow): { status: SubscriptionUsageStatus; label: string } {
  const subscription = row.subscription;
  const organizationStatus = String(row.organization.status ?? "active").toLowerCase();

  if (organizationStatus === "suspended" || subscription?.status === "suspended") {
    return { status: "suspended", label: "Suspended" };
  }
  if (["rejected", "archived"].includes(organizationStatus) || ["cancelled", "expired"].includes(subscription?.status ?? "")) {
    return { status: "inactive", label: "Inactive" };
  }
  if (subscription?.billingStatus === "trialing") return { status: "trialing", label: "Trial" };
  if (organizationStatus !== "active" || subscription?.status === "pending" || ["past_due", "paused"].includes(subscription?.billingStatus ?? "")) {
    return { status: "attention_required", label: "Attention required" };
  }
  if (!subscription) return { status: "inactive", label: "No subscription" };
  if (row.overLimit || row.nearLimit || row.limitReached) {
    return { status: "attention_required", label: row.overLimit ? "Over seat limit" : row.limitReached ? "Seat limit reached" : "Near seat limit" };
  }
  if (subscription.status === "active" && subscription.billingStatus === "active") {
    return { status: "active", label: "Active" };
  }
  return { status: "attention_required", label: "Attention required" };
}

export function listSubscriptionUsageRows(
  rows: OrganizationUsageRow[],
  input: ListSubscriptionsUsageInput = {},
) {
  const query = input.query?.trim().toLocaleLowerCase();
  const filtered = rows
    .map((row): SubscriptionUsageRow => {
      const status = getSubscriptionUsageStatus(row);
      return { ...row, subscriptionStatus: status.status, subscriptionStatusLabel: status.label };
    })
    .filter((row) => {
      if (query && ![
        row.organization.name,
        row.organization.slug,
        row.plan?.name,
        row.plan?.code,
      ].some((value) => value?.toLocaleLowerCase().includes(query))) return false;
      if (input.plan && input.plan !== "all" && row.plan?.id !== input.plan && row.plan?.code !== input.plan) return false;
      if (input.billing && input.billing !== "all" && row.subscription?.billingCycle !== input.billing) return false;
      if (input.status && input.status !== "all") {
        if (["active", "trialing", "attention_required", "suspended", "inactive"].includes(input.status)) {
          if (row.subscriptionStatus !== input.status) return false;
        } else if (row.status !== input.status) return false;
      }
      return true;
    });

  const requestedPage = Number.isFinite(input.page) ? Math.floor(input.page!) : 1;
  const page = Math.max(1, requestedPage);
  const requestedPageSize = Number.isFinite(input.pageSize) ? Math.floor(input.pageSize!) : 10;
  const pageSize = Math.min(100, Math.max(1, requestedPageSize));
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const planOptions = new Map<string, { id: string; code: string; name: string }>();
  for (const row of rows) {
    if (row.plan) planOptions.set(row.plan.id, { id: row.plan.id, code: row.plan.code, name: row.plan.name });
  }

  return {
    rows: filtered.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    pageCount,
    availablePlans: [...planOptions.values()],
  };
}
