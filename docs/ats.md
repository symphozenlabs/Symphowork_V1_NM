# ATS Core

Prompt 7 adds a tenant-scoped operational ATS without AI dependencies. Candidates remain separate from employees and are connected to jobs through applications.

## Operational flow

Requisitions are created as drafts, submitted to the existing generic workflow, and become publishable after approval. Jobs use unique public slugs and only published jobs are visible through `/jobs/:slug` or the public job API. Public applications do not require accounts; duplicate candidates are detected deterministically by normalized email or phone, and duplicate applications for the same job are rejected.

The ATS includes structured candidate fields, experience, education, skills, resume metadata, pipelines/stages, applications, immutable stage history, notes, tags, activities, interviews/interviewers, feedback, assessments, talent pools, communications, saved-search storage, and retention metadata.

## AI boundary

Resume parsing, skill extraction, experience analysis, semantic search, candidate scoring, and ranking are intentionally not implemented. Resume metadata includes parsing status/provider metadata so Prompt 8 can add replaceable providers without changing the ATS domain.

## Security

All ATS tables include `organization_id` and receive tenant RLS policies in migration `0007_awesome_famine.sql`. Server services enforce ATS permissions and organization ownership. Public job responses omit internal requisition and organization identifiers. Private documents, recruiter notes, salary data, and assignments are not exposed by public routes.

## Verification status

Implemented and type-checked: core schema, service boundaries, public job/application routes, requisition workflow integration, candidate search, pipeline movement, interview scheduling/feedback, and talent-pool membership. Unit tests cover normalization, slugging, experience calculation, consent validation, state rules, and the existing suite. Database migration application, PostgreSQL RLS integration, file upload/storage integration, CSV import/export, PDF resume handling, and Playwright flows require environment verification or remain deferred.
