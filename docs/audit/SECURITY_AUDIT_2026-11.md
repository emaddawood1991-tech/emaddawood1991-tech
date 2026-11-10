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

## Still open (later stages)
No MFA · no change-password / forced change / recovery · default demo password · no absolute session lifetime or session list · patient reads not audited · audit not tamper-evident · no encryption at rest · permission matrix as role templates.
Rollback for S1: tag `checkpoint/pre-security-s1-81000b9`.
