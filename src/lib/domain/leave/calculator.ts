export type LeaveDayConfig = { date: string; isWorkingDay: boolean; isHoliday: boolean };
export function calculateLeaveDays(days: LeaveDayConfig[], halfDay = false) { const count = days.filter((day) => day.isWorkingDay && !day.isHoliday).length; return halfDay ? count - 0.5 : count; }
export function overlaps(start: string, end: string, existing: { startDate: string; endDate: string }[]) { return existing.some((item) => start <= item.endDate && end >= item.startDate); }
export function availableBalance(balance: { opening: number; accrued: number; adjusted: number; consumed: number; pending: number }) { return balance.opening + balance.accrued + balance.adjusted - balance.consumed - balance.pending; }
