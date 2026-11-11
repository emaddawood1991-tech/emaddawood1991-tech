// Go-live hardening (stage S9): no default credentials in production, first-administrator command, readiness checks, headers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { openDb } from '../server/db.js';
import { seed, seedCatalogOnly } from '../server/seed.js';
import { createAdmin } from '../server/create-admin.js';
import { demoPasswordAccounts, readiness } from '../server/readiness.js';
import { boot } from './helpers.js';

const run = (script, env, input) => spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', script], { env: { ...process.env, ...env }, encoding: 'utf8', input, timeout: 60000 });
const fresh = () => join(mkdtempSync(join(tmpdir(), 'fmch-')), 'live.db');

test('S9-1 production start creates the clinic catalog but no demo accounts or patients, and says an administrator is needed', async () => {
  const dbPath = fresh(); let out = '';
  const child = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'server/index.js'], { env: { ...process.env, NODE_ENV: 'production', FMC_DB: dbPath, PORT: '0', FMC_MFA_KEY: 'ab'.repeat(32), FMC_SEED: '' } });
  child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
  await new Promise((res, rej) => { const t0 = Date.now(); const iv = setInterval(() => { if (/FMC Patient Flow API/.test(out)) { clearInterval(iv); res(); } else if (Date.now() - t0 > 20000) { clearInterval(iv); rej(new Error('server did not start: ' + out)); } }, 100); });
  child.kill();
  assert.match(out, /no administrator yet/);
  const db = openDb(dbPath);
  assert.ok(db.prepare('SELECT COUNT(*) c FROM departments').get().c >= 6, 'departments exist');
  assert.equal(db.prepare('SELECT COUNT(*) c FROM users').get().c, 0, 'no users');
  assert.equal(db.prepare('SELECT COUNT(*) c FROM patients').get().c, 0, 'no patients');
  db.close();
});

test('S9-2 the demo accounts are detected, and a database without them is clean', () => {
  const db = openDb(':memory:'); seed(db);
  const names = demoPasswordAccounts(db); assert.ok(names.includes('admin') && names.length === 10);
  const r = readiness({ db, env: {} }); const c = r.checks.find((x) => x.id === 'demo_accounts'); assert.equal(c.status, 'fail'); assert.match(c.detail, /admin/);
  assert.ok(!JSON.stringify(r).includes('Demo-Passw0rd!'), 'the password itself is never shown');
  const clean = openDb(':memory:'); seedCatalogOnly(clean);
  assert.equal(readiness({ db: clean, env: {} }).checks.find((x) => x.id === 'demo_accounts').status, 'ok');
});

test('S9-3 create-admin makes a policy-checked administrator who must change the password, requires two-step, and is audited', () => {
  const db = openDb(':memory:'); seedCatalogOnly(db);
  assert.throws(() => createAdmin(db, { username: 'ab', name: 'X', password: 'Str0ng-Pass-Phrase-77' }), /3–40/);
  assert.throws(() => createAdmin(db, { username: 'owner', name: 'Owner One', password: 'short' }), /at least/);
  assert.throws(() => createAdmin(db, { username: 'owner', name: 'Owner One', password: 'owner-Owner-1234567' }), /username/);
  const r = createAdmin(db, { username: 'clinic.owner', name: 'Clinic Owner', password: 'Str0ng-Pass-Phrase-77' });
  const u = db.prepare('SELECT role,role_template,must_change_password,department_id,pass_hash FROM users WHERE id=?').get(r.id);
  assert.equal(u.role, 'admin'); assert.equal(u.role_template, 'super_admin'); assert.equal(u.must_change_password, 1); assert.equal(u.department_id, null);
  assert.ok(u.pass_hash.startsWith('s1$') && !u.pass_hash.includes('Str0ng'), 'stored as a salted hash');
  assert.equal(db.prepare("SELECT value FROM settings WHERE key='mfa_required_roles'").get().value, 'admin,supervisor'); assert.equal(r.mfaSet, true);
  assert.ok(db.prepare("SELECT 1 FROM audit_log WHERE action='admin.create'").get());
  assert.throws(() => createAdmin(db, { username: 'clinic.owner', name: 'Again', password: 'Str0ng-Pass-Phrase-78' }), /already exists/);
  assert.equal(readiness({ db, env: {} }).checks.find((x) => x.id === 'demo_accounts').status, 'ok', 'no demo password');
});
test('S9-4 create-admin never overwrites an existing two-step choice', () => {
  const db = openDb(':memory:'); seedCatalogOnly(db); db.prepare("UPDATE settings SET value='admin' WHERE key='mfa_required_roles'").run();
  assert.equal(createAdmin(db, { username: 'owner.two', name: 'Owner Two', password: 'Str0ng-Pass-Phrase-77' }).mfaSet, false);
  assert.equal(db.prepare("SELECT value FROM settings WHERE key='mfa_required_roles'").get().value, 'admin');
});
test('S9-5 the command-line tool works end to end with environment input', () => {
  const dbPath = fresh();
  const r = run('server/create-admin.js', { FMC_DB: dbPath, FMC_ADMIN_USERNAME: 'cli.admin', FMC_ADMIN_NAME: 'Cli Admin', FMC_ADMIN_PASSWORD: 'Str0ng-Pass-Phrase-77' });
  assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /created/); assert.match(r.stdout, /Two-step/);
  const bad = run('server/create-admin.js', { FMC_DB: dbPath, FMC_ADMIN_USERNAME: 'cli.two', FMC_ADMIN_NAME: 'Cli Two', FMC_ADMIN_PASSWORD: 'weak' });
  assert.notEqual(bad.status, 0); assert.match(bad.stderr, /at least/);
});
test('S9-6 the readiness report warns about long sessions and the CSP carries the extra directives', async () => {
  const db = openDb(':memory:'); seedCatalogOnly(db);
  const s = (id) => readiness({ db, env: {} }).checks.find((x) => x.id === id);
  assert.equal(s('session_policy').status, 'warn');
  db.prepare("UPDATE settings SET value='1' WHERE key='session_idle_hours'").run(); db.prepare("UPDATE settings SET value='12' WHERE key='session_absolute_hours'").run();
  assert.equal(s('session_policy').status, 'ok');
  const t = await boot(); const res = await fetch(`${t.base}/api/time`); const csp = res.headers.get('content-security-policy'); t.close();
  for (const d of ["base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"]) assert.ok(csp.includes(d), d);
});
