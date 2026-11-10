// Security hardening (stage S1). Each test pins a finding from the security audit so it cannot silently return.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { boot } from './helpers.js';
import { openDb } from '../server/db.js';
import { DEMO_PASSWORD } from '../server/seed.js';

let t, admin, rec, pt1, ort, gm, sup, cfg;
const dept = (n) => cfg.departments.find((d) => d.name === n).id;
const rawLogin = (username, password = DEMO_PASSWORD, headers = {}) => fetch(`${t.base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify({ username, password }) });

before(async () => {
  t = await boot();
  [admin, rec, pt1, ort, gm, sup] = await Promise.all(['admin', 'reception', 'pt.one', 'dr.ort', 'gm.one', 'super'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
});
after(() => t.close());

test('S1-1 patient search is scoped to the user’s department; reception and administrators search everyone', async () => {
  const p = (await rec.post('/api/patients', { name: 'Scoped Probe Patient', phone: '0507771122' })).body;
  // not yet in any department → a physiotherapist cannot find them, reception can
  assert.equal((await pt1.get('/api/patients?q=Scoped Probe')).body.length, 0);
  assert.equal((await rec.get('/api/patients?q=Scoped Probe')).body.length, 1);
  assert.equal((await rec.get('/api/patients?q=0507771122')).body.length, 1, 'reception can still look up by phone');
  // checked in to physiotherapy → visible to physiotherapy only
  assert.equal((await rec.post('/api/registrations', { patient_id: p.id, department_id: dept('Physiotherapy') })).status, 201);
  assert.equal((await pt1.get('/api/patients?q=Scoped Probe')).body.length, 1);
  assert.equal((await pt1.get('/api/patients?q=0507771122')).body.length, 1);
  assert.equal((await gm.get('/api/patients?q=Scoped Probe')).body.length, 0, 'a general-medicine clinician cannot see another department’s patient');
  assert.equal((await gm.get('/api/patients?q=0507771122')).body.length, 0, '…nor look them up by phone');
  assert.equal((await ort.get(`/api/patients?q=${p.mrn}`)).body.length, 0, '…nor by EMR number');
  // an appointment in a department also makes the patient visible there
  const a = await rec.post('/api/appointments', { patient_id: (await rec.post('/api/patients', { name: 'Ortho Appointment Patient' })).body.id, department_id: dept('Orthopedics'), scheduled_at: new Date(Date.now() + 864e5).toISOString() });
  assert.equal(a.status, 201);
  assert.equal((await ort.get('/api/patients?q=Ortho Appointment')).body.length, 1);
  assert.equal((await admin.get('/api/patients?q=Ortho Appointment')).body.length, 1);
});

test('S1-2 no directory dumps: at least 3 characters, and typed wildcards are literal', async () => {
  for (const q of ['%', '%%%', '_', 'a', 'Sa']) assert.equal((await rec.get(`/api/patients?q=${encodeURIComponent(q)}`)).body.length, 0, `“${q}” returns nothing`);
  assert.equal((await rec.get(`/api/patients?q=${encodeURIComponent('%%%')}`)).status, 200);
  assert.equal((await rec.get(`/api/patients?q=${encodeURIComponent('S_m')}`)).body.length, 0, '_ is not a one-character wildcard');
  assert.ok((await rec.get('/api/patients?q=Sample')).body.length >= 8, 'a normal search still works');
  assert.ok((await rec.get('/api/patients?q=Sample%20Patient%20A')).body.length === 1);
});

test('S1-3 staff accounts: roles, departments, flags and usernames are validated (400, never 500)', async () => {
  const who = (await admin.get('/api/staff')).body.find((s) => s.username === 'pt.two');
  for (const bad of [{ role: 'wizard' }, { role: '' }, { department_id: 999 }, { active: 5 }, { schedule_override: 'yes' }, { name: '   ' }]) {
    const r = await admin.patch(`/api/config/staff/${who.id}`, bad); assert.equal(r.status, 400, JSON.stringify(bad)); assert.equal(r.body.error.code, 'VALIDATION');
  }
  const mk = (b) => admin.post('/api/config/staff', { username: 'new.user', name: 'New User', role: 'reception', password: 'Long-Enough-Pass1', ...b });
  assert.equal((await mk({ role: 'superuser' })).status, 400);
  assert.equal((await mk({ username: 'a b' })).status, 400);
  assert.equal((await mk({ username: 'x' })).status, 400);
  assert.equal((await mk({ department_id: 999 })).status, 400);
  assert.equal((await mk({ name: '' })).status, 400);
  assert.equal((await mk({})).status, 201);
  assert.equal((await admin.patch(`/api/config/staff/${who.id}`, { role: 'clinician', active: 1 })).status, 200, 'valid edits still work');
});

test('S1-4 the last active administrator cannot be disabled or demoted', async () => {
  const me = (await admin.get('/api/staff')).body.find((s) => s.username === 'admin');
  const dis = await admin.patch(`/api/config/staff/${me.id}`, { active: 0 }); assert.equal(dis.status, 409); assert.equal(dis.body.error.code, 'LAST_ADMIN');
  assert.equal((await admin.patch(`/api/config/staff/${me.id}`, { role: 'supervisor' })).status, 409);
  assert.equal(t.ops.one('SELECT active,role FROM users WHERE id=?', me.id).role, 'admin');
  // with a second administrator the first may be changed
  const second = await admin.post('/api/config/staff', { username: 'admin.two', name: 'Second Admin', role: 'admin', password: 'Another-Long-Pass1' });
  assert.equal(second.status, 201);
  assert.equal((await admin.patch(`/api/config/staff/${second.body.id}`, { active: 0 })).status, 200, 'the other administrator can be disabled while this one stays');
  assert.equal((await admin.patch(`/api/config/staff/${second.body.id}`, { active: 1 })).status, 200);
  assert.equal((await admin.patch(`/api/config/staff/${me.id}`, { name: 'System Admin (Demo)' })).status, 200, 'harmless edits are allowed');
});

test('S1-5 usernames and the override flag are visible to administrators only', async () => {
  for (const who of [rec, pt1, ort, sup]) {
    const s = (await who.get('/api/staff')).body; assert.ok(s.length > 5);
    assert.ok(s.every((x) => x.username === undefined && x.schedule_override === undefined && x.name), 'no usernames, no override flag');
  }
  const a = (await admin.get('/api/staff')).body; assert.ok(a.every((x) => typeof x.username === 'string' && x.schedule_override !== undefined));
  const me = (await pt1.get('/api/me')).body; assert.equal(me.user.username, 'pt.one', 'a user still sees their own username');
});

test('S1-6 security headers and transport hints', async () => {
  const h = (await fetch(`${t.base}/api/time`)).headers;
  assert.match(h.get('strict-transport-security'), /max-age=\d+/);
  assert.match(h.get('permissions-policy'), /camera=\(\)/);
  assert.equal(h.get('cross-origin-opener-policy'), 'same-origin'); assert.equal(h.get('cross-origin-resource-policy'), 'same-origin');
  assert.equal(h.get('cache-control'), 'no-store'); assert.equal(h.get('x-frame-options'), 'DENY'); assert.ok(h.get('content-security-policy')); assert.equal(h.get('x-powered-by'), null);
});

test('S1-7 login: unknown usernames take as long as real ones, and failed attempts never log what was typed', async () => {
  const time = async (u) => { const t0 = process.hrtime.bigint(); const r = await rawLogin(u, 'wrong-password-123', { 'x-forwarded-for': `10.9.${Math.floor(Math.random() * 200)}.1` }); assert.equal(r.status, 401); return Number(process.hrtime.bigint() - t0) / 1e6; };
  const known = []; const unknown = [];
  for (let i = 0; i < 4; i++) { known.push(await time('pt.one')); unknown.push(await time(`nobody${i}`)); }
  const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  assert.ok(med(unknown) > 10 && med(unknown) > med(known) * 0.4, `unknown ${med(unknown).toFixed(1)} ms vs known ${med(known).toFixed(1)} ms — password hashing runs for both`);
  const typedSecret = 'MyRealPassw0rd-typed-as-username';
  assert.equal((await rawLogin(typedSecret)).status, 401); assert.equal((await rawLogin('pt.one', 'bad-pass-xyz')).status, 401);
  const log = t.ops.q("SELECT entity_id, detail FROM audit_log WHERE action='login.failed'");
  assert.ok(log.length >= 8);
  assert.ok(!JSON.stringify(log).includes(typedSecret) && !JSON.stringify(log).includes('nobody'), 'typed usernames are not stored');
  assert.ok(log.some((r) => JSON.parse(r.detail).unknown_username === true), 'unknown attempts are still recorded (with length only)');
  assert.ok(log.some((r) => r.entity_id && JSON.parse(r.detail).unknown_username === undefined), 'attempts on real accounts reference the account id');
  assert.equal((await rawLogin('reception')).status, 200, 'the real password still works');
});

test('S1-8 login does not block the server while hashing', async () => {
  const t0 = Date.now();
  const logins = Array.from({ length: 10 }, (_, i) => rawLogin('pt.one', 'wrong-concurrent-pw', { 'x-forwarded-for': `10.8.${i}.1` }));
  await new Promise((r) => setTimeout(r, 5));
  const probe = Date.now(); await fetch(`${t.base}/api/time`); const waited = Date.now() - probe;
  await Promise.all(logins);
  assert.ok(waited < (Date.now() - t0) * 0.8 || waited < 60, `an unrelated request waited ${waited} ms while 10 logins hashed`);
});

test('S1-8b the lockout still works when guesses arrive in parallel', async () => {
  const codes = await Promise.all(Array.from({ length: 12 }, () => rawLogin('gm.one', 'wrong-parallel-guess', { 'x-forwarded-for': '198.51.100.5' }).then((r) => r.status)));
  assert.equal(codes.filter((c) => c === 401).length, 5, `only 5 guesses were evaluated: ${codes.join(',')}`);
  assert.equal(codes.filter((c) => c === 429).length, 7);
});

test('S1-9 behind a proxy the rate limiter sees the real client address only when FMC_TRUST_PROXY is set', async () => {
  process.env.FMC_TRUST_PROXY = '1';
  const p = await boot();
  try {
    const l = (ip, u = 'pt.one') => fetch(`${p.base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify({ username: u, password: 'wrong-wrong-wrong' }) });
    for (let i = 0; i < 6; i++) await l('203.0.113.7');
    assert.equal((await l('203.0.113.7')).status, 429, 'the abusive address is limited');
    assert.equal((await l('203.0.113.99')).status, 401, 'another client behind the same proxy is not');
  } finally { delete process.env.FMC_TRUST_PROXY; p.close(); }
});

test('S1-10 the database file and its WAL are private (mode 600)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fmc-perm-'));
  try {
    const f = join(dir, 'fmc.db'); writeFileSync(f, '', { mode: 0o644 });
    const db = openDb(f); db.prepare("INSERT INTO settings(key,value) VALUES ('perm_probe','1') ON CONFLICT(key) DO NOTHING").run(); db.close();
    const db2 = openDb(f); db2.prepare("UPDATE settings SET value='2' WHERE key='perm_probe'").run();
    for (const x of [f, `${f}-wal`, `${f}-shm`]) { try { assert.equal(statSync(x).mode & 0o077, 0, `${x} is not group/world accessible`); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
    db2.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
