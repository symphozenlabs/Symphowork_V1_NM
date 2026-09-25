# Resume Intelligence Foundation

Prompt 8 adds a provider-agnostic, versioned resume processing foundation on top of ATS Core. Resume versions are stored in `ats_candidate_documents` with content hashes, sanitized storage keys, primary/version metadata, scan status, and parsing status. Processing jobs and attempts persist stage, provider, version, retries, errors, duration, and idempotency metadata.

## Pipeline

The persisted flow is queued → text extracting → parsing → normalizing → skill extracting → experience analyzing → enriching → completed. Failures are persisted as processing failures and are retryable up to the configured limit. Existing successful stages are retained in attempt history.

The deterministic provider extracts only explicit evidence it can identify safely: email, phone, professional links, and configured skill aliases. It normalizes ReactJS/React.js, NodeJS/Node JS, Postgres/Postgre SQL, and similar aliases without requiring an external AI provider. Binary PDF/DOC/DOCX extraction requires a configured text extractor; the system fails clearly rather than fabricating structured data.

## Provider and AI boundary

Typed contracts exist for `ResumeTextExtractor`, `ResumeParserProvider`, `SkillExtractionProvider`, `ExperienceAnalysisProvider`, and `ResumeIntelligenceProvider`. Existing `AIProvider.parseStructured` can be adapted behind these contracts. AI processing is disabled by default in organization configuration. No vendor-specific implementation, embeddings, semantic search, ranking, or scoring is included.

## Security and review

Resume downloads use the existing storage provider and short-lived signed URLs after server-side tenant/RBAC checks. Raw resume text is not written to audit logs. Extraction fields store confidence, source, evidence, and review status. Recruiter confirmation changes provenance to recruiter and protects future automated enrichment. Malware scanning is not configured; uploads are recorded as `not_scanned`.

## Routes

- `POST /api/app/ats/candidates/:candidateId/resumes`
- `GET /api/app/ats/candidates/:candidateId/resumes`
- `POST /api/app/ats/resumes/jobs/:jobId/process`
- `GET /api/app/ats/resumes/:documentId/download`
- `POST /api/app/ats/resume-fields/:fieldId/review`
- `GET/POST /api/app/ats/resume-config`
- Public multipart resume upload through `POST /api/public/jobs/:slug/apply`

## Verification status

Unit-tested: hashing, duplicate-safe normalization, filename/MIME validation, deterministic skill extraction, explicit contact/link extraction, and consent-safe processing contracts. Typecheck, lint, existing tests, and build are required before commit. PostgreSQL/RLS integration, configured storage-provider execution, malware scanning, real PDF/DOC/DOCX extraction, external AI providers, and Playwright are environment-dependent or deferred.
