# Synthetic workflow browser suite

Run from the target workspace:

```powershell
npm exec -- playwright test --config playwright.workflows.config.ts
```

The separate loopback Vite server mounts the actual application components. Its `$app/state` and navigation stubs exist only under this test directory and are resolved only by `tests/workflows/vite.config.ts`. There is no test login route, production authorization bypass, backend relay, database adapter or provider in this server. Each test intercepts `/api/**` with synthetic responses.

This suite verifies browser interactions, request methods/payloads, selected permission-dependent controls, validation and failure recovery. It does not verify sessions, API-side authorization, tenant isolation, scanning, storage, provider delivery, live contracts or visual parity. The fake voice test substitutes both getUserMedia and MediaRecorder and never opens a real microphone.
