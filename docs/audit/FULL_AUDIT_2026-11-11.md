# Full system audit — 11 Nov 2026 (after security stages S1–S8)

Scope: repository state, dependencies, secrets, code patterns, server-side authorization on every route, privacy and audit controls, backup/recovery, operations readiness, and the complete automated test set. Synthetic data only. This is an internal engineering audit, **not** a DoH/ADHICS assessment or certification; the official ADHICS text could not be read from this environment, so no control numbers are cited.

## 1. What was checked and the result
| Area | Method | Result |
|---|---|---|
| Repository | `git status`, branch vs remote | Clean tree, `claude/ecstatic-ride-gvcoga` identical to remote (HEAD `954e74a`) |
| Dependencies | `npm audit` (production and all) | **0 vulnerabilities.** 4 minor updates available (vite 8.3.5→8.3.8, @vitejs/plugin-react, framer-motion, sql.js): low priority |
| Secrets | pattern search over every tracked file; tracked key/database files | None found. `data/` and `dist*/` are git-ignored. The BoostThis project key pasted in chat was **not** saved anywhere |
| SQL injection | review of every dynamic SQL string | Table and column names only come from fixed allow-lists (`CONFIG`, correction tables); every value is a bound parameter; numeric id lists are built from database ids |
| Script injection | search for `eval`, `innerHTML`, `dangerouslySetInnerHTML`, shell calls | One use: the authenticator QR code (SVG generated on the server by the `qrcode` library): low risk, see L3. No shell execution from user input |
| Authorization | S5 test over **every** API route and role | All routes guarded or on the 4-item public list; every permission named by a guard exists; each role is refused what it does not hold (hundreds of checks); object-level tests (guessing visit/session/queue ids) refused across departments |
| Sessions and passwords | code review | scrypt with per-user salt, constant-time compare, dummy hash for unknown users, 256-bit random session tokens issued fresh at login and on password change, `HttpOnly; SameSite=Strict; Secure` cookies, CSRF header on every state change, absolute + idle lifetime, concurrent-session cap |
| Headers | code review | CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, COOP/CORP, HSTS, `no-store` on API |
| Audit trail | S4/S6 tests, probe P17 | Append-only tables enforced by database triggers; hash-chained audit log; periodic anchors; off-host fingerprint detects a fully recomputed chain; restore drill verifies the chain inside a backup |
| Privacy | S4 tests | Patient-access log, department-scoped search (3-character minimum, no wildcard dumps), rate limits, export caps and watermark, alerts |
| Backups | S6 tests | AES-256-GCM, tamper detection, restore drill, off-site copy, scheduled run |
| Functional regression | all suites, fresh databases | **172 backend** tests pass; browser: 12 + 27 + 21 + 9 + 32 + 17 + 37 + 23 + 18 + 10 + 13 + 15 + 14 = all pass; demo 5/5 and sandboxed iframe pass |
| Attack probes | `tests/audit-probe.mjs` | 31 probes, **4 findings** (was 9 before S8; all four are listed below) |

## 2. Findings (status after stage S9)
H1, M1 (mechanism), M2 (check), L1, L3, L4 and L5 are fixed in S9 — see `SECURITY_AUDIT_2026-11.md`. M3 and L2 were fixed in S10 (persistent lock-outs with an alert; stronger hash cost with automatic upgrade). The table below is the original list.

| # | Severity | Finding | Recommendation |
|---|---|---|---|
| H1 | **High before go-live** (none in development) | **Default credentials.** On any empty database the server seeds 10 demo accounts, including an administrator, all with the published demo password, unless `FMC_SEED=0` is set. There is also no command to create the first real administrator, so production would depend on that variable. (Probe P9a) | Do not seed when `NODE_ENV=production`; add `npm run admin:create` (password from a prompt, policy-checked, must change at first sign-in); add a readiness check that fails while any account still accepts the demo password. Needs your approval (changes startup behaviour) |
| M1 | Medium | **Two-step verification is not required by default**, not even for administrators. It is available and tested. (P10e) | Require it for administrator and clinic manager at go-live (Settings → Security Settings), and seed production that way. Recovery paths already exist (recovery codes, administrator reset) |
| M2 | Medium (policy) | **Session lifetime defaults are long:** idle 12 h, absolute 14 h. Clinical workstations normally lock much sooner. | Set idle to a short value for desk and clinic computers; keep long sessions only for wall displays. The right value is *Requires Legal-Compliance Confirmation* |
| M3 | Low-Medium | **Lock-out abuse.** Five wrong guesses lock one username from one address for a minute, so someone on the same network can keep the real person out. State is in memory (lost at restart). (P5) | Acceptable for one instance; add a per-account alert for repeated lockouts (the alert for repeated failures already exists) and consider persisting the counter |
| L1 | Low | Content-Security-Policy lacks `frame-ancestors`, `base-uri`, `form-action` (framing is already blocked by `X-Frame-Options`) | Add the three directives; no behaviour change expected |
| L2 | Low | scrypt uses Node's default cost | Raise the cost parameter once the production server size is known |
| L3 | Low | The authenticator QR is injected as SVG text | Render it as an `<img>` data URL so no HTML injection path exists even if the library changed |
| L4 | Low | 4 dependencies have minor updates | Update and re-run the suites |
| L5 | Info | Probe P17b reports staff create/update as "missing" from the audit log. That is a stale probe: both are audited (`config.staff.create/update/authorization`, tested in S5). | Fix the probe's action list |

## 3. Known limitations (unchanged, by design or by decision)
- The live SQLite file is **not encrypted by the application**; needs an encrypted volume (see `fmc-flow/docs/DEPLOYMENT_AND_ENCRYPTION.md`). TLS must be provided in front of the app. Hosting is still undecided.
- Rooms are shared facilities: room status and assignment are not limited by department (patient data is protected through the visit check).
- Merging duplicate patient records is not implemented (needs separate design and approval). Patient corrections keep full history.
- Self-service recovery by e-mail/SMS is not implemented (external integration; needs written approval and a provider). Administrator-assisted recovery works.
- Login throttling and rate-limit counters are per process, in memory: correct for a single instance, not for several.
- Break-glass emergency access exists but is **off** until an administrator enables it.
- The official ADHICS standard could not be downloaded (the DoH server resets connections from this environment). Controls have not been mapped line by line to it.

## 4. Sign-off checklist before real patient data
1. Resolve H1 (no default credentials), M1 (two-step for privileged roles), M2 (session policy).
2. Choose hosting; provide TLS, an encrypted volume, off-site backups and an off-host fingerprint file; make the **Production readiness** tab show no failing item.
3. Obtain the current ADHICS text and have the owner/legal reviewer classify each control (Verified Mandatory / Recommended / Requires Legal-Compliance Confirmation).
4. Run `npm run backup:drill` on the real server and record the result.
5. Written approval for any external integration (e-mail/SMS, CyberZoom/Mediplus).
