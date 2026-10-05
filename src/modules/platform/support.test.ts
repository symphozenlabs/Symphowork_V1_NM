import { describe, expect, it } from "vitest";
import { supportNoteSchema } from "./support";

describe("platform support module", () => {
  describe("support note validation", () => {
    it("accepts valid note payload with uuid and non-empty note", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const result = supportNoteSchema.safeParse({
        organizationId: validUuid,
        note: "Verified customer credentials and escalated issue.",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid organization uuid", () => {
      const result = supportNoteSchema.safeParse({
        organizationId: "invalid-uuid",
        note: "Some note",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty or whitespace-only note", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const result = supportNoteSchema.safeParse({
        organizationId: validUuid,
        note: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("rejects notes exceeding 2000 characters", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const result = supportNoteSchema.safeParse({
        organizationId: validUuid,
        note: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("support pagination calculation semantics", () => {
    function computePagination(total: number, page: number, pageSize: number = 10) {
      const safePage = Math.max(1, page);
      const safePageSize = Math.min(100, Math.max(1, pageSize));
      const pageCount = Math.max(1, Math.ceil(total / safePageSize));
      const startRecord = total === 0 ? 0 : (safePage - 1) * safePageSize + 1;
      const endRecord = Math.min(total, safePage * safePageSize);
      return { startRecord, endRecord, pageCount, page: safePage, pageSize: safePageSize };
    }

    it("handles empty results with zero records and page 1 of 1", () => {
      const p = computePagination(0, 1, 10);
      expect(p.startRecord).toBe(0);
      expect(p.endRecord).toBe(0);
      expect(p.pageCount).toBe(1);
    });

    it("handles single page of results", () => {
      const p = computePagination(5, 1, 10);
      expect(p.startRecord).toBe(1);
      expect(p.endRecord).toBe(5);
      expect(p.pageCount).toBe(1);
    });

    it("handles multi-page results across pages", () => {
      const p1 = computePagination(25, 1, 10);
      expect(p1.startRecord).toBe(1);
      expect(p1.endRecord).toBe(10);
      expect(p1.pageCount).toBe(3);

      const p2 = computePagination(25, 2, 10);
      expect(p2.startRecord).toBe(11);
      expect(p2.endRecord).toBe(20);

      const p3 = computePagination(25, 3, 10);
      expect(p3.startRecord).toBe(21);
      expect(p3.endRecord).toBe(25);
    });

    it("clamps invalid or out-of-range page numbers", () => {
      const p = computePagination(10, 0, 10);
      expect(p.page).toBe(1);
    });
  });
});
