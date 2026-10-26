# Checkpoint and restore

## Checkpoints (created 26 Oct 2026, before any Phase B+ change)
| Name | Commit | Meaning |
|---|---|---|
| `checkpoint/last-verified-working-a7eddcf` | `a7eddcf` | Last commit that changed application source. Verified: 48/48 backend tests; fresh-checkout restore drill passed. |
| `checkpoint/pre-phase-a-2026-10-26` | `91661b4` | Repository state when Phase A began (application source identical to `a7eddcf`; later commits only added documents, probes and the demo build). |

The git tags exist in the working copy; pushing tags through this environment's proxy failed (`remote end hung up`), so **the commit hashes on the remote branch `claude/ecstatic-ride-gvcoga` are the durable checkpoint**. If tags are missing, use the hash.

## Restore the application source
```bash
git fetch origin claude/ecstatic-ride-gvcoga
git checkout a7eddcf -- fmc-flow          # or: git checkout checkpoint/last-verified-working-a7eddcf -- fmc-flow
cd fmc-flow && npm ci && npm run build && npm test
```
Full rollback of a bad change: `git revert <commit>` (preferred, keeps history) or create a new branch at the checkpoint: `git switch -c restore-from-checkpoint a7eddcf`.

## Restore the database
The database is the single file `fmc-flow/data/fmc.db` (plus `-wal`/`-shm`). Code restores never touch it.
- Back up: `FMC_BACKUP_KEY=<64 hex> npm run backup` → encrypted AES-256-GCM file in `data/backups/`.
- Restore: `FMC_BACKUP_KEY=<64 hex> node server/backup.js restore <file.enc> <new.db>` (verifies the auth tag and `PRAGMA integrity_check`), then stop the app and point `FMC_DB` at `<new.db>`.
- Verified 26 Oct 2026 on synthetic data: backup → restore → identical row counts for patients, users, departments, services, rooms, stations, appointments, audit_log.
- Before any schema migration: take a backup first and keep it until the migration is verified. Migrations must be additive and reversible; no destructive statements without written approval.

## What is NOT covered
The copy of the application you restored on your own computer is outside this environment. Please confirm which commit or folder it corresponds to (see questions in the Phase A report) so the same checkpoint applies to it. Real patient databases are not present here and have not been touched.
