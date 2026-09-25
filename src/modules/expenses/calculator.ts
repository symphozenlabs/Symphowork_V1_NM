export type ExpenseItemInput = { amount: number };
export function calculateExpenseTotal(items: ExpenseItemInput[]) { if (!items.length) return 0; return Math.round(items.reduce((total, item) => total + item.amount, 0) * 100) / 100; }
export type ExpenseClaimStatus = "draft" | "submitted" | "pending_approval" | "approved" | "rejected" | "cancelled";
const transitions: Record<ExpenseClaimStatus, readonly ExpenseClaimStatus[]> = { draft: ["submitted", "cancelled"], submitted: ["pending_approval", "rejected", "cancelled"], pending_approval: ["approved", "rejected", "cancelled"], approved: [], rejected: [], cancelled: [] };
export function canTransitionExpenseStatus(from: ExpenseClaimStatus, to: ExpenseClaimStatus) { return transitions[from].includes(to); }
export function canTransitionReimbursementStatus(from: "not_eligible" | "pending" | "processing" | "reimbursed" | "failed" | "cancelled", to: "not_eligible" | "pending" | "processing" | "reimbursed" | "failed" | "cancelled") { if (from === "reimbursed") return false; return from !== to; }
