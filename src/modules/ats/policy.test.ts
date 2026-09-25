import { describe, expect, it } from "vitest";
import { atsSlug, candidateDuplicateKeys, canMoveApplication, canPublishJob, experienceYears, publicCandidateInput } from "@/modules/ats/policy";
describe("ATS policy foundation", () => {
  it("creates stable public slugs", () => expect(atsSlug("Senior React Developer — Bengaluru")).toBe("senior-react-developer-bengaluru"));
  it("normalizes duplicate matching keys", () => expect(candidateDuplicateKeys(" Recruiter@Example.COM ", "+91 98765 43210")).toEqual({ email: "recruiter@example.com", phone: "919876543210" }));
  it("calculates structured experience duration", () => expect(experienceYears("2020-01-01", "2021-01-01")).toBe(1));
  it("rejects invalid experience dates", () => expect(() => experienceYears("2022-01-01", "2021-01-01")).toThrow());
  it("only publishes approved or open requisitions", () => { expect(canPublishJob("draft")).toBe(false); expect(canPublishJob("approved")).toBe(true); });
  it("prevents no-op stage movement", () => { expect(canMoveApplication("screening", "screening")).toBe(false); expect(canMoveApplication("screening", "interview")).toBe(true); });
  it("requires consent for public applications", () => { expect(publicCandidateInput.safeParse({ firstName: "A", lastName: "B", email: "a@b.com", consentStatus: "granted" }).success).toBe(true); expect(publicCandidateInput.safeParse({ firstName: "A", lastName: "B", email: "a@b.com", consentStatus: "not_granted" }).success).toBe(false); });
});
