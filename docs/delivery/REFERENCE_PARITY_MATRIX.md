# Reference parity matrix

The tree comparison found matching paths for all 52 page components, three layout components, 34 server page loaders and 132 endpoint files. The 52 page components, three layouts and 132 endpoint files match byte for byte. Twelve server page loaders match byte for byte. Endpoint wrappers delegate to server handlers, so matching files do not establish equivalent query or permission behavior. The 173 shared component files also match byte for byte. Eight of the 147 server API files match byte for byte. The Drizzle schema and both role-permission tables match. The reference retains compatibility aliases while NM uses native SvelteKit request APIs.

| Module | Reference behavior and NM implementation | Gap or files to inspect | Verification evidence | Status |
|---|---|---|---|---|
| Public pages, navigation and login form | Matching Svelte pages and layouts | Dev SSR and live hydration | Dev root and login returned 200 and browser form submission worked | PASS for tested routes |
| Authentication and session | Native NM hooks, cookies and identity services serve the same login UI | Fresh dev login, refresh and logout | Fresh HR-admin browser login, protected refresh and logout each returned 200 | PASS for tested flows |
| Dashboard | Matching page, differing server-side integration | Verify dashboard metrics against tenant records | Fresh authenticated page returned 200. Metrics were not reconciled. | BLOCKED |
| Employees and profile | Matching page components and endpoint wrappers with NM tenant transactions | Full edit and profile parity remains open | Prior QA matched 18 database, API and browser rows. Existing detail returned 200 and missing ID returned 404. | PASS for verified reads |
| Departments | Matching UI with NM transaction-scoped metrics | CRUD and role-filter parity remain open | Prior QA matched four database, API and browser rows | PASS for verified reads |
| Master data | Matching forms and lists with NM-scoped employment type, team and shift reads | Browser count and authorized update behavior remain open | Prior QA DB/API counts were five employment types, two teams and two shifts | BLOCKED |
| Attendance | Matching UI with NM scoped existing-profile lookup | Fresh count, employee selection and status display | Fresh QA found one database record and one API record. The browser screen opened. Rendered count remains unverified. | BLOCKED |
| Leave and approvals | Matching UI with NM scoped leave reads | Verify balances, application rows and approval actions | Fresh DB/API counts match for the tested self-service list. The browser screen opened, but rendered count remains unverified. | BLOCKED |
| Expenses | Matching UI with NM scoped self-service claims read | Verify list, details and submission | Fresh DB/API counts match for the tested self-service list. The browser screen opened, but rendered count remains unverified. | BLOCKED |
| Payroll and payslips | Matching UI with NM scoped finalized payslip reads | Verify list, details and download | Fresh DB/API counts match for the tested self-service list. The browser screen opened, but rendered count remains unverified. | BLOCKED |
| Recruitment | Matching Svelte pages | Verify with a recruiting-authorized fixture | Fresh HR_ADMIN request returned expected 403. The required key is absent from assigned and built-in permissions. | BLOCKED |
| Projects and tasks | Matching workspace UI | Verify with an authorized project/task fixture | Fresh HR_ADMIN requests returned expected 403. The required keys are absent from assigned and built-in permissions. | BLOCKED |
| Chat and notifications | Matching Svelte pages and endpoint wrappers | Compare record counts, delivery and read state | Prior QA APIs returned empty arrays without independent DB counts | BLOCKED |
| Settings and platform | Matching Svelte layouts and pages | Verify settings actions and separately authorized platform workflows | Fresh HR_ADMIN settings page and refresh returned 200 | BLOCKED |
| Tenant security | NM retains verified transaction functions and scoped application queries | Deploy reviewed policies and supply independent QA fixtures | Previous disposable isolation suite passed. Live QA awaits fixtures. | BLOCKED |

The detailed route and feature inventories are in the repository's native route migration and feature parity CSVs. Authorization evidence is in the HR-admin authorization matrix.
