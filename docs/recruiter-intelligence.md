# Recruiter intelligence

Prompt 9 adds a tenant-scoped recruiter intelligence foundation without replacing ATS or Resume Intelligence.

## Implemented

- Deterministic natural-language interpretation for skills, location, experience, work mode, and notice period.
- Structured job requirement snapshots that preserve recruiter-authored requisition fields and version changes.
- Explainable matching across required/preferred skills, relevant versus total experience, location, notice period, and education.
- Descriptive alignment states (`strong_alignment`, `good_alignment`, `partial_alignment`, `limited_alignment`, `insufficient_evidence`) with strengths, gaps, uncertainties, evidence, and confidence.
- Deterministic ranking with stable candidate-ID tie-breaking and persisted requirement/configuration/candidate snapshots.
- Tenant-scoped search, job matching, configuration APIs, audit records, and recruiter search UI.
- Embedding and processing-job tables with content hashes, provider/model/version metadata, stale/failed states, and idempotency keys.
- RLS policies for all new intelligence tables.

## Semantic/vector boundary

`ats_embeddings` and `ats_embedding_jobs` provide the persistence boundary for a future embedding/vector provider. Semantic search is disabled by default. Enabling it requires an explicit provider and external-processing consent, but this repository does not configure a real provider or vector index yet. Current search and matching therefore report `semanticUsed: false` and use structured deterministic behavior.

The schema stores embedding payload as provider-neutral text rather than assuming `pgvector`, so deployment can choose PostgreSQL-native vector support or another provider without changing matching-domain code.

## Matching and privacy

Required and preferred requirements remain distinct. Missing data is `unknown`, not a failed requirement. Relocation is never inferred. Private recruiter notes, compensation, protected characteristics, and audit metadata are not included in normalized search content. Salary matching and AI enrichment remain behind future, explicit RBAC/configuration work.

## Verification status

- Implemented: deterministic interpretation, matching, ranking, versioning, persistence model, APIs, UI, tenant authorization and RLS migration.
- Unit tested: matching aliases, required/preferred behavior, missing information, experience relevance, query ambiguity, deterministic ranking, and embedding idempotency.
- Integration tested: not run; `DATABASE_URL` is unavailable in this workspace.
- E2E tested: not run.
- Requires database: migration application, RLS integration tests, concurrent matching and reindex execution.
- Requires vector/embedding provider: real semantic similarity retrieval, candidate/job/query embeddings, and provider failure/timeout coverage.
- Requires external AI: AI-assisted query interpretation, requirement extraction, relevance, and explanation generation.
- Deferred: similar candidates/jobs, pipeline skill-gap analytics, recruiter feedback UI, reindex worker, compare UI, and provider adapters.

The system is recruiter decision support and does not make hiring decisions, reject candidates, shortlist candidates, or move pipeline stages automatically.
