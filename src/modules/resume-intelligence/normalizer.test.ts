import { describe, expect, it } from "vitest";
import { normalizeSkillName, parseDeterministicResume, resumeHash, sanitizeFileName, validateResumeFile } from "@/modules/resume-intelligence/normalizer";
describe("resume intelligence normalizer", () => {
  it("hashes identical bytes deterministically", () => expect(resumeHash(new TextEncoder().encode("resume"))).toBe(resumeHash(new TextEncoder().encode("resume"))));
  it("normalizes known skill aliases", () => { expect(normalizeSkillName("ReactJS")).toBe("React"); expect(normalizeSkillName("Postgres")).toBe("PostgreSQL"); });
  it("preserves unknown skill terms", () => expect(normalizeSkillName("Quantum Widgets")).toBe("Quantum Widgets"));
  it("sanitizes filenames", () => expect(sanitizeFileName("../my resume!.pdf")).toBe("_my_resume_.pdf"));
  it("validates extension and MIME together", () => { expect(() => validateResumeFile({ fileName: "resume.pdf", mimeType: "application/pdf", size: 100 })).not.toThrow(); expect(() => validateResumeFile({ fileName: "resume.exe", mimeType: "application/pdf", size: 100 })).toThrow(); });
  it("extracts only explicit deterministic evidence", () => { const result = parseDeterministicResume({ text: "Jane Doe jane@example.com ReactJS https://github.com/jane", extractorVersion: "test", warnings: [] }); expect(result.personal.email).toBe("jane@example.com"); expect(result.skills[0].normalizedName).toBe("React"); expect(result.links[0].kind).toBe("github"); });
});
