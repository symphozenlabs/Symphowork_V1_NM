# Expenses

Expense claims are organization-scoped and itemized. The server calculates totals from items and validates category policies, receipt requirements, and amount limits before submission. Claim numbers use an organization/year counter row updated atomically inside the create transaction, producing values such as `EXP-2026-0001` without `COUNT(*)` or `MAX()` races.

Submission creates the generic Prompt 4 workflow instance with `expense_claim` as the entity. Approval changes the claim to `approved`; rejection changes it to `rejected`. Approval never implies reimbursement: reimbursement remains a separate tracked status and has no payment integration in this milestone.
