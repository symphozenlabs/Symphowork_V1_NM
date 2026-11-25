# Live tenant QA fixture setup

Use an explicitly approved isolated QA database with the reviewed signed-context functions and policies deployed. Use a direct restricted login as `sympowork_app` with neither superuser nor BYPASSRLS privileges. Have the QA operator prepare two independent organizations, an active user and membership in each, and one distinguishable employee and department per organization. Supply active sessions for both users along with expired and revoked sessions, an inactive-user session, and an inactive-membership session. Use records dedicated to this suite. Keep credentials and tokens in operator-managed local environment variables.

| Variables | Required values |
|---|---|
| `RUN_RLS_QA_TESTS`, `RLS_QA_DATABASE_URL` | Set the flag to `1` and point the restricted connection at the approved QA database. |
| `RLS_QA_ORGANIZATION_A_ID`, `RLS_QA_ORGANIZATION_B_ID` | Two distinct organization IDs. |
| `RLS_QA_EMPLOYEE_A_ID`, `RLS_QA_EMPLOYEE_B_ID` | One employee ID in each corresponding organization. |
| `RLS_QA_DEPARTMENT_A_ID`, `RLS_QA_DEPARTMENT_B_ID` | One department ID in each corresponding organization. |
| `RLS_QA_SESSION_TOKEN_A`, `RLS_QA_SESSION_TOKEN_B` | Active sessions with access to their respective fixtures. |
| `RLS_QA_EXPIRED_SESSION_TOKEN`, `RLS_QA_REVOKED_SESSION_TOKEN` | Invalid session fixtures for expiry and revocation checks. |
| `RLS_QA_INACTIVE_USER_SESSION_TOKEN`, `RLS_QA_INACTIVE_MEMBERSHIP_SESSION_TOKEN` | Session fixtures for inactive user and membership checks. |

After an operator confirms the database identity and approves the fixture run, execute the focused integration suite.

```powershell
npm test -- --maxWorkers=3 src/lib/server/rls-qa.integration.test.ts
```
