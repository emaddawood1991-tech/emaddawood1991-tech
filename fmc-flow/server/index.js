import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createApp } from './app.js';
import { keyFromHex } from './mfa.js';
import { seed } from './seed.js';
import { runScheduled } from './backup.js';

process.umask(0o077); // new files (database, WAL, backups) are private to the service account
const staticDir = new URL('../dist/', import.meta.url).pathname;
/** Key that encrypts authenticator secrets. Prefer FMC_MFA_KEY (64 hex characters) kept outside the database and its backups; otherwise a key file next to the data is created once. */
function resolveMfaKey() {
  if (process.env.FMC_MFA_KEY) return keyFromHex(process.env.FMC_MFA_KEY);
  const f = new URL('../data/mfa.key', import.meta.url).pathname;
  if (existsSync(f)) return keyFromHex(readFileSync(f, 'utf8').trim());
  mkdirSync(new URL('../data/', import.meta.url).pathname, { recursive: true, mode: 0o700 });
  const hex = randomBytes(32).toString('hex'); writeFileSync(f, hex, { mode: 0o600 });
  console.warn('MFA: created data/mfa.key. For production set FMC_MFA_KEY instead and keep the key outside the database folder and its backups.');
  return Buffer.from(hex, 'hex');
}
const { app, db, ops, privacy } = createApp({ staticDir, mfaKey: resolveMfaKey() });
const monitor = () => privacy.monitor();
if (!String(ops.setting('mfa_required_roles') || '').includes('admin')) console.warn('SECURITY: multi-factor authentication is not required for administrators. Turn it on in Settings → Security & Access (or seed with SEED_REQUIRE_MFA=1).');
if (process.env.FMC_SEED !== '0' && seed(db)) console.log('Seeded synthetic development data (see npm run seed).');
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`FMC Patient Flow API on http://localhost:${port}`));
setInterval(() => { try { monitor(); } catch (e) { console.error('security monitor failed:', e.message); } }, 60000).unref(); // security alerts and audit-chain anchors
setInterval(() => { try { ops.sweepTimers(); } catch (e) { console.error('timer sweep failed:', e.message); } }, 10000).unref();
// Scheduled encrypted backup + off-site copy + audit fingerprint + periodic restore drill (needs FMC_BACKUP_KEY; interval in hours).
const backupEvery = Number(process.env.FMC_BACKUP_EVERY_HOURS || 0);
if (backupEvery > 0) {
  if (!/^[0-9a-f]{64}$/i.test(process.env.FMC_BACKUP_KEY || '')) console.warn('BACKUP: FMC_BACKUP_EVERY_HOURS is set but FMC_BACKUP_KEY is missing; scheduled backups are disabled.');
  else {
    const job = () => { try { const r = runScheduled({ dir: new URL('../data/backups/', import.meta.url).pathname }); console.log('Scheduled backup written', r.backup.split('/').pop(), r.drill ? '(restore drill passed)' : ''); } catch (e) { console.error('scheduled backup failed:', e.message); } };
    setInterval(job, backupEvery * 3600e3).unref(); setTimeout(job, 60e3).unref();
  }
}
