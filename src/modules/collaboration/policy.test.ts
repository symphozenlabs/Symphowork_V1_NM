import { describe, expect, it } from "vitest";
import { parseMentionNames, projectNumber, sanitizeCollaborationText, taskNumber, taskProgress, validateDateRange, wouldCreateDependencyCycle } from "./policy";
describe("collaboration policy", () => {
  it("formats atomic counter values", () => { expect(projectNumber(1)).toBe("PRJ-000001"); expect(taskNumber(12)).toBe("TSK-000012"); });
  it("rejects invalid date ranges and sanitizes unsafe text", () => { expect(() => validateDateRange("2026-01-10", "2026-01-01")).toThrow(); expect(sanitizeCollaborationText("<script>alert(1)</script><b>Hello</b>")).toBe("Hello"); });
  it("prevents dependency cycles", () => { const edges = [{ predecessorTaskId: "a", successorTaskId: "b" }, { predecessorTaskId: "b", successorTaskId: "c" }]; expect(wouldCreateDependencyCycle(edges, "c", "a")).toBe(true); expect(wouldCreateDependencyCycle(edges, "a", "c")).toBe(false); expect(wouldCreateDependencyCycle(edges, "c", "d")).toBe(false); });
  it("calculates project progress and extracts mentions", () => { expect(taskProgress(["completed", "in_progress", "blocked"]).percentage).toBe(33); expect(parseMentionNames("@Arun please check with @Priya")).toEqual(["Arun", "Priya"]); });
});
