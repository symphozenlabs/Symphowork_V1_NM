import { createHash } from "node:crypto";

export const MATCHING_VERSION = "v1";

export type Alignment = "matched" | "partial" | "missing" | "unknown" | "not_applicable";
export type Confidence = "high" | "medium" | "low";

export type JobRequirement = {
  requiredSkills: string[];
  preferredSkills: string[];
  experienceMin?: number;
  experienceMax?: number;
  location?: string;
  workMode?: string;
  noticePeriodMax?: number;
  education?: string;
  employmentType?: string;
  industry?: string;
  certifications?: string[];
};

export type CandidateProfile = {
  id: string;
  fullName: string;
  currentDesignation?: string | null;
  location?: string | null;
  workModePreference?: string | null;
  totalExperience?: number | null;
  relevantExperience?: number | null;
  noticePeriodDays?: number | null;
  highestEducation?: string | null;
  expectedSalary?: number | null;
  skills: Array<{ name: string; normalizedName?: string; yearsExperience?: number | null }>;
  certifications?: string[];
  projects?: Array<{ name: string; description?: string | null; technologies?: string | null; evidence?: string | null }>;
};

export type MatchDimension = { dimension: string; requirement: string; candidateEvidence?: string; result: Alignment; confidence: Confidence; source: string; explanation: string };
export type MatchResult = { candidateId: string; status: "strong_alignment" | "good_alignment" | "partial_alignment" | "limited_alignment" | "insufficient_evidence"; dimensions: MatchDimension[]; strengths: string[]; gaps: string[]; uncertainties: string[]; evidence: string[]; confidence: Confidence; matchingVersion: string; normalizedIndicator: number };

const aliases: Record<string, string> = { reactjs: "react", "react.js": "react", nodejs: "node.js", postgres: "postgresql", postgresql: "postgresql", ts: "typescript", js: "javascript" };
export function normalizeSkill(value: string) { const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, " "); return aliases[normalized.replace(/[^a-z0-9.]+/g, "")] ?? normalized; }
export function parseSkillList(value?: string | null) { return (value ?? "").split(/[,;|\n]/).map((item) => item.trim()).filter(Boolean).map(normalizeSkill).filter((item, index, all) => all.indexOf(item) === index); }
function contains(value: string | null | undefined, expected: string) { return Boolean(value && value.toLowerCase().includes(expected.toLowerCase())); }
function confidence(result: Alignment): Confidence { return result === "matched" ? "high" : result === "partial" ? "medium" : "low"; }

export function interpretRecruiterQuery(rawQuery: string) {
  const raw = rawQuery.trim();
  const skills = ["react", "typescript", "javascript", "python", "django", "node.js", "aws", "java", "postgresql", "sql", "next.js"].filter((skill) => contains(raw, skill));
  const locationMatch = raw.match(/\b(?:in|at|from)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)/);
  const experienceMatch = raw.match(/(?:\b(\d+(?:\.\d+)?)\s*\+?\s*years?|senior|lead|principal)/i);
  const noticeMatch = raw.match(/(?:within|in|available\s+within)\s+(\d+)\s*days?/i);
  const experienceMin = experienceMatch?.[1] ? Number(experienceMatch[1]) : /\b(senior|lead|principal)\b/i.test(raw) ? 5 : undefined;
  const noticePeriodMax = noticeMatch?.[1] ? Number(noticeMatch[1]) : undefined;
  const ambiguityFlags = skills.length === 0 && experienceMin === undefined && !locationMatch && noticePeriodMax === undefined ? ["No strict structured criteria detected; query remains broad."] : [];
  return { rawQuery: raw, skills: skills.map(normalizeSkill), locations: locationMatch ? [locationMatch[1]] : [], experienceMin, experienceMax: undefined, noticePeriodMax, salaryMax: undefined, education: undefined, employmentType: undefined, workMode: /remote/i.test(raw) ? "remote" : /hybrid/i.test(raw) ? "hybrid" : undefined, industries: /saas/i.test(raw) ? ["SaaS"] : [], companies: [], designations: /frontend/i.test(raw) ? ["frontend"] : [], semanticIntent: raw, ambiguityFlags };
}

function skillDimension(required: string, candidate: CandidateProfile, requiredness: "required" | "preferred"): MatchDimension {
  const wanted = normalizeSkill(required); const match = candidate.skills.find((skill) => normalizeSkill(skill.normalizedName ?? skill.name) === wanted);
  const label = requiredness === "required" ? "Required skill" : "Preferred skill";
  return { dimension: requiredness === "required" ? "required_skills" : "preferred_skills", requirement: required, candidateEvidence: match ? `${match.name}${match.yearsExperience ? ` — ${match.yearsExperience} years` : ""}` : undefined, result: match ? "matched" : "missing", confidence: match ? "high" : "low", source: match ? "ats_candidate_skills" : "candidate_profile", explanation: match ? `${label} is explicitly present in the candidate profile.` : `${label} is not evidenced; absence is not treated as a hiring decision.` };
}

export function matchCandidateToJob(candidate: CandidateProfile, requirement: JobRequirement, weights: Record<string, number> = {}) : MatchResult {
  const dimensions: MatchDimension[] = [...requirement.requiredSkills.map((skill) => skillDimension(skill, candidate, "required")), ...requirement.preferredSkills.map((skill) => skillDimension(skill, candidate, "preferred"))];
  if (requirement.experienceMin !== undefined) { const relevant = candidate.relevantExperience ?? candidate.totalExperience; const result = relevant === null || relevant === undefined ? "unknown" : relevant >= requirement.experienceMin ? "matched" : "partial"; dimensions.push({ dimension: "relevant_experience", requirement: `${requirement.experienceMin}+ years`, candidateEvidence: relevant === undefined || relevant === null ? undefined : `${relevant} years`, result, confidence: confidence(result), source: candidate.relevantExperience !== null && candidate.relevantExperience !== undefined ? "ats_candidates.relevant_experience" : "ats_candidates.total_experience", explanation: relevant === undefined || relevant === null ? "Relevant experience is not specified." : candidate.relevantExperience !== null && candidate.relevantExperience !== undefined ? `${relevant} years of relevant experience is recorded.` : `Only ${relevant} years total experience is recorded; relevant experience remains uncertain.` }); }
  if (requirement.location) { const result = candidate.location ? (contains(candidate.location, requirement.location) ? "matched" : "partial") : "unknown"; dimensions.push({ dimension: "location", requirement: requirement.location, candidateEvidence: candidate.location ?? undefined, result, confidence: confidence(result), source: "ats_candidates.location", explanation: result === "matched" ? "Candidate location matches the job location." : result === "unknown" ? "Candidate location is not specified." : "Candidate location differs; relocation willingness is not inferred." }); }
  if (requirement.noticePeriodMax !== undefined) { const result = candidate.noticePeriodDays === null || candidate.noticePeriodDays === undefined ? "unknown" : candidate.noticePeriodDays <= requirement.noticePeriodMax ? "matched" : "missing"; dimensions.push({ dimension: "notice_period", requirement: `≤ ${requirement.noticePeriodMax} days`, candidateEvidence: candidate.noticePeriodDays === null || candidate.noticePeriodDays === undefined ? undefined : `${candidate.noticePeriodDays} days`, result, confidence: confidence(result), source: "ats_candidates.notice_period_days", explanation: result === "unknown" ? "Notice period is not specified; immediate availability is not assumed." : result === "matched" ? "Recorded notice period meets the stated requirement." : "Recorded notice period exceeds the stated requirement." }); }
  if (requirement.education) { const result = candidate.highestEducation ? (contains(candidate.highestEducation, requirement.education) ? "matched" : "partial") : "unknown"; dimensions.push({ dimension: "education", requirement: requirement.education, candidateEvidence: candidate.highestEducation ?? undefined, result, confidence: confidence(result), source: "ats_candidates.highest_education", explanation: result === "unknown" ? "Education is not specified." : result === "matched" ? "Education explicitly matches the requirement." : "Education is present but not an exact match." }); }
  const required = dimensions.filter((d) => d.dimension === "required_skills" || d.dimension === "relevant_experience"); const matchedRequired = required.filter((d) => d.result === "matched").length; const known = dimensions.filter((d) => d.result !== "unknown" && d.result !== "not_applicable"); const weightFor = (dimension: MatchDimension) => weights[dimension.dimension === "required_skills" ? "requiredSkills" : dimension.dimension === "preferred_skills" ? "preferredSkills" : dimension.dimension === "relevant_experience" ? "relevantExperience" : dimension.dimension === "notice_period" ? "noticePeriod" : dimension.dimension] ?? 1; const totalWeight = known.reduce((sum, dimension) => sum + weightFor(dimension), 0); const normalizedIndicator = totalWeight ? Math.round((known.reduce((sum, dimension) => sum + (dimension.result === "matched" ? weightFor(dimension) : dimension.result === "partial" ? weightFor(dimension) * 0.5 : 0), 0) / totalWeight) * 100) : 0;
  const strengths = dimensions.filter((d) => d.result === "matched").map((d) => `${d.requirement} — ${d.explanation}`); const gaps = dimensions.filter((d) => d.result === "missing").map((d) => `${d.requirement} — ${d.explanation}`); const uncertainties = dimensions.filter((d) => d.result === "unknown" || d.result === "partial").map((d) => `${d.requirement} — ${d.explanation}`); const confidenceValue: Confidence = dimensions.some((d) => d.confidence === "low") ? "low" : dimensions.some((d) => d.confidence === "medium") ? "medium" : "high";
  const status = required.length === 0 ? (normalizedIndicator >= 70 ? "good_alignment" : "insufficient_evidence") : matchedRequired === required.length ? (normalizedIndicator >= 70 ? "strong_alignment" : "good_alignment") : matchedRequired > 0 ? "partial_alignment" : "limited_alignment";
  return { candidateId: candidate.id, status, dimensions, strengths, gaps, uncertainties, evidence: dimensions.flatMap((d) => d.candidateEvidence ? [`${d.requirement}: ${d.candidateEvidence}`] : []), confidence: confidenceValue, matchingVersion: MATCHING_VERSION, normalizedIndicator };
}

export function rankMatchResults(results: MatchResult[]) { return [...results].sort((a, b) => b.normalizedIndicator - a.normalizedIndicator || a.candidateId.localeCompare(b.candidateId)); }
export function contentHash(content: string) { return createHash("sha256").update(content).digest("hex"); }
export function embeddingIdempotencyKey(sourceType: string, sourceId: string, normalizedContent: string, version: string) { return `${sourceType}:${sourceId}:${version}:${contentHash(normalizedContent)}`; }
