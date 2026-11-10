// Production readiness report (stage S6): what is configured, what is only declared, what is missing.
// The application can check files, keys and logs it can see. It cannot see the disk or the network, so those items are reported as "declared by the operator".
import { statSync } from 'node:fs';

const HEX64 = /^[0-9a-f]{64}$/i;
const hoursSince = (ts) => (ts ? (Date.now() - Date.parse(ts)) / 36e5 : Infinity);

export function readiness({ db, env = process.env, reqSecure = false, backupDir = null } = {}) {
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const checks = []; const add = (id, status, label, detail, cls = 'Recommended Security Practice') => checks.push({ id, status, label, detail, class: cls });

  add('https', reqSecure ? 'ok' : 'warn', 'This page was opened over HTTPS', reqSecure ? 'The connection used TLS (seen through the proxy if one is configured).' : 'Plain HTTP. Patient data must travel over TLS: put the application behind a TLS-terminating proxy (docs/DEPLOYMENT_AND_ENCRYPTION.md).', 'Requires Legal-Compliance Confirmation');
  add('require_https', env.FMC_REQUIRE_HTTPS === '1' ? 'ok' : 'warn', 'Plain-HTTP requests are redirected to HTTPS', env.FMC_REQUIRE_HTTPS === '1' ? 'FMC_REQUIRE_HTTPS=1' : 'Set FMC_REQUIRE_HTTPS=1 in production (and FMC_TRUST_PROXY behind a proxy).');
  add('trust_proxy', env.FMC_TRUST_PROXY ? 'ok' : 'warn', 'Proxy trust is configured', env.FMC_TRUST_PROXY ? `FMC_TRUST_PROXY=${env.FMC_TRUST_PROXY}` : 'Behind a reverse proxy set FMC_TRUST_PROXY (hop count or address) so client addresses and HTTPS are recognised.');
  add('cookies', env.FMC_INSECURE_COOKIES === '1' ? 'fail' : 'ok', 'Session cookies are Secure, HttpOnly, SameSite', env.FMC_INSECURE_COOKIES === '1' ? 'FMC_INSECURE_COOKIES=1 is set: remove it outside local development.' : 'Always on.');
  add('mfa_key', HEX64.test(env.FMC_MFA_KEY || '') ? 'ok' : 'warn', 'Authenticator-secret key is held outside the database folder', HEX64.test(env.FMC_MFA_KEY || '') ? 'FMC_MFA_KEY is set.' : 'Using a key file next to the data. Set FMC_MFA_KEY from a secret store.');
  const bk = HEX64.test(env.FMC_BACKUP_KEY || '');
  add('backup_key', bk ? 'ok' : 'fail', 'Backup encryption key is set', bk ? 'FMC_BACKUP_KEY is set (AES-256-GCM).' : 'FMC_BACKUP_KEY is missing or not 64 hex characters: no encrypted backups can be made.');
  if (bk && HEX64.test(env.FMC_MFA_KEY || '') && env.FMC_BACKUP_KEY.toLowerCase() === env.FMC_MFA_KEY.toLowerCase()) add('keys_distinct', 'fail', 'Backup and authenticator keys are different', 'The same key is used for both: use two independent keys.');
  else add('keys_distinct', 'ok', 'Backup and authenticator keys are different', 'Independent keys.');
  const lastB = one("SELECT ts,ok FROM backup_log WHERE ok=1 AND note='AES-256-GCM' ORDER BY id DESC LIMIT 1");
  add('backup_recent', hoursSince(lastB?.ts) <= 26 ? 'ok' : 'warn', 'An encrypted backup was made in the last 26 hours', lastB ? `Last: ${lastB.ts}` : 'No backup recorded.');
  const every = Number(env.FMC_BACKUP_EVERY_HOURS || 0);
  add('backup_scheduled', every > 0 && bk ? 'ok' : 'warn', 'Backups run on a schedule', every > 0 ? `Every ${every} h (FMC_BACKUP_EVERY_HOURS).` : 'Set FMC_BACKUP_EVERY_HOURS (for example 24) or run `npm run backup` from the host scheduler.');
  const off = env.FMC_BACKUP_OFFSITE_DIR;
  add('backup_offsite', off ? 'ok' : 'warn', 'Backups are copied to a second location', off ? `FMC_BACKUP_OFFSITE_DIR is set (${off}). It should be a different machine or storage account.` : 'Set FMC_BACKUP_OFFSITE_DIR to a mounted off-host location.', 'Requires Legal-Compliance Confirmation');
  const lastD = one("SELECT ts FROM backup_log WHERE ok=1 AND note LIKE 'DRILL ok%' ORDER BY id DESC LIMIT 1");
  const failedD = one("SELECT ts FROM backup_log WHERE ok=0 AND note LIKE 'DRILL%' ORDER BY id DESC LIMIT 1");
  add('restore_drill', hoursSince(lastD?.ts) <= 95 * 24 ? 'ok' : failedD ? 'fail' : 'warn', 'A restore drill passed in the last 95 days', lastD ? `Last passed: ${lastD.ts}` : failedD ? `Last drill FAILED at ${failedD.ts}.` : 'No drill recorded. Run `npm run backup:drill`.');
  const fpFile = env.FMC_FINGERPRINT_FILE; const lastF = one("SELECT ts FROM backup_log WHERE ok=1 AND note LIKE 'FINGERPRINT%->%' ORDER BY id DESC LIMIT 1");
  add('fingerprint', fpFile && hoursSince(lastF?.ts) <= 26 ? 'ok' : 'warn', 'An audit-log fingerprint is stored off this server', fpFile ? (lastF ? `Last written ${lastF.ts} to ${fpFile}; the file must be on separate storage.` : `FMC_FINGERPRINT_FILE is set (${fpFile}) but nothing was written in the last 26 hours.`) : 'Set FMC_FINGERPRINT_FILE to a location outside this server (scheduled backups append to it).');
  add('disk_encryption', env.FMC_DISK_ENCRYPTED === '1' ? 'ok' : 'warn', 'The disk or volume holding the database is encrypted', env.FMC_DISK_ENCRYPTED === '1' ? 'Declared by the operator (FMC_DISK_ENCRYPTED=1). The application cannot verify it.' : 'The database file itself is not encrypted. Use an encrypted volume (BitLocker, LUKS, or encrypted cloud disk) and declare it with FMC_DISK_ENCRYPTED=1.', 'Requires Legal-Compliance Confirmation');
  try { const f = db.prepare('PRAGMA database_list').all().find((d) => d.name === 'main')?.file;
    if (f) { const m = statSync(f).mode & 0o777; add('db_permissions', (m & 0o077) === 0 ? 'ok' : 'warn', 'Database file is readable only by the service account', `mode ${m.toString(8)}`); } } catch { /* in-memory */ }
  const roles = String(one("SELECT value FROM settings WHERE key='mfa_required_roles'")?.value || '').split(',');
  add('admin_mfa', roles.includes('admin') ? 'ok' : 'warn', 'Two-step verification is required for administrators', roles.includes('admin') ? `Required for: ${roles.filter(Boolean).join(', ')}` : 'Turn it on in Security Settings.');
  const sum = { ok: 0, warn: 0, fail: 0 }; for (const c of checks) sum[c.status]++;
  return { generated_at: new Date().toISOString(), summary: sum, checks, note: 'Not a compliance certificate. Items classed “Requires Legal-Compliance Confirmation” need confirmation against current DoH/ADHICS requirements before real patient data is used.' };
}
