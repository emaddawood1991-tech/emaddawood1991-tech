# Full system audit — 23 Nov 2026 (after stages S1–S12; go-live pass S13)

Scope: repository, dependencies, secrets, every API route and permission, privacy and audit controls, operations (backup, restore, fingerprint, readiness), the production start-up path, and the whole automated test set. Synthetic data only. This is an internal engineering audit, **not** a DoH/ADHICS assessment or certification; the official ADHICS text could not be read from this environment, so no control numbers are cited.

## 1. Results
| Area | Method | Result |
|---|---|---|
| Repository | `git status`, branch vs remote | Clean; `claude/ecstatic-ride-gvcoga` identical to remote at the S12 commit |
| Dependencies | `npm audit` | **0 vulnerabilities.** Two minor updates available (framer-motion, sql.js): low priority |
| Secrets | pattern search over every tracked file | None. The key pasted in chat earlier was never saved |
| API surface | route list read from the running router | **132 routes: 128 guarded, 4 public** (`POST /api/login`, `POST /api/login/mfa`, `POST /api/recovery-request`, `GET /api/time`). **28 permissions.** Every route is tested unauthenticated (401) and against every role |
| Object-level access | S5 tamper tests | Guessing visit, session, queue, documentation ids across departments is refused; linked patient records follow the same department rules |
| Authentication | S2/S3/S9/S10 tests | scrypt (cost 2^15 in production, automatic upgrade), 256-bit session tokens, Secure/HttpOnly/SameSite=Strict cookies, forced password change, mandatory two-step for privileged roles when created with `admin:create`, persistent lock-outs with alerts, idle limit in minutes |
| Audit trail | S4/S6 tests | 20 database triggers keep history append-only (49 tables); hash-chained audit log; periodic anchors; off-host fingerprint; restore drill verifies the chain inside a backup |
| Privacy | S4/S7/S11 tests | Patient-access log (incl. break-glass, duplicate review), department-scoped search, rate limits, export caps and watermark, alerts |
| Production path | **new:** `tests/golive.test.js` | Real production-mode process: no demo accounts or patients; HTTPS redirect and headers; forced password change; forced two-step; backup + off-site + fingerprint + drill; readiness report **all ok** after the administrator sets the session policy |
| Functional regression | all suites, fresh databases | **200 backend** tests; **15 browser suites** (smoke 12, registration 27, treatment 21, settings-reports 9, timers 32, documentation 17, schedule 37, account 23, MFA 18, privacy 10, roles 13, recovery 15, workflow 14, typing 11, duplicates 23) + demo 5/5 and sandboxed-iframe |
| Attack probes | `tests/audit-probe.mjs` | 31 probes, **4 findings**, all known and by design (see 2) |

## 2. Findings still open
| # | Severity | Finding | Status |
|---|---|---|---|
| P9a | Dev only | The demo/development build seeds 10 accounts with the published demo password | Production never seeds them (S9); readiness and start-up warn if any account still accepts it |
| P10e | Policy | Two-step verification is not required by default **in development** | `admin:create` turns it on for administrators and clinic managers; the readiness report checks it |
| P5 | Low | A person on the same network can keep a user out for a minute (5 wrong guesses) | Counters now persist and raise an alert (S10); accepted trade-off against brute force |
| P17b | Info | The probe lists staff create/update as "recorded" only after it performs them | Probe fixed in S9; remaining line is a note, not a defect |

No Critical, High or Medium engineering finding is open.

## 3. Not done by design, or waiting on a decision
- The live SQLite file is **not encrypted by the application**: use an encrypted volume (runbook section 2). TLS must be provided by a proxy.
- Hosting, key holders, retention, session limits, e-mail/SMS recovery and the ADHICS text are decisions or inputs only the owner can give: `fmc-flow/docs/GO_LIVE_RUNBOOK.md` section 1.
- Room status and assignment are not department-restricted (rooms are shared facilities); patient data is protected through the visit check.
- Duplicate patient records are **linked**, never merged; reports count people once, visit and session counts are unchanged.
- Rate-limit counters other than the sign-in lock-out are per process (single instance).
- Not a compliance certificate: classification of each control (Verified Mandatory / Recommended / Requires Legal-Compliance Confirmation) is still to be done against the real standard.

## 4. Sign-off checklist
See `fmc-flow/docs/GO_LIVE_RUNBOOK.md` section 8. Real patient data stays out until every box is ticked and the owner has signed off in writing.
