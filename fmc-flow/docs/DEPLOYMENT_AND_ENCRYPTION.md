# Deployment, encryption and backups (stage S6)

Status: mechanisms implemented; **hosting not yet chosen**, so TLS termination and disk encryption are the operator's to provide and declare. Nothing here is a DoH/ADHICS compliance claim; items marked *Requires Legal-Compliance Confirmation* must be checked against current requirements before real patient data is used.

## 1. Where encryption happens
| Layer | Today | Class |
|---|---|---|
| In transit | The app speaks HTTP; **TLS must be terminated in front of it** (reverse proxy / load balancer). The app then redirects plain HTTP (`FMC_REQUIRE_HTTPS=1`), sends HSTS, and marks cookies `Secure; HttpOnly; SameSite`. | Requires Legal-Compliance Confirmation (TLS version/ciphers) |
| At rest, live database | SQLite through `node:sqlite` has **no built-in encryption**. Use an encrypted volume (BitLocker, LUKS, or an encrypted cloud disk) and declare it with `FMC_DISK_ENCRYPTED=1`. The file is created `0600`. | Requires Legal-Compliance Confirmation |
| At rest, backups | Done by the app: AES-256-GCM, random IV per file, tamper detection, key `FMC_BACKUP_KEY` kept outside the repo, database and backup folder. | Recommended |
| Authenticator secrets | AES-256-GCM under `FMC_MFA_KEY` (separate from the backup key; the readiness report refuses the same key for both). | Recommended |
| Passwords | scrypt hashes (not reversible). | Recommended |

**Not done, needs your written approval:** replacing SQLite with an encrypted engine (for example SQLCipher) or adding application-level field encryption. Both change the database architecture. Volume encryption achieves the same protection for a stolen disk without changing the engine.

## 2. TLS behind a proxy (example: Caddy)
```
flow.example.ae {
  reverse_proxy 127.0.0.1:3000
}
```
Environment for the app:
```
NODE_ENV=production  FMC_TRUST_PROXY=1  FMC_REQUIRE_HTTPS=1  FMC_PUBLIC_HOST=flow.example.ae
FMC_MFA_KEY=<64 hex>  FMC_BACKUP_KEY=<different 64 hex>  FMC_DISK_ENCRYPTED=1
```
Nginx works the same way: forward `X-Forwarded-Proto`, set `FMC_TRUST_PROXY=1`. Do **not** set `FMC_INSECURE_COOKIES` outside local development (the readiness report marks it as failing).

## 3. Scheduled backups, off-site copy and drills
Set `FMC_BACKUP_EVERY_HOURS=24` (and the keys) and the server runs, once a day and 60 seconds after start:
1. encrypted backup into `data/backups/`;
2. copy of that encrypted file to `FMC_BACKUP_OFFSITE_DIR` (a mounted location on a **different** machine or storage account);
3. an audit-log fingerprint appended to `FMC_FINGERPRINT_FILE` (also off-host);
4. a **restore drill** when none has passed in the last `FMC_DRILL_EVERY_DAYS` (default 30): the backup is decrypted into a temporary file, `integrity_check` runs, the audit hash chain is verified, row counts are read, the temporary file is deleted, and the result is recorded (`backup_log`). A failed drill raises the readiness item to *failing*.

Manual commands (in `fmc-flow/`): `npm run backup`, `npm run backup:run` (all four steps), `npm run backup:drill [file]`, `npm run audit:fingerprint`, `npm run audit:verify <fingerprint-file> [--all]`, `npm run readiness`.

**Recovery:** stop the app → `node server/backup.js restore <file.enc> <new.db>` → check counts → point `FMC_DB` at it → start → review the audit log for the gap window. Retention (`FMC_BACKUP_RETAIN_DAYS`) is never defaulted; the period must come from a verified requirement.

## 4. Off-host audit fingerprint — why
The audit log is a hash chain. Someone with file access could rewrite history *and* recompute every later hash. A fingerprint line (entry count, newest hash, time, optional HMAC under the backup key) stored on separate storage cannot be rewritten that way: `npm run audit:verify` then reports `ENTRY_MISSING_OR_REWRITTEN`. Lines contain no patient data. Keep the fingerprint file append-only on the other storage if the platform allows it.

## 5. Readiness report
Settings → Security & Access → **Production readiness** (administrators) or `npm run readiness`: 14 checks (HTTPS, redirect, proxy, cookies, key placement, key separation, last backup, schedule, off-site copy, restore drill, fingerprint, disk encryption declared, file permissions, administrator two-step). "Declared" items are the operator's statement; the application cannot see the disk or the network.

## 6. Decisions still needed from FMC
Hosting (on-premises server vs cloud vs managed platform; UAE data-residency requirement) · who holds the keys and the backup location · retention periods · RPO/RTO targets · whether a cloud/volume-level encryption service or an encrypted database engine is preferred.
