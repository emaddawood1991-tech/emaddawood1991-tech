# FMC Patient Flow Management System — project rules for every development session

**NEVER REPLACE THE FMC APPLICATION WITH A STATIC HTML/PDF MOCKUP.**
Never rebuild it, never replace working screens with placeholders, never simulate backend results in the browser, never remove working features. Improve it incrementally, one verified change at a time.

## What the application is
`fmc-flow/` is the real application: Node 22 + Express 5 API (`server/`), React 19 + Vite interface (`src/`), SQLite database through `node:sqlite` (`fmc-flow/data/fmc.db`, gitignored). All permissions are enforced on the server (`server/perms.js`, `server/ops.js`, `server/app.js`).
`fmc-flow/demo/fmc-demo.html` and the `FMC-*.html` files in the repository root are **reference/demo builds only**: the same code running with an in-browser database. They give no production authentication or healthcare data protection and must never hold real patient data. `FMC-Audit-Report.html` is a document, not the application.

## Safe-change process (every change)
1. Inspect the relevant files. 2. Plan the smallest change. 3. Confirm a checkpoint exists (`docs/CHECKPOINT_AND_RESTORE.md`). 4. Implement in the existing components. 5. Run the tests below. 6. Verify the original workflows still work. 7. Report: changes, files, migrations, tests, remaining issues, rollback.
If a change breaks something that worked, stop and restore the last verified checkpoint.

## Commands (run in `fmc-flow/`)
- `npm install`, `npm run build`, `npm start` (http://localhost:3000), `npm run dev:api` + `npm run dev:web`
- Backend tests: `npm test` (73 tests)
- Browser suites (server on a FRESH synthetic database, e.g. `FMC_DB=/tmp/t.db PORT=3100 node server/index.js`): `NODE_PATH=$(npm root -g) node tests/e2e-smoke.cjs|e2e-registration.cjs|e2e-treatment.cjs|e2e-settings-reports.cjs http://localhost:3100`
- Demo build: `npm run build:demo` then `node tests/e2e-demo.cjs demo/fmc-demo.html`
- Security probes: `node --disable-warning=ExperimentalWarning tests/audit-probe.mjs`
Baseline (29 Oct 2026, with timers and documentation): 73 backend + 12 + 27 + 21 + 9 + 32 (`e2e-timers.cjs`) + 15 (`e2e-documentation.cjs`) browser + 4 demo checks, all passing. The last two browser suites need the server started with `FMC_TEST_CLOCK=1`. See `docs/phase-a/BASELINE_TESTS.md`.

## Hard rules
- Synthetic data only in development and tests. Never real patient data until the approved security plan and DoH/ADHICS assessment are complete.
- Never delete or overwrite patient records, audit records or existing settings. Deactivate instead of delete.
- No default administrator credentials in production code. No custom cryptography. No secrets in the repository.
- No database engine/architecture change, hosting change, authentication-provider change, or external integration without explicit written approval.
- Do not claim DoH/ADHICS compliance or certification. Classify requirements as Verified Mandatory / Recommended Security Practice / Requires Legal-Compliance Confirmation.
- Active FMC services: Physiotherapy, Orthopedics, General Medicine, Neurological Rehabilitation, Sports Injury Treatment, Rehabilitation (incl. postoperative). Occupational Therapy and Speech Therapy are discontinued.
- Branding: Al Faisal Medical Center · Ideal Care — الرعاية المثالية, original FMC logo, Premium Healthcare Glassmorphism, Arabic/English with correct RTL.
- Department access and clinical service authorization are separate. Administrator status never grants clinical authorization.

## Documentation index
`docs/FMC_PATIENT_FLOW_IMPLEMENTATION_CHECKLIST.md` · `docs/audit/` (security audit, probes) · `docs/phase-a/` (feature inventory, integration readiness, compliance classification, baseline tests) · `docs/CHECKPOINT_AND_RESTORE.md` · `fmc-flow/docs/BACKUP_AND_RECOVERY.md` · `fmc-flow/README.md`.
