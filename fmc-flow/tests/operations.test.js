// Operations security (stage S6): restore drill, off-host audit fingerprint, readiness report, HTTPS requirement.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDb } from '../server/db.js';
import { seed } from '../server/seed.js';
import { createApp } from '../server/app.js';
import { backup, drill, recordFingerprint, verifyFingerprints, runScheduled } from '../server/backup.js';
import { readiness } from '../server/readiness.js';
import { fingerprint, checkAgainst } from '../server/fingerprint.js';
import { rowHash } from '../server/auditchain.js';

const KEY = 'a1'.repeat(32);
function fresh() {
  const dir = mkdtempSync(join(tmpdir(), 'fmco-')); const dbPath = join(dir, 'live.db');
  const db = openDb(dbPath); seed(db); const { ops } = createApp({ db }); ops.audit({ id: 1, role: 'admin' }, 'test.one', 'x', 1); ops.audit({ id: 1, role: 'admin' }, 'test.two', 'x', 2);
  return { dir, dbPath, db, ops };
}

test('S6-1 a restore drill decrypts a backup, checks it and the audit chain, and records the result without touching the live database', () => {
  const { dir, dbPath, db } = fresh(); db.close();
  const bdir = join(dir, 'b'); backup({ dbPath, dir: bdir, key: KEY });
  const r = drill({ dbPath, dir: bdir, key: KEY });
  assert.equal(r.integrity, 'ok'); assert.equal(r.audit_chain_ok, true); assert.ok(r.audit_entries >= 2); assert.equal(r.patients, 8);
  const live = new DatabaseSync(dbPath);
  assert.match(live.prepare("SELECT note FROM backup_log WHERE note LIKE 'DRILL%' ORDER BY id DESC LIMIT 1").get().note, /^DRILL ok: 8 patients/);
  live.close();
  assert.throws(() => drill({ dbPath, dir: bdir, key: 'b'.repeat(64) }));
  const l2 = new DatabaseSync(dbPath); assert.match(l2.prepare("SELECT note FROM backup_log WHERE ok=0 ORDER BY id DESC LIMIT 1").get().note, /^DRILL FAILED/); l2.close();
});

test('S6-2 a drill fails when the backup holds a tampered audit log', () => {
  const { dir, dbPath, db } = fresh();
  db.exec('DROP TRIGGER IF EXISTS audit_no_update'); db.prepare("UPDATE audit_log SET detail='{\"forged\":true}' WHERE id=(SELECT MAX(id) FROM audit_log)").run(); db.close();
  const bdir = join(dir, 'b'); backup({ dbPath, dir: bdir, key: KEY });
  assert.throws(() => drill({ dbPath, dir: bdir, key: KEY }), /audit chain does not verify/);
});

test('S6-3 the off-host fingerprint detects a rewritten history that a recomputed hash chain would hide', () => {
  const { dir, dbPath, db } = fresh(); db.close();
  const file = join(dir, 'offhost', 'fp.log');
  const f1 = recordFingerprint({ dbPath, key: KEY, file }); assert.ok(f1.head && f1.mac && f1.chain_ok);
  assert.equal(verifyFingerprints(file, { dbPath, key: KEY })[0].ok, true);
  // more entries later: still matches, reports the newer ones
  let d = openDb(dbPath); const { ops } = createApp({ db: d }); ops.audit({ id: 1, role: 'admin' }, 'test.three', 'x', 3); d.close();
  const r = verifyFingerprints(file, { dbPath, key: KEY })[0]; assert.equal(r.ok, true); assert.equal(r.newer_entries, 1);
  // attacker with file access rewrites an old entry AND recomputes every later hash so the chain still verifies
  d = new DatabaseSync(dbPath); d.exec('DROP TRIGGER IF EXISTS audit_no_update');
  const rows = d.prepare('SELECT * FROM audit_log WHERE row_hash IS NOT NULL ORDER BY id').all(); let prev = 'GENESIS';
  rows.forEach((row, i) => { const detail = i === 0 ? '{"rewritten":true}' : row.detail; const nr = { ...row, detail }; const h = rowHash(prev, nr); d.prepare('UPDATE audit_log SET detail=?, prev_hash=?, row_hash=? WHERE id=?').run(detail, prev, h, row.id); prev = h; });
  d.exec('DELETE FROM audit_anchors'); d.close();
  const x = verifyFingerprints(file, { dbPath, key: KEY })[0];
  assert.equal(x.ok, false); assert.equal(x.reason, 'ENTRY_MISSING_OR_REWRITTEN');
});

test('S6-4 a forged or unreadable fingerprint line is refused', () => {
  const { db } = fresh();
  const f = fingerprint(db, Buffer.from(KEY, 'hex'));
  assert.equal(checkAgainst(db, JSON.stringify(f), Buffer.from(KEY, 'hex')).ok, true);
  assert.equal(checkAgainst(db, JSON.stringify({ ...f, entries: f.entries + 1 }), Buffer.from(KEY, 'hex')).reason, 'FINGERPRINT_FORGED_OR_WRONG_KEY');
  assert.equal(checkAgainst(db, JSON.stringify(f), Buffer.from('b'.repeat(64), 'hex')).reason, 'FINGERPRINT_FORGED_OR_WRONG_KEY');
  assert.equal(checkAgainst(db, 'not json').reason, 'UNREADABLE_LINE');
  assert.ok(!JSON.stringify(f).match(/patient|name|phone/i), 'the fingerprint carries no patient data');
});

test('S6-5 a scheduled run makes an encrypted backup, an off-site copy, a fingerprint and (when due) a drill', () => {
  const { dir, dbPath, db } = fresh(); db.close();
  process.env.FMC_FINGERPRINT_FILE = join(dir, 'fp', 'fp.log');
  try {
    const r = runScheduled({ dbPath, dir: join(dir, 'b'), key: KEY, offsiteDir: join(dir, 'offsite') });
    assert.ok(existsSync(r.backup)); assert.equal(r.offsite, true); assert.ok(existsSync(join(dir, 'offsite', r.backup.split('/').pop())));
    assert.ok(r.drill && r.drill.audit_chain_ok, 'first run has no drill on record, so one runs');
    assert.equal(readFileSync(process.env.FMC_FINGERPRINT_FILE, 'utf8').trim().split('\n').length, 1);
    assert.equal(runScheduled({ dbPath, dir: join(dir, 'b'), key: KEY, offsiteDir: join(dir, 'offsite') }).drill, undefined, 'a recent drill suppresses the next one');
  } finally { delete process.env.FMC_FINGERPRINT_FILE; }
});

test('S6-6 the readiness report separates configured, to-do and failing items and never claims compliance', () => {
  const { db } = fresh();
  const bare = readiness({ db, env: {}, reqSecure: false });
  const st = (id) => bare.checks.find((c) => c.id === id).status;
  assert.equal(st('https'), 'warn'); assert.equal(st('backup_key'), 'fail'); assert.equal(st('disk_encryption'), 'warn'); assert.equal(st('restore_drill'), 'warn');
  assert.match(bare.note, /Not a compliance certificate/);
  const full = readiness({ db, reqSecure: true, env: { FMC_REQUIRE_HTTPS: '1', FMC_TRUST_PROXY: '1', FMC_MFA_KEY: 'c'.repeat(64), FMC_BACKUP_KEY: 'd'.repeat(64), FMC_BACKUP_EVERY_HOURS: '24', FMC_BACKUP_OFFSITE_DIR: '/mnt/x', FMC_FINGERPRINT_FILE: '/mnt/y/fp.log', FMC_DISK_ENCRYPTED: '1' } });
  for (const id of ['https', 'require_https', 'trust_proxy', 'mfa_key', 'backup_key', 'keys_distinct', 'backup_scheduled', 'backup_offsite', 'disk_encryption']) assert.equal(full.checks.find((c) => c.id === id).status, 'ok', id);
  assert.equal(readiness({ db, env: { FMC_BACKUP_KEY: 'e'.repeat(64), FMC_MFA_KEY: 'e'.repeat(64) } }).checks.find((c) => c.id === 'keys_distinct').status, 'fail', 'one key for both purposes is refused');
  assert.equal(readiness({ db, env: { FMC_INSECURE_COOKIES: '1' } }).checks.find((c) => c.id === 'cookies').status, 'fail');
});

test('S6-7 the readiness endpoint is administrator-only and FMC_REQUIRE_HTTPS redirects plain HTTP', async () => {
  const { boot } = await import('./helpers.js');
  const t = await boot(); const [admin, sup] = await Promise.all(['admin', 'super'].map(t.login));
  assert.equal((await sup.get('/api/security/readiness')).status, 403);
  const r = (await admin.get('/api/security/readiness')).body; assert.ok(r.checks.length >= 12); assert.ok(r.summary.warn >= 1);
  t.close();
  process.env.FMC_REQUIRE_HTTPS = '1'; process.env.FMC_PUBLIC_HOST = 'flow.example.test';
  try {
    const t2 = await boot();
    const plain = await fetch(`${t2.base}/api/time?x=1`, { redirect: 'manual' }); assert.equal(plain.status, 308); assert.equal(plain.headers.get('location'), 'https://flow.example.test/api/time?x=1');
    t2.close();
  } finally { delete process.env.FMC_REQUIRE_HTTPS; delete process.env.FMC_PUBLIC_HOST; }
});
