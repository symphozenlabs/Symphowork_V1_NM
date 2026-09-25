# Reporting

## Implemented

Reusable, organization-scoped reporting services provide employee, attendance, leave, expense, payroll, recruitment, project, and task summary foundations. Reports use server-side aggregation and permission checks. CSV export is generated server-side and requires `report.export`.

The implementation does not expose private chat content or communication-based performance scores. Payroll and historical ATS report expansion should continue using their existing snapshots/activity tables.

## Status

- Unit tested: shared repository suite and billing/collaboration policy tests.
- Integration tested: pending; no `DATABASE_URL` is configured.
- E2E tested: not run.
- Deferred: chart-rich dashboards, cache provider, advanced historical conversion metrics, and custom report designer.
