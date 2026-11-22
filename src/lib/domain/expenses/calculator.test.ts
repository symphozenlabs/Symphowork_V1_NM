import { describe, expect, it } from "vitest";
import { calculateExpenseTotal, canTransitionExpenseStatus } from "$lib/domain/expenses/calculator";
describe("expense calculation", () => { it("calculates totals from item amounts", () => expect(calculateExpenseTotal([{ amount: 2500 }, { amount: 800.5 }])).toBe(3300.5)); it("enforces controlled status transitions", () => { expect(canTransitionExpenseStatus("draft", "submitted")).toBe(true); expect(canTransitionExpenseStatus("approved", "draft")).toBe(false); }); });
