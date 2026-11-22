# SymphoWork SvelteKit local review runbook

Updated: 2026-11-01. This runbook replaces the earlier two-server instructions. The application frontend and API run in the SvelteKit process on port 5173.

## Start

1. Ensure the selected target-only `DATABASE_URL` identifies an authorized development/test database. Do not use a remote or production database unless its owner has explicitly authorized it for this specific review. No database migrations, seeds, resets, or business mutations are part of startup.
2. Start the Svelte app from `C:\Users\nares\Symphowork_Svelte_V1`:

   ```powershell
   npm run dev
   ```

3. Open `http://localhost:5173/login`. There is no Next.js process, port 3000 relay, `.review-backend`, reference-directory configuration, or `LEGACY_BACKEND_ORIGIN` requirement in the current runtime.
4. Stop only the dev server started for this review with Ctrl+C. Do not kill an existing process you did not start.

Without `DATABASE_URL`, public/login pages can render, but login and database-backed API requests must fail closed with a sanitized 503. `node scripts/check-integration.mjs` reports local configuration presence/format only; it does not send requests or verify a database.

## Safe verification

- Run `npm run check` and `npm test` for current source checks.
- Run the workflow browser suite with synthetic fixtures and a unique output directory, for example:

  ```powershell
  npm run test:e2e -- --config playwright.workflows.config.ts --reporter=line --output=test-results/workflows-<unique-run-id>
  ```

- `npm run build` writes the adapter-node output to `build`. Do not run it while an existing server is using that output. If existing QA output must be preserved, build an isolated copy with secrets, `.env.local`, credentials, `.git`, and existing test/build artifacts excluded.
- Real login uses the approved existing QA account and creates session/audit writes. Business workflow tests require explicitly approved disposable test records; never use real customer data for mutation tests.
- Keep browser storage state, cookies, passwords, connection strings, and user data out of logs and screenshots.

## Delivery evidence and remaining gates

The latest report records current-tree checks, synthetic test totals, the isolated build/browser result, and unresolved work. Static route coverage does not prove workflow parity. Live authentication should only be reported after a current source revision was tested against the authorized database. Two-tenant/RLS isolation, private-file authorization, session expiration by time, successful business mutations, provider delivery, visual comparison, and controlled performance comparison remain separate acceptance gates.

Do not use older runbook sections or benchmark scripts that start Next.js on port 3000 or read local credential artifacts as current instructions.