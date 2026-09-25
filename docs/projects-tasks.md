# Projects and tasks

## Implemented

Prompt 10 adds organization-scoped projects and tasks with atomic `PRJ-000001` and `TSK-000001` numbering, project members, project visibility, task assignment, priorities, statuses, parent-task fields, comments, watchers/dependencies schema, activity history, source fields for Prompt 11, server-side filtering, pagination, date validation, and dependency-cycle protection.

The task model supports manual, future chat, automation, and integration sources plus optional conversation/message references. Task descriptions and comments are stripped of HTML/script content before persistence.

## Access and security

Existing employees, organizations, authorization, audit, and storage abstractions are reused. Project and task APIs validate tenant ownership and employee membership server-side. Private project visibility is membership-based. RLS policies are included in migration 0010.

## Verification status

- Implemented: project/task schema, atomic counters, task APIs, comments, dependencies, search filters, pagination, activity records, basic Work UI, and Prompt 11 source boundary.
- Unit tested: numbering, date validation, sanitization, dependency cycles, progress, and mention parsing.
- Integration tested: pending; no `DATABASE_URL` is configured.
- E2E tested: not run.
- Deferred: full Kanban drag/drop, labels/watchers/reminders UI, attachment endpoints, rich editor, project detail/activity UI, advanced analytics, and notification fan-out.
