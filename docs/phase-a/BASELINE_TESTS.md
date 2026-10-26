# Baseline regression suite (before any Phase B+ change)
Run 26 Oct 2026 on checkpoint `a7eddcf` source. All suites use synthetic data on fresh databases.

| # | Required baseline area | Covered by | Result |
|---|---|---|---|
| 1 | Login | `flow.test.js` auth, `e2e-smoke` UI sign-in (4 roles) | Pass |
| 2 | Dashboard navigation | `e2e-smoke`, audit crawl (10 pages × 3 roles × 2 viewports) | Pass |
| 3 | Patient registration | `registration.test.js` (17), `e2e-registration` (27) | Pass |
| 4 | Patient search | MRN / English / Arabic / phone — `registration.test.js`, `e2e-registration` | Pass |
| 5 | Visit creation | `registration.test.js`, `flow.test.js` | Pass |
| 6 | Reception check-in | `flow.test.js`, `e2e-smoke`, `e2e-registration` | Pass |
| 7 | Queue assignment | call-next concurrency, manual priority — `flow.test.js` | Pass |
| 8 | Room assignment | halls, stations, concurrency, cleaning, maintenance — `flow.test.js` | Pass |
| 9 | Treatment start | `treatment.test.js` (8), `e2e-treatment` (21) | Pass |
| 10 | Treatment completion | `treatment.test.js`, `flow.test.js` | Pass |
| 11 | Room check-out | `flow.test.js`, `treatment.test.js` | Pass |
| 12 | Visit completion | `treatment.test.js` full workflow | Pass |
| 13 | Department settings | `e2e-settings-reports` (new baseline test) | Pass |
| 14 | Room settings | `e2e-settings-reports`, `flow.test.js` maintenance | Pass |
| 15 | Reports | `e2e-settings-reports`, `flow.test.js` aggregates | Pass |
| 16 | User permissions | `flow.test.js`, `treatment.test.js`, `audit-probe` P13 (13 escalation attempts) | Pass |

Totals: backend 48/48 · browser smoke 12 · registration 27 · treatment 21 · settings/reports 9 · single-file demo 4 · sandboxed-frame check 1. `npm audit`: 0 vulnerabilities.

## Existing failures (recorded separately — these are known design gaps, not regressions)
See `docs/audit/` findings F-01 … F-26 (default demo password, unscoped patient directory, no MFA, no self-service password change, etc.). They fail the 31 probes in `tests/audit-probe.mjs` by design; those probes are expected to flip to "ok" as fixes are approved and implemented.
