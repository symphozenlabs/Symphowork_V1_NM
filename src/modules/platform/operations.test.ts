import { describe, expect, it } from "vitest";
import { canTransitionOrganizationStatus } from "./operations";

describe("platform operations policy", () => {
  it("allows only supported organization lifecycle transitions", () => {
    // Valid transitions
    expect(canTransitionOrganizationStatus("pending", "active")).toBe(true);
    expect(canTransitionOrganizationStatus("pending", "rejected")).toBe(true);
    expect(canTransitionOrganizationStatus("active", "suspended")).toBe(true);
    expect(canTransitionOrganizationStatus("active", "archived")).toBe(true);
    expect(canTransitionOrganizationStatus("suspended", "active")).toBe(true);
    expect(canTransitionOrganizationStatus("suspended", "archived")).toBe(true);

    // Invalid transitions
    expect(canTransitionOrganizationStatus("active", "rejected")).toBe(false);
    expect(canTransitionOrganizationStatus("active", "active")).toBe(false);
    expect(canTransitionOrganizationStatus("suspended", "suspended")).toBe(false);
    expect(canTransitionOrganizationStatus("pending", "suspended")).toBe(false);
    expect(canTransitionOrganizationStatus("rejected", "active")).toBe(false);
    expect(canTransitionOrganizationStatus("archived", "active")).toBe(false);
  });

  describe("platform users pagination computation semantics", () => {
    function computeUserPagination(total: number, page: number, pageSize: number = 10) {
      const safePage = Math.max(1, page);
      const safePageSize = Math.min(100, Math.max(1, pageSize));
      const pageCount = Math.max(1, Math.ceil(total / safePageSize));
      const startRecord = total === 0 ? 0 : (safePage - 1) * safePageSize + 1;
      const endRecord = Math.min(total, safePage * safePageSize);
      return { startRecord, endRecord, pageCount, page: safePage, pageSize: safePageSize };
    }

    it("handles zero users with page 1 of 1 and zero record bounds", () => {
      const p = computeUserPagination(0, 1, 10);
      expect(p.startRecord).toBe(0);
      expect(p.endRecord).toBe(0);
      expect(p.pageCount).toBe(1);
    });

    it("handles single page of users within default page size 10", () => {
      const p = computeUserPagination(4, 1, 10);
      expect(p.startRecord).toBe(1);
      expect(p.endRecord).toBe(4);
      expect(p.pageCount).toBe(1);
    });

    it("handles multiple pages across user records", () => {
      const p1 = computeUserPagination(23, 1, 10);
      expect(p1.startRecord).toBe(1);
      expect(p1.endRecord).toBe(10);
      expect(p1.pageCount).toBe(3);

      const p2 = computeUserPagination(23, 2, 10);
      expect(p2.startRecord).toBe(11);
      expect(p2.endRecord).toBe(20);

      const p3 = computeUserPagination(23, 3, 10);
      expect(p3.startRecord).toBe(21);
      expect(p3.endRecord).toBe(23);
    });

    it("clamps invalid page and pageSize bounds safely", () => {
      const p = computeUserPagination(15, -5, 200);
      expect(p.page).toBe(1);
      expect(p.pageSize).toBe(100);
    });
  });

  describe("platform audit pagination and rows per page semantics", () => {
    function computeAuditPagination(total: number, page: number, pageSize: number) {
      const safePage = Math.max(1, page);
      const allowedSizes = [10, 25, 50, 100];
      const safePageSize = allowedSizes.includes(pageSize) ? pageSize : 10;
      const pageCount = Math.max(1, Math.ceil(total / safePageSize));
      const startRecord = total === 0 ? 0 : (safePage - 1) * safePageSize + 1;
      const endRecord = Math.min(total, safePage * safePageSize);
      return { startRecord, endRecord, pageCount, page: safePage, pageSize: safePageSize };
    }

    it("evaluates exact scenario: 73 events with pageSize 10 (8 pages)", () => {
      const p = computeAuditPagination(73, 1, 10);
      expect(p.pageCount).toBe(8);
      expect(p.startRecord).toBe(1);
      expect(p.endRecord).toBe(10);
    });

    it("evaluates exact scenario: 73 events with pageSize 25 (3 pages)", () => {
      const p1 = computeAuditPagination(73, 1, 25);
      expect(p1.pageCount).toBe(3);
      expect(p1.startRecord).toBe(1);
      expect(p1.endRecord).toBe(25);

      const p2 = computeAuditPagination(73, 2, 25);
      expect(p2.startRecord).toBe(26);
      expect(p2.endRecord).toBe(50);

      const p3 = computeAuditPagination(73, 3, 25);
      expect(p3.startRecord).toBe(51);
      expect(p3.endRecord).toBe(73);
    });

    it("evaluates exact scenario: 73 events with pageSize 50 (2 pages)", () => {
      const p = computeAuditPagination(73, 1, 50);
      expect(p.pageCount).toBe(2);
      expect(p.startRecord).toBe(1);
      expect(p.endRecord).toBe(50);
    });

    it("evaluates exact scenario: 73 events with pageSize 100 (1 page)", () => {
      const p = computeAuditPagination(73, 1, 100);
      expect(p.pageCount).toBe(1);
      expect(p.startRecord).toBe(1);
      expect(p.endRecord).toBe(73);
    });

    it("handles zero events cleanly", () => {
      const p = computeAuditPagination(0, 1, 25);
      expect(p.startRecord).toBe(0);
      expect(p.endRecord).toBe(0);
      expect(p.pageCount).toBe(1);
    });
  });
});
