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

## Still open (later stages)
No MFA · self-service account recovery (administrator-assisted reset exists) · default demo password in the demo build · patient reads not audited · audit not tamper-evident · no encryption at rest · permission matrix as role templates.
Rollback for S1: tag `checkpoint/pre-security-s1-81000b9`.
