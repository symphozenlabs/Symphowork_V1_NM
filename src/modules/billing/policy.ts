export type PlanLimit = number | null;
export function limitAllows(limit: PlanLimit, current: number, requested = 1) { return limit === null || current + requested <= limit; }
export function billingFeatureAvailable(enabled: boolean, limit: PlanLimit, current = 0, requested = 1) { return enabled && limitAllows(limit, current, requested); }
