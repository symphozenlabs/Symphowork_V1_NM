import { describe, expect, it } from "vitest";
import { nextWorkflowStatus } from "@/modules/workflows/service";
describe("workflow transitions", () => { it("advances sequential approvals", () => expect(nextWorkflowStatus("approve", true)).toBe("in_progress")); it("completes final approval", () => expect(nextWorkflowStatus("approve", false)).toBe("approved")); it("rejects and cancels terminally", () => { expect(nextWorkflowStatus("reject", true)).toBe("rejected"); expect(nextWorkflowStatus("cancel", true)).toBe("cancelled"); }); });
