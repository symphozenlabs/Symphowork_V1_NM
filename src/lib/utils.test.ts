import { describe, expect, it } from "vitest";
import { formatNumber } from "@/lib/utils";
describe("formatNumber", () => { it("formats numbers for the product locale", () => expect(formatNumber(1234567)).toBe("12,34,567")); });
