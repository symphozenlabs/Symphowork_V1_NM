# Release test matrix

| Area | Unit | Integration/RLS | E2E | Status |
| --- | --- | --- | --- | --- |
| Auth/RBAC | Existing tests | Pending database fixtures | Not run | YELLOW |
| HR/attendance/leave/expenses | Existing tests | Pending | Not run | YELLOW |
| Payroll | Calculator tests | Pending immutable snapshot tests | Not run | YELLOW |
| ATS/resume/matching | Existing tests | Pending provider/database tests | Not run | YELLOW |
| Projects/tasks/chat | Collaboration policy tests | Pending | Not run | YELLOW |
| Chat-to-Task | Source boundary covered indirectly | Pending | Not run | YELLOW |
| Billing/entitlements | Billing policy tests | Pending subscription fixtures | Not run | YELLOW |
| Reporting/exports | Build/type coverage | Pending authorization/export fixtures | Not run | YELLOW |
| RLS/cross-tenant | Not meaningful without DB | Not run: DATABASE_URL unavailable | Not run | RED |

No integration, RLS, or E2E result is claimed by this document.
