// Go-live rehearsal (stage S13): the documented production path, end to end, against a real server process.
// create the first administrator → start in production behind a (simulated) TLS proxy → HTTPS redirect and headers → forced password change →
// forced two-step set-up → backup, off-site copy, fingerprint and restore drill → the readiness report shows nothing failing and nothing left to do.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import * as OTPAuth from 'otpauth';
import { openDb } from '../server/db.js';

const NODE = ['--disable-warning=ExperimentalWarning'];
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
const totp = (secret) => new OTPAuth.TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) }).generate();
const PROXY = { 'x-forwarded-proto': 'https' }; // what a TLS-terminating proxy adds

test('S13-1 the documented production path works end to end and finishes with a clean readiness report', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fmc-golive-')); const port = await freePort();
  const env = { ...process.env, NODE_ENV: 'production', FMC_DB: join(dir, 'fmc.db'), PORT: String(port), FMC_MFA_KEY: 'ab'.repeat(32), FMC_BACKUP_KEY: 'cd'.repeat(32),
    FMC_TRUST_PROXY: '1', FMC_REQUIRE_HTTPS: '1', FMC_PUBLIC_HOST: 'clinic.example.test', FMC_DISK_ENCRYPTED: '1', FMC_BACKUP_EVERY_HOURS: '24',
    FMC_BACKUP_DIR: join(dir, 'backups'), FMC_BACKUP_OFFSITE_DIR: join(dir, 'offsite'), FMC_FINGERPRINT_FILE: join(dir, 'fingerprints', 'audit.log') };
  delete env.FMC_SEED; delete env.FMC_INSECURE_COOKIES; delete env.FMC_SCRYPT_LOGN;

  // 1. the first administrator, created on the server console
  const mkAdmin = spawnSync(process.execPath, [...NODE, 'server/create-admin.js'], { env: { ...env, FMC_ADMIN_USERNAME: 'clinic.owner', FMC_ADMIN_NAME: 'Clinic Owner', FMC_ADMIN_PASSWORD: 'Go-Live-Passphrase-2026!' }, encoding: 'utf8' });
  assert.equal(mkAdmin.status, 0, mkAdmin.stderr); assert.match(mkAdmin.stdout, /Two-step verification is now required/);
  { const db = openDb(env.FMC_DB); assert.ok(db.prepare("SELECT pass_hash FROM users WHERE username='clinic.owner'").get().pass_hash.startsWith('s2$15$'), 'production hashes use the stronger cost');
    assert.equal(db.prepare('SELECT COUNT(*) c FROM users').get().c, 1, 'no demo accounts'); assert.equal(db.prepare('SELECT COUNT(*) c FROM patients').get().c, 0, 'no demo patients'); db.close(); }

  // 2. start the server
  let log = ''; const server = spawn(process.execPath, [...NODE, 'server/index.js'], { env });
  server.stdout.on('data', (d) => { log += d; }); server.stderr.on('data', (d) => { log += d; });
  try {
    await new Promise((res, rej) => { const t0 = Date.now(); const iv = setInterval(() => { if (/FMC Patient Flow API/.test(log)) { clearInterval(iv); res(); } else if (Date.now() - t0 > 20000) { clearInterval(iv); rej(new Error('server did not start: ' + log)); } }, 100); });
    assert.ok(!/no administrator yet/.test(log), 'the server knows an administrator exists'); assert.ok(!/published demo password/.test(log), 'and no account uses the demo password');
    const base = `http://127.0.0.1:${port}`;
    const call = async (method, path, { body, cookie, headers = {} } = {}) => {
      const r = await fetch(base + path, { method, redirect: 'manual', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc', ...PROXY, ...(cookie ? { cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
      const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
      return { status: r.status, headers: r.headers, body: json ?? text, cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
    };

    // 3. plain HTTP is redirected; HTTPS through the proxy carries the security headers
    const plain = await fetch(`${base}/api/time`, { redirect: 'manual' }); assert.equal(plain.status, 308); assert.equal(plain.headers.get('location'), 'https://clinic.example.test/api/time');
    const ok = await call('GET', '/api/time'); assert.equal(ok.status, 200);
    assert.match(ok.headers.get('strict-transport-security'), /max-age=\d+/); assert.match(ok.headers.get('content-security-policy'), /frame-ancestors 'none'/); assert.equal(ok.headers.get('x-frame-options'), 'DENY');

    // 4. sign in with the temporary password: secure cookie, must change it
    const login = await call('POST', '/api/login', { body: { username: 'clinic.owner', password: 'Go-Live-Passphrase-2026!' } }); assert.equal(login.status, 200);
    const sc = login.headers.get('set-cookie'); for (const f of ['HttpOnly', 'SameSite=Strict', 'Secure']) assert.ok(sc.includes(f), `cookie has ${f}`);
    assert.equal(login.body.user.must_change_password, 1); let cookie = login.cookie;
    assert.equal((await call('GET', '/api/security/readiness', { cookie })).body.error.code, 'PASSWORD_CHANGE_REQUIRED');
    const wrong = await call('POST', '/api/account/password', { cookie, body: { current_password: 'Go-Live-Passphrase-2026!', new_password: 'short' } }); assert.equal(wrong.status, 400);
    const changed = await call('POST', '/api/account/password', { cookie, body: { current_password: 'Go-Live-Passphrase-2026!', new_password: 'Second-Phrase-Of-Gold-77' } }); assert.equal(changed.status, 200, JSON.stringify(changed.body)); cookie = changed.cookie || cookie;
    assert.equal((await call('POST', '/api/login', { body: { username: 'clinic.owner', password: 'Go-Live-Passphrase-2026!' } })).status, 401, 'the temporary password no longer works');

    // 5. two-step verification is required before anything else
    assert.equal((await call('GET', '/api/security/readiness', { cookie })).body.error.code, 'MFA_SETUP_REQUIRED');
    const setup = await call('POST', '/api/mfa/setup', { cookie }); assert.equal(setup.status, 200);
    const confirm = await call('POST', '/api/mfa/confirm', { cookie, body: { code: totp(setup.body.secret) } }); assert.equal(confirm.status, 200, JSON.stringify(confirm.body)); assert.equal(confirm.body.recovery_codes.length, 10);

    // 6. backup, off-site copy, fingerprint and restore drill (the scheduled run, started by hand)
    const bk = spawnSync(process.execPath, [...NODE, 'server/backup.js', 'run'], { env, encoding: 'utf8', timeout: 90000 }); assert.equal(bk.status, 0, bk.stderr + bk.stdout); assert.match(bk.stdout, /Scheduled run/); assert.match(bk.stdout, /"drill"/);
    assert.ok(readdirSync(join(dir, 'backups')).some((f) => f.endsWith('.enc')), 'an encrypted backup exists'); assert.ok(readdirSync(join(dir, 'offsite')).some((f) => f.endsWith('.enc')), 'and an off-site copy');
    assert.equal(readFileSync(env.FMC_FINGERPRINT_FILE, 'utf8').trim().split('\n').length, 1, 'and an audit fingerprint line');
    const verify = spawnSync(process.execPath, [...NODE, 'server/backup.js', 'verify-fingerprint', env.FMC_FINGERPRINT_FILE], { env, encoding: 'utf8' }); assert.equal(verify.status, 0, verify.stdout + verify.stderr);

    // 7. what is left is policy the administrator sets in Security Settings; then the readiness report is clean
    const before = (await call('GET', '/api/security/readiness', { cookie })).body; assert.equal(before.summary.fail, 0, JSON.stringify(before.checks.filter((c) => c.status === 'fail')));
    assert.deepEqual(before.checks.filter((c) => c.status === 'warn').map((c) => c.id), ['session_policy'], 'only the session policy is left to choose');
    assert.equal((await call('PATCH', '/api/config/settings', { cookie, body: { session_idle_minutes: '30', session_absolute_hours: '12' } })).status, 200);
    const final = (await call('GET', '/api/security/readiness', { cookie })).body;
    assert.deepEqual(final.summary, { ok: final.checks.length, warn: 0, fail: 0 }, JSON.stringify(final.checks.filter((c) => c.status !== 'ok')));
    assert.ok(!JSON.stringify(final).includes('Go-Live-Passphrase') && !JSON.stringify(final).includes('Second-Phrase'), 'no password anywhere in the report');
  } finally { server.kill(); }
});
