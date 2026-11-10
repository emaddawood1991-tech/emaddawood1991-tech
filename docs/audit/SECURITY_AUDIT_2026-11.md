# Security audit (Nov 2026) and stage S1

Method: existing probe suite (`tests/audit-probe.mjs`), ~45 additional live checks on a fresh synthetic database, and source review. Official DoH/ADHICS documents could not be read from the build environment, so no control numbers are cited and nothing here claims compliance.

## Confirmed working
Logout revokes the session server-side · fresh token on login (no fixation) · admin reset and deactivation end sessions · `Cache-Control: no-store` on API and page · CSRF header + SameSite=Strict · cross-department access refused (timeline, appointment history, rooms, sessions, waiting list, board) · CSV export limited to supervisor/admin and audited · no source or database files served · `npm audit --omit=dev`: 0 vulnerabilities.

## Stage S1 (implemented)
| Finding | Change | Test |
|---|---|---|
| Any clinician could search all patients; `%` dumped the directory | Search scoped to the user's department (appointment, queue, session or waiting-list link); minimum 3 characters; wildcards literal | S1-1, S1-2 |
| Invalid role returned 500; last administrator could be disabled | Server-side validation of role, department, flags, username; `LAST_ADMIN` guard | S1-3, S1-4 |
| Usernames and override flag visible to everyone | Administrators only | S1-5 |
| Missing headers | HSTS, Permissions-Policy, COOP, CORP | S1-6 |
| Login timing revealed valid usernames; hashing blocked the server; typed usernames were logged | Async scrypt, hash always computed, failed attempts store only an account id or a length | S1-7, S1-8 |
| Lockout must hold under parallel guesses | Attempts counted before hashing | S1-8b |
| Rate limit saw the proxy address | `FMC_TRUST_PROXY` | S1-9 |
| Database readable by other accounts | `umask 077` and mode 600 for database, WAL, shm | S1-10 |

## Stage S2 (implemented): accounts and sessions
| Finding | Change | Test |
|---|---|---|
| No way to change a password; weak passwords accepted; shared demo password | Change Password (current password required, policy, no reuse of the last 5, rate-limited); policy: configurable minimum length (10–64), common-password list, username/name checks, character mix or 16+ character passphrase; new accounts and administrator resets are temporary and force a new password at first sign-in; `SEED_FORCE_CHANGE=1` does the same for seeded accounts | S2-1…S2-5 |
| Sessions lived forever while used; no session list | Absolute session lifetime (default 14 h) on top of idle expiry; cap on concurrent sessions (default 3, oldest signed out); My Account lists devices and signs out one or all others; administrators can end all of a person's sessions; password change rotates the token and ends all other sessions | S2-3, S2-6, S2-7, S2-12 |
| No sign-in history | `login_events` (append-only): sign-in, failure, lockout, sign-out, password change/reset, session revocation, username change — address and device, never secrets; visible to the person and to administrators | S2-8 |
| Usernames could not be changed | Administrator-only, validated, unique, audited | S2-9 |
| No Security & Access section | Settings → Security & Access: Employee accounts, Roles & Permissions (read-only matrix), Login Activity, Audit History, Security Settings | S2-10, browser suite |
New tables: `login_events`, `password_history`. New columns: `users.must_change_password/password_changed_at/last_login_at`, `auth_sessions.sid/ip/user_agent`. Settings: `password_min_length`, `session_absolute_hours`, `max_concurrent_sessions`. Rollback: tag `checkpoint/pre-security-s2-7cbe2bc`.

## Stage S3 (implemented): multi-factor authentication
- TOTP (RFC 6238; SHA-1, 6 digits, 30 s, ±1 step) through the `otpauth` library, QR codes through `qrcode`; both audited (`npm audit`: 0 vulnerabilities).
- Two-step sign-in: the password alone creates no session — only a short-lived (5 min) one-time challenge; each time step is accepted once (replay protection); 5 tries per challenge and a 15-minute lock after 5 wrong codes.
- Ten single-use recovery codes, stored only as hashes. Authenticator secrets are stored AES-256-GCM encrypted under `FMC_MFA_KEY` (not in the database).
- Roles that must use it are a setting (`mfa_required_roles`; seed `SEED_REQUIRE_MFA=1`): those users can sign in but reach only the set-up screen until enrolled, and cannot turn it off. Others may opt in and out with password + code.
- Lost device: administrator reset (ends sessions) or server console `npm run mfa:reset -- <username>`; both audited.
- New tables `user_mfa`, `mfa_recovery_codes`. Tests: `mfa.test.js` (9), `e2e-mfa.cjs` (18). Not available in the in-browser demo. Rollback: tag `checkpoint/pre-security-s3-6b6a418`.

## Stage S4 (implemented): audit and patient privacy
- **Patient-access log** (`patient_access_log`, append-only): who was shown which patient, from which screen (search, schedule and lists, visits, queue, sessions, timeline, clinical documentation, appointment details, corrections, reports, export file). One entry per person, patient and screen per 15 minutes (5 for clinical notes) so polling screens do not flood the log. Readable by administrators only; reading it is audited.
- **Tamper-evident audit log:** every entry carries the hash of the previous one. Altered, removed or injected entries break the chain; removal of the newest entries is caught by periodic anchors (`audit_anchors`, append-only). Verification in Settings → Security & Access → Audit History, also for supervisors. Entries from before the chain are reported as legacy, never as problems. An off-host copy of the latest fingerprint is still needed (stage S6) because the anchors live in the same database.
- **Security alerts** (`security_alerts`; Alerts tab, administrators): repeated failed sign-ins, large or repeated exports, many patients looked up in a short time, privileged sign-ins outside office hours, audit-chain problems. De-duplicated for an hour, acknowledgeable, and an acknowledged alert is not re-raised from the same events. Evaluated every minute on the server and whenever the tab is opened. Delivery is on screen only (no email/SMS channel without your approval).
- **Rate limits** per person: searches (default 60/min), exports (10/hour), overall ceiling (1200/min); audited once per window; all configurable.
- **Exports:** size limit (default 5000 rows), watermark line, file named for person and date, every patient in the file recorded in the access log, row count and scope in the audit entry.
- New tables `patient_access_log`, `audit_anchors`, `security_alerts`; columns `audit_log.prev_hash/row_hash`. Tests: `privacy.test.js` (9), `e2e-privacy.cjs` (10). Rollback: tag `checkpoint/pre-security-s4-6e107fb`.

## Stage S5 (implemented): role templates and a verified permission matrix
- **Seven documented role templates** (`server/roles.js`): Super Administrator, Clinic Manager, Receptionist, Physiotherapist, Orthopedic Doctor, General Practitioner, Other authorized clinical staff. Each maps onto one of the four enforced roles (admin / supervisor / reception / clinician). The three named clinical templates must belong to their department (Physiotherapy, Orthopedics, General Medicine); other departments use "Other authorized clinical staff". Choosing a template in Settings → Staff sets the role and is validated on the server; changing the role by hand clears the stale template label; accounts created before S5 show the closest default.
- **No permission was changed.** The matrix in `perms.js` is exactly what S1–S4 enforced, so no approval step was triggered. Any future change to *who can do what* is a one-line edit there and needs your approval first.
- **Clinical authorization stays separate.** A template grants no `staff_services`; administrator status never starts treatment (test S5-5: an administrator naming no authorized clinician is refused).
- **The matrix is read from the real router.** Every guard is tagged with its permission; Settings → Security & Access → Roles & Permissions shows the templates, the role × permission grid and every API route with the permission it requires (`GET /api/security/permissions`, administrators only). Documentation cannot drift from enforcement.
- **Tests (`permissions.test.js`, 14):** every `/api` route is guarded or on the 3-item public list; every guard names a permission that exists; every guarded route answers 401 when signed out; every route with a named permission refuses every role that lacks it (all four roles, 60+ denials); administrator vs clinical authorization; template rules; and **URL/id tampering**: a physiotherapist cannot read, change or act on an orthopedic visit, session, documentation, queue entry, correction or room assignment, cannot find the patient by name/phone/EMR/id, and walking every visit and session id returns only physiotherapy records.
- **Finding (recorded, no code change):** room status (cleaning/available) and room assignment are not department-restricted, because rooms are shared facilities — a visit may use any free room, and the flow tests rely on it. Patient data is protected through the visit check, which does restrict. If rooms become department-exclusive, restrict `setRoomStatus` and `checkAssignable` by department.
- Column `users.role_template` (additive). Browser test `e2e-roles.cjs` (10). Rollback: tag `checkpoint/pre-security-s5-093bd1f`.

## Stage S6 (implemented): operations security
- **Restore drill** (`backup.js drill`, automatic every 30 days when scheduled): decrypts a backup into a temporary file, `integrity_check`, verifies the audit hash chain inside it, reads row counts, deletes the file, records the result in `backup_log`. A backup holding a tampered audit log fails the drill.
- **Scheduled backups** (`FMC_BACKUP_EVERY_HOURS`): encrypted backup, copy to `FMC_BACKUP_OFFSITE_DIR`, audit fingerprint, drill when due. No retention default.
- **Off-host audit fingerprint** (`fingerprint.js`, `FMC_FINGERPRINT_FILE`): closes the remaining gap of probe P17 — a rewritten history with a recomputed chain is detected against a line stored elsewhere (test S6-3). Optional HMAC makes forged lines detectable.
- **HTTPS requirement** `FMC_REQUIRE_HTTPS=1` (308 redirect to `FMC_PUBLIC_HOST`/host); HSTS and `Secure` cookies were already on.
- **Production readiness report** (14 checks; Security & Access tab, `GET /api/security/readiness`, `npm run readiness`). Items the app cannot see (TLS in front, disk encryption) are shown as *declared*; the report states it is not a compliance certificate.
- **Encryption at rest:** the live SQLite file is *not* encrypted by the application (no engine change was made). Use an encrypted volume and declare it; backups and authenticator secrets are encrypted by the app. Encrypted engine / field encryption need written approval.
- No schema change. Tests `operations.test.js` (7), browser checks added to `e2e-roles.cjs` (13). Documentation: `fmc-flow/docs/DEPLOYMENT_AND_ENCRYPTION.md`. Rollback: tag `checkpoint/pre-security-s6-3135383`.
- **Also fixed:** the in-browser demo build was broken after S3/S4 (missing `originalUrl` on its request object and a `chmodSync` stub); it is repaired and verified (5 demo checks + sandboxed iframe).

## Still open (later stages)
MFA is available but not required by default (enable per role) · self-service account recovery (administrator-assisted reset exists) · default demo password in the demo build · hosting, TLS termination and volume encryption are the operator's to provide (S6 supplies the checks) · break-glass emergency access and self-service recovery (S7).
Rollback for S1: tag `checkpoint/pre-security-s1-81000b9`.
