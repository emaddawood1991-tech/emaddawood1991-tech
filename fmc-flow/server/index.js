import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createApp } from './app.js';
import { keyFromHex } from './mfa.js';
import { seed } from './seed.js';

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
const { app, db, ops } = createApp({ staticDir, mfaKey: resolveMfaKey() });
if (!String(ops.setting('mfa_required_roles') || '').includes('admin')) console.warn('SECURITY: multi-factor authentication is not required for administrators. Turn it on in Settings → Security & Access (or seed with SEED_REQUIRE_MFA=1).');
if (process.env.FMC_SEED !== '0' && seed(db)) console.log('Seeded synthetic development data (see npm run seed).');
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`FMC Patient Flow API on http://localhost:${port}`));
setInterval(() => { try { ops.sweepTimers(); } catch (e) { console.error('timer sweep failed:', e.message); } }, 10000).unref();
