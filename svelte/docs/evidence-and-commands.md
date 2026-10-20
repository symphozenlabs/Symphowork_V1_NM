# Evidence, commands and limitations

This task ran static/read-only inspection commands from the two stated workspace roots, then a Python documentation generator writing only new docs files. No application modules were imported or executed. The generator is retained as docs/generate-inventory.py. An attempt to pass the long generator inline hit Windows command-length error 206 before execution. Its first file-based run was interrupted before report output because API-consumer matching repeated work; memoization was added to documentation tooling and the second run completed with exit 0. No application behavior was involved.

Original workspace:
- Get-Location
- git status --short --branch
- git log -1 --format='%h %s'
- rg --files with source/component/module/test paths and exclusions for environment/credential/cookie files
- rg --files -g AGENTS.md and ancestor AGENTS.md existence checks
- Get-Content package.json, source layouts/pages/components/CSS, middleware, identity/tenant/platform authorization, db/client.ts, selected API routes and provider interfaces; only source configuration names were examined, not local environment values
- Get-ChildItem public -Recurse -File (names only); Get-ChildItem drizzle -Recurse -File (names only)
- Get-Content drizzle/meta/_journal.json
- rg -n for authorization/cache/transaction symbols, GET write/helper calls, API references, client effects/polling, providers and role keys
- python --version -> Python 3.13.1
- Inline Python static scans of all allowed source files: route/API/TSX/test/module counts; page imports/guards; GET method slices and helper calls; auth/shell/pilot evidence with source line references
- Final git status/log read-only checks; original source/config/lock hashes compared before/after docs generation

Svelte workspace:
- Get-ChildItem -Force (names only)
- rg --files src docs; docs did not exist initially (that rg command reported missing path; no file overwrite)
- Get-Content package.json, README.md, src/routes/+page.svelte, +layout.svelte, +error.svelte, src/lib/NavigationStatus.svelte, src/app.css, src/app.html, vite.config.ts, vitest.config.ts, svelte.config.js, .gitignore
- Get-FileHash pnpm-lock.yaml -Algorithm SHA256 -> 27F9453B3ECED2C8C8938118D46E4DBF6D40E3DF85068BE36F15CF1EB6F1572F
- pnpm list --depth 0 -> exit 0, 12 declared/installed direct dev dependencies matched the report
- Ancestor AGENTS.md checks returned no applicable files
- Inline Python generator: pathlib.read_text/read_bytes for approved code/manifests/lock/journal; regular expressions for imports, exported HTTP methods, API literals and interaction cues; recursive local UI-import closure; csv/json output; documentation files opened in exclusive-create mode; before/after SHA256 rollups compared
- Final Python validation: CSV row counts, all 52 unique source routes and 131 unique API routes present, API/method inventories and report references checked; no original or Svelte source/config/lock mismatch
- No current-task pnpm check/test/build/audit/dev/start; prior successful foundation-check output is explicitly labelled prior-session evidence in the report.

Documentation commands actually executed:
    python docs/generate-inventory.py
    # First file-based run interrupted; optimized second run exited 0.
    # Focused inline Python CSV validation exited 0 and printed VALIDATION_PASS.

The completed generator created 14 report/data files plus its own retained script (15 docs files total). Final validation confirmed 52 distinct routes, 131 distinct API files, 88 GET entries, nonempty exported method inventories, dynamic employee/public-job consumer mappings and inherited shell API references. All selected application file fingerprints and the original git status matched before/after generation. Application verification commands were not rerun.

Some broad Get-Content/rg outputs were truncated by tool output limits; focused Python/regex summaries and full static inventory extraction were used to cover counts and files. An initial GET-summary scanner failed with TypeError (list-minus-set) after printing page inventory; later scanner/generator corrected it. This was an inspection-tool error and did not execute application code or modify either app.

Reproducible inspection commands (PowerShell):
    Set-Location 'C:/Users/nares/Symphowork_V1_NM'
    git status --short --branch
    git log -1 --format='%h %s'
    rg --files src/app -g page.tsx
    rg --files src/app/api -g route.ts
    rg -n 'getOrEnsureEmployeeForUser|checkAndEnsureAttendanceReminder' src -g '*.ts' -g '*.tsx' -g '!*.test.ts'
    Set-Location 'C:/Users/nares/Symphowork_Svelte_V1'
    pnpm list --depth 0
    Get-FileHash pnpm-lock.yaml -Algorithm SHA256

Do not run original tests/build/browser config as a supposedly read-only check: tsc/build/test tools may create output, load environment/configuration, start services or contact configured infrastructure. Current task does not authorize database/provider calls or UI mutation requests.

Parsing limitations: regex inventories are source evidence, not TypeScript AST/dataflow proof. Permission columns list direct calls/literals and platform keys, not full transitive authorization. Graph edges include conditional/hidden UI trees and layouts, so one page may have many potential API references without actually fetching them. Dynamic resource URLs can match several endpoint candidates. Generic backend functions or API-only endpoints may have no UI caller. Exported method slicing is lexical, not a formal proof that no helper can write; all unreviewed GETs stay blocked for automation. Counts exclude tests/e2e as application routes. Proposed components preserve source filenames but do not decide final Svelte composition.
