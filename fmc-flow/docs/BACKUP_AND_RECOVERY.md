# Backup & Recovery Strategy (draft for FMC review)

Status: **implemented mechanism, policy values pending verification.** Retention periods, storage location and data-residency are *not* hardcoded and must be set from verified DoH/UAE requirements and FMC policy (checklist task R1).

## Mechanism (implemented)
- `npm run backup` → `VACUUM INTO` a consistent snapshot (safe while the app runs) → encrypted with AES-256-GCM (random IV per file, auth tag detects tampering) → written `0600` to `data/backups/fmc-<timestamp>.enc`; result logged in `backup_log` (shown on the admin Health page; stale after 26 h).
- Key: `FMC_BACKUP_KEY` (64 hex chars). Keep it in a secret manager, separate from the backup storage. Losing the key makes backups unreadable.
- Retention: only prunes when `FMC_BACKUP_RETAIN_DAYS` is explicitly set (no default).
- Restore: `node server/backup.js restore <file.enc> <out.db>` → decrypts, verifies auth tag, runs `PRAGMA integrity_check`.

## Procedures to adopt
1. **Schedule**: run the backup job at least daily (cron/systemd) plus before upgrades; copy `.enc` files to a second, access-controlled location (off-host).
2. **Access control**: backup directory readable only by the service account; restore limited to named administrators; every restore recorded in the change log.
3. **Recovery**: stop the app → restore to a new file → verify counts and latest events → swap `FMC_DB` → start → review `audit_log` tail for the gap window. Document RPO/RTO targets once FMC sets them.
4. **Recovery testing**: restore into a clean environment at least quarterly (automated version exists in `tests/backup.test.js`); record date, operator, result.
5. **Monitoring**: Health page shows last backup time/size and encrypted file count; alert when stale or failed.

## Open items (need FMC / regulator confirmation)
Retention periods · required storage location/residency · who may hold the key · RPO/RTO · whether DB-level encryption at rest is additionally required for the live database.
