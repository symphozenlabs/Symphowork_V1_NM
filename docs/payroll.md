# Payroll

Prompt 6 adds an organization-scoped India payroll foundation for payroll profiles, salary components and structures, effective-dated assignments, periods and runs, calculation snapshots, line items, adjustments, statutory configuration, tax configuration, and finalized payslips.

## Processing lifecycle

1. Create an open period.
2. Configure salary structures, effective assignments, payroll profile flags, and effective-dated statutory/tax configuration.
3. Calculate a run from attendance, working days, holidays, approved leave, and approved adjustments.
4. Submit the run to the generic approval workflow.
5. Approve through the approvals API.
6. Finalize the run to freeze snapshots and create idempotent payslips.

The deterministic engine is versioned (`v1`) and supports fixed, percentage, and formula-placeholder components, proration, LOP, leave, PF, ESI, professional tax, TDS, adjustments, taxable income, and employer contributions. Formula components warn until an approved evaluator is configured.

Statutory and tax values are effective-dated tenant configuration and require verification for the organization’s state, financial year, and current law. This milestone does not claim legal compliance. PAN and bank metadata fields are reserved for encrypted-at-rest provider integration.

Routes: `GET/POST /api/app/payroll/periods`, `GET/POST /api/app/payroll/runs`, `POST /api/app/payroll/runs/:runId/finalize`, `GET /api/app/payroll/payslips`, and `POST /api/app/payroll/salary-assignments`. Admin UI is `/app/payroll`; self-service is `/app/payroll/payslips`.
