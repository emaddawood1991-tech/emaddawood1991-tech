# Go-live runbook — FMC Patient Flow

Status: **ready to follow once the decisions in section 1 are made.** The path below is rehearsed automatically by `tests/golive.test.js` (a real production-mode server: first administrator → HTTPS redirect → forced password change → forced two-step → backup, off-site copy, fingerprint, restore drill → readiness report with nothing failing and nothing left to do).

This is an engineering runbook, **not** a DoH/ADHICS assessment. Do not enter real patient data until section 8 is complete and the owner has signed off.

## 1. Decisions and inputs only you can give
| # | Needed | Why | Until then |
|---|---|---|---|
| 1 | **Hosting**: your own server, a UAE cloud region, or a managed platform; and who administers it | Decides TLS, disk encryption, backups location, data residency | Development and demo only |
| 2 | **Who holds the keys** (`FMC_MFA_KEY`, `FMC_BACKUP_KEY`) and where the off-site backup and fingerprint files live | Keys must not sit next to the data | — |
| 3 | **Current ADHICS text** (PDF from a UAE connection) and who classifies each control | The DoH site refuses this environment; no control numbers are cited anywhere | No compliance claim is made |
| 4 | **Session limits** for clinic computers vs wall displays (suggested start: 30 minutes idle, 12 hours total) | Readiness warns until set | Defaults are 12 h idle / 14 h total |
| 5 | **Backup retention and RPO/RTO targets** | Not defaulted on purpose | Backups are kept forever |
| 6 | **Email/SMS recovery provider**, if wanted | External integration needs your written approval | Administrator-assisted recovery works |
| 7 | **Break-glass emergency access**: on or off, and the minutes per access (default 60) | Off by default | Off |
| 8 | **Real staff list**: names, departments, role template, authorized services | Accounts are created by an administrator | — |

## 2. Prepare the server
1. Node 22 or newer. Copy the application; `npm ci && npm run build`.
2. Run as a dedicated account that owns only the data folder. The database file and backups are created `0600`.
3. Put the data folder on an **encrypted volume** (BitLocker, LUKS, or the cloud provider's encrypted disk). The application does not encrypt the live database itself.
4. Put a TLS-terminating reverse proxy in front (example in `docs/DEPLOYMENT_AND_ENCRYPTION.md`). Forward `X-Forwarded-Proto`.
5. Generate two **different** 64-character hex keys (for example `openssl rand -hex 32` twice) and store them in the secret store, not in the repository or the data folder.
6. Tune password hashing on this machine: `npm run tune:hash`, then use its recommendation as `FMC_SCRYPT_LOGN` (production default is 15).

## 3. Environment (example)
```
NODE_ENV=production
FMC_DB=/srv/fmc/data/fmc.db
FMC_TRUST_PROXY=1                 FMC_REQUIRE_HTTPS=1          FMC_PUBLIC_HOST=flow.example.ae
FMC_MFA_KEY=<64 hex>              FMC_BACKUP_KEY=<different 64 hex>
FMC_DISK_ENCRYPTED=1              # only if true; the application cannot verify it
FMC_BACKUP_EVERY_HOURS=24         FMC_BACKUP_DIR=/srv/fmc/backups
FMC_BACKUP_OFFSITE_DIR=/mnt/offsite/fmc-backups     # a different machine or storage account
FMC_FINGERPRINT_FILE=/mnt/offsite/fmc-audit.log     # also off this server
FMC_SCRYPT_LOGN=<from tune:hash>
```
Never set `FMC_INSECURE_COOKIES` or `FMC_ALLOW_DEMO_SEED` in production.

## 4. First start
1. `npm run admin:create` — username, full name, hidden temporary password (policy-checked). It also makes two-step verification mandatory for administrators and clinic managers.
2. `npm start`. Production creates the clinic catalog (departments, services, rooms, appointment categories) only: **no demo accounts, no demo patients.** The log warns if no administrator exists.
3. Sign in as that administrator (over HTTPS). You must choose a new password, then set up two-step verification and store the ten recovery codes safely.
4. Open **Settings → Security & Access → Production readiness**. Clear every item until nothing fails and nothing is left to do (the session policy is set in **Security Settings**: idle minutes and total hours).

## 5. Configure the clinic
1. Settings → departments, services (durations), rooms and beds, appointment categories — check against the real clinic.
2. Settings → Staff → add each person with a **role template**; give clinicians their **department** and, separately, their **authorized services**. Administrator status never grants treatment authorization.
3. Give temporary passwords through a safe channel; each person changes theirs at first sign-in. Ask every clinician and manager to turn on two-step verification (required for managers).
4. Settings → Security Settings: password length, rate limits, alert thresholds, export row limit, break-glass (if decided).

## 6. Rehearse before real data
1. With **synthetic patients only**, run one full day: register, check in, room, treat, document, check out; the Daily Schedule; a correction; a duplicate link and undo; a no-show; a recovery request; one break-glass use and its review.
2. `npm run backup:run`, then `npm run backup:drill`, then `npm run audit:verify <fingerprint file>` — all must succeed.
3. Delete the synthetic patients only by starting from a fresh database (records are never deleted from a live one): stop the server, move the database aside, `npm run admin:create`, start again.

## 7. Day-to-day operation
- **Daily:** the scheduled backup (+ off-site copy + fingerprint); glance at Alerts and the Production readiness tab.
- **Monthly:** the restore drill runs by itself every 30 days; confirm it passed. Review unreviewed break-glass uses (must be within 24 h) and patient-link proposals.
- **Quarterly:** restore a backup into a clean environment and compare counts; review accounts (deactivate leavers — accounts are never deleted); review Login Activity.
- **When someone is locked out:** Security & Access → Recovery & Emergency (after verifying identity yourself). Lost phone: reset their two-step verification. No administrator can sign in: `npm run mfa:reset -- <username>` on the server console.
- **After an incident:** keep the audit log; run `npm run audit:verify` against the off-site fingerprint file to show the history was not altered.

## 8. Before the first real patient
- [ ] Hosting decided; TLS working; data on an encrypted volume; keys held by named people.
- [ ] Readiness tab shows nothing failing and nothing left to do.
- [ ] Restore drill and fingerprint verification succeeded on the real server.
- [ ] Every staff account created through a template; two-step on for managers and administrators.
- [ ] Current ADHICS text obtained and each control classified by the owner (Verified Mandatory / Recommended / Requires Legal-Compliance Confirmation).
- [ ] Written sign-off from the owner. Until then: synthetic data only.

## 9. Rollback
Every stage has a checkpoint tag (`checkpoint/pre-security-s…`). To go back: stop the server, restore the database from a verified backup (`node server/backup.js restore <file.enc> <new.db>`; check counts; point `FMC_DB` at it), check out the tag, rebuild, start. Review the audit log for the gap window.
