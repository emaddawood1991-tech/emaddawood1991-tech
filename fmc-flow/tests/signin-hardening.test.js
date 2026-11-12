// Sign-in hardening (stage S10): lock-outs that survive a restart and raise an alert, a stronger password-hash cost with automatic upgrade,
// and an idle sign-out that can be set in minutes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../server/db.js';
import { seed, DEMO_PASSWORD } from '../server/seed.js';
import { createApp } from '../server/app.js';
import { clock } from '../server/ops.js';
import { hashPassword, verifyPassword, parseHash, needsRehash, hashPasswordAsync, verifyPasswordAsync } from '../server/passwords.js';
import { demoPasswordAccounts } from '../server/readiness.js';
import { boot } from './helpers.js';

const serve = async (db) => { const { app } = createApp({ db }); const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); }); return { base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }; };
const login = (base, username, password) => fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) });
const withEnv = async (k, v, fn) => { const old = process.env[k]; process.env[k] = v; try { return await fn(); } finally { if (old === undefined) delete process.env[k]; else process.env[k] = old; } };

test('S10-1 a lock-out survives a restart, raises an alert once, and stores no readable username', async () => {
  const db = openDb(':memory:'); seed(db);
  let s = await serve(db);
  for (let i = 0; i < 5; i++) assert.equal((await login(s.base, 'reception', `wrong-guess-${i}`)).status, 401);
  assert.equal((await login(s.base, 'reception', 'wrong-guess-6')).status, 429);
  assert.equal((await login(s.base, 'reception', 'wrong-guess-7')).status, 429);
  s.close();
  s = await serve(db); // a new process on the same database
  assert.equal((await login(s.base, 'reception', DEMO_PASSWORD)).status, 429, 'still locked after the restart, even with the right password');
  assert.equal((await login(s.base, 'pt.one', DEMO_PASSWORD)).status, 200, 'other people are not affected');
  const alerts = db.prepare("SELECT * FROM security_alerts WHERE kind='ACCOUNT_LOCKOUT'").all(); assert.equal(alerts.length, 1, 'one alert, not one per refused attempt');
  assert.equal(JSON.parse(alerts[0].detail).account, 'known');
  const keys = db.prepare('SELECT key FROM login_attempts').all().map((r) => r.key);
  assert.ok(keys.length >= 1 && keys.every((k) => /^[0-9a-f]{64}$/.test(k)), 'keys are hashes');
  assert.ok(!JSON.stringify(db.prepare('SELECT * FROM login_attempts').all()).includes('reception'), 'the typed name is not stored');
  assert.ok(db.prepare("SELECT 1 FROM login_events WHERE event='LOGIN_BLOCKED'").get());
  s.close();
});

test('S10-2 the counter resets after the one-minute window and after a successful sign-in', async () => {
  const db = openDb(':memory:'); seed(db); const s = await serve(db);
  for (let i = 0; i < 3; i++) await login(s.base, 'super', `nope-${i}x`);
  assert.equal((await login(s.base, 'super', DEMO_PASSWORD)).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) c FROM login_attempts').get().c, 0, 'cleared by a good sign-in');
  for (let i = 0; i < 5; i++) await login(s.base, 'super', `nope-${i}y`);
  assert.equal((await login(s.base, 'super', DEMO_PASSWORD)).status, 429);
  db.prepare('UPDATE login_attempts SET t=t-61000').run(); // a minute and a second later
  assert.equal((await login(s.base, 'super', DEMO_PASSWORD)).status, 200);
  s.close();
});

test('S10-3 hashes keep the old format at the old cost and use a stronger cost when asked; both verify', async () => {
  const old = hashPassword('Correct-Horse-Battery-9'); assert.ok(old.startsWith('s1$')); assert.equal(parseHash(old).logN, 14);
  await withEnv('FMC_SCRYPT_LOGN', '15', async () => {
    const strong = hashPassword('Correct-Horse-Battery-9'); assert.ok(strong.startsWith('s2$15$')); assert.equal(parseHash(strong).logN, 15);
    assert.ok(verifyPassword('Correct-Horse-Battery-9', strong)); assert.ok(!verifyPassword('wrong', strong));
    assert.ok(verifyPassword('Correct-Horse-Battery-9', old), 'an old hash still verifies');
    assert.equal(needsRehash(old), true); assert.equal(needsRehash(strong), false);
    assert.ok(await verifyPasswordAsync('Correct-Horse-Battery-9', strong)); assert.ok((await hashPasswordAsync('x-y-z-123456')).startsWith('s2$15$'));
  });
  assert.equal(needsRehash(old), false, 'at the default cost nothing needs upgrading');
  assert.equal(parseHash('garbage'), null); assert.equal(verifyPassword('x', 'garbage'), false);
});

test('S10-4 a correct sign-in upgrades an old hash; a wrong one does not; the demo-password check understands both formats', async () => {
  const db = openDb(':memory:'); seed(db); const s = await serve(db);
  await withEnv('FMC_SCRYPT_LOGN', '15', async () => {
    const before = db.prepare("SELECT pass_hash FROM users WHERE username='reception'").get().pass_hash; assert.ok(before.startsWith('s1$'));
    assert.equal((await login(s.base, 'reception', 'definitely-wrong-1')).status, 401);
    assert.equal(db.prepare("SELECT pass_hash FROM users WHERE username='reception'").get().pass_hash, before, 'unchanged by a wrong password');
    assert.equal((await login(s.base, 'reception', DEMO_PASSWORD)).status, 200);
    const after = db.prepare("SELECT pass_hash FROM users WHERE username='reception'").get().pass_hash; assert.ok(after.startsWith('s2$15$'), 'upgraded');
    assert.equal((await login(s.base, 'reception', DEMO_PASSWORD)).status, 200, 'and still works');
    assert.ok(demoPasswordAccounts(db).includes('reception'), 'the demo-password check reads the new format');
  });
  s.close();
});

test('S10-5 the idle sign-out can be set in minutes; 0 keeps using hours; invalid values are refused', async () => {
  const t = await boot(); try {
  const [admin, rec] = await Promise.all([t.login('admin'), t.login('reception')]);
  assert.equal((await rec.get('/api/me')).status, 200);
  assert.equal((await admin.patch('/api/config/settings', { session_idle_minutes: '2000' })).status, 400);
  assert.equal((await admin.patch('/api/config/settings', { session_idle_minutes: 'abc' })).status, 400);
  assert.equal((await rec.patch('/api/config/settings', { session_idle_minutes: '15' })).status, 403);
  assert.equal((await admin.patch('/api/config/settings', { session_idle_minutes: '15' })).status, 200);
  clock.offsetMs += 10 * 60e3; try { assert.equal((await rec.get('/api/me')).status, 200, '10 minutes idle: still signed in'); } finally { clock.offsetMs -= 10 * 60e3; }
  clock.offsetMs += 26 * 60e3; try { assert.equal((await rec.get('/api/me')).status, 401, '16 minutes since the last request: signed out'); } finally { clock.offsetMs -= 26 * 60e3; }
  const rec2 = await t.login('reception'); await admin.patch('/api/config/settings', { session_idle_minutes: '0' });
  clock.offsetMs += 60 * 60e3; try { assert.equal((await rec2.get('/api/me')).status, 200, 'minutes off: the hours setting (12 h) applies'); } finally { clock.offsetMs -= 60 * 60e3; }
  const r = (await admin.get('/api/security/readiness')).body.checks.find((c) => c.id === 'session_policy'); assert.match(r.detail, /12 h/);
  await admin.patch('/api/config/settings', { session_idle_minutes: '30' });
  assert.match((await admin.get('/api/security/readiness')).body.checks.find((c) => c.id === 'session_policy').detail, /30 min/);
  } finally { t.close(); }
});
