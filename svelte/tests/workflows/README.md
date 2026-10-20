# SvelteKit workflow browser tests

Run from the `svelte/` directory:

```powershell
pnpm exec playwright test --config playwright.workflows.config.ts
```

The separate loopback Vite server mounts actual application components. Its `$app/state` and navigation stubs exist only under this test directory and resolve only in `tests/workflows/vite.config.ts`. There is no production login bypass, relay, database adapter, or provider in that server. Each test intercepts `/api/**` with synthetic responses.

The suite checks browser interactions, request methods/payloads, selected permission-dependent controls, validation, and failure recovery. It does not verify sessions, API-side authorization, tenant isolation, scanning, storage, provider delivery, live contracts, or visual parity. Voice tests use synthetic media devices.
