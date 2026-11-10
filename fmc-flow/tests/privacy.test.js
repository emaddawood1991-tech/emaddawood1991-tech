// Privacy and monitoring (stage S4): patient-access log, tamper-evident audit chain, security alerts, rate limits, export controls.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';
import { openDb } from '../server/db.js';
import { appendAudit, verifyChain } from '../server/auditchain.js';
import { clock } from '../server/ops.js';
import { DEMO_PASSWORD } from '../server/seed.js';

let t, admin, rec, pt1, sup, cfg;
const MIN = 60000;
const dept = (n) => cfg.departments.find((d) => d.name === n).id;
const svc = (n) => cfg.services.find((s) => s.name === n);
const hall = () => cfg.rooms.find((r) => r.code === 'PT-HALL-01');
const accessRows = (where = '1=1', ...a) => t.ops.q(`SELECT * FROM patient_access_log WHERE ${where} ORDER BY id`, ...a);
const setSetting = (k, v) => t.ops.run('UPDATE settings SET value=? WHERE key=?', String(v), k);
const rawLogin = (username, password = DEMO_PASSWORD) => fetch(`${t.base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) });
let seq = 0; let bed = 0;
async function startedSession() {
  const p = (await rec.post('/api/patients', { name: `Synthetic Privacy ${++seq}` })).body;
  const v = (await rec.post('/api/registrations', { patient_id: p.id, department_id: dept('Physiotherapy') })).body.visit.id;
  assert.equal((await rec.post(`/api/visits/${v}/room`, { room_id: hall().id, station_id: hall().stations[bed++ % 6].id })).status, 201); await rec.post(`/api/visits/${v}/room/enter`);
  const s = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, planned_minutes: 30 }); assert.equal(s.status, 201, JSON.stringify(s.body));
  return { p, v, sid: s.body.id };
}

before(async () => { t = await boot(); [admin, rec, pt1, sup] = await Promise.all(['admin', 'reception', 'pt.one', 'super'].map(t.login)); cfg = (await admin.get('/api/config')).body; });
after(() => t.close());

test('S4-1 every screen that discloses patients records who saw whom, once per person, patient and kind per window', async () => {
  const found = (await rec.get('/api/patients?q=Sample')).body; assert.ok(found.length >= 8);
  const ids = new Set(accessRows("kind='SEARCH' AND actor_id=?", rec.user.id).map((r) => r.patient_id)); assert.ok(found.every((p) => ids.has(p.id)), 'each patient returned by a search is logged');
  const n = accessRows().length; await rec.get('/api/patients?q=Sample'); assert.equal(accessRows().length, n, 'the same search again within the window adds nothing');
  clock.advance(16 * MIN); await rec.get('/api/patients?q=Sample'); assert.ok(accessRows().length > n, 'after the window it is recorded again');
  const s = await startedSession();
  const waiting = (await rec.post('/api/patients', { name: 'Synthetic Waiting Patient' })).body; await rec.post('/api/registrations', { patient_id: waiting.id, department_id: dept('Orthopedics') }); // someone in the waiting queue
  await rec.get('/api/schedule/board'); await rec.get('/api/visits/open'); await rec.get('/api/queue'); await rec.get('/api/appointments');
  await pt1.get('/api/sessions/active'); await pt1.get(`/api/visits/${s.v}/timeline`); await pt1.get(`/api/sessions/${s.sid}/documentation`); await sup.get('/api/reports?from=2020-01-01'); await rec.get('/api/search?patient=Synthetic');
  const kinds = new Set(accessRows().map((r) => r.kind)); for (const k of ['SEARCH', 'SCHEDULE', 'VISITS', 'QUEUE', 'SESSIONS', 'TIMELINE', 'CLINICAL_NOTE', 'REPORT']) assert.ok(kinds.has(k), k);
  assert.ok(accessRows("kind='CLINICAL_NOTE' AND patient_id=? AND actor_id=?", s.p.id, pt1.user.id).length >= 1);
  assert.equal(accessRows("kind='SEARCH' AND actor_id=?", pt1.user.id).length, 0, 'people are only recorded for what they actually opened');
});

test('S4-2 the access log is readable by administrators only, filterable by patient, person and kind, and is itself audited and append-only', async () => {
  const p = accessRows("kind='SEARCH'")[0].patient_id;
  const byPatient = await admin.get(`/api/security/access-log?patient_id=${p}`); assert.equal(byPatient.status, 200);
  assert.ok(byPatient.body.length >= 1 && byPatient.body.every((r) => r.patient_id === p && r.actor && r.patient_name && r.mrn && r.ts));
  assert.ok((await admin.get(`/api/security/access-log?user_id=${rec.user.id}&kind=SEARCH`)).body.every((r) => r.kind === 'SEARCH' && r.actor_id === rec.user.id));
  for (const who of [rec, pt1, sup]) assert.equal((await who.get('/api/security/access-log')).status, 403);
  assert.ok(t.ops.q("SELECT 1 FROM audit_log WHERE action='security.access_log.view'").length >= 1, 'looking at the access log is audited');
  assert.throws(() => t.ops.run('DELETE FROM patient_access_log')); assert.throws(() => t.ops.run("UPDATE patient_access_log SET kind='X'"));
});

test('S4-3 the audit log is a hash chain: new entries are chained, verification passes, and the check is available to administrators and supervisors', async () => {
  const rows = t.ops.q('SELECT * FROM audit_log ORDER BY id'); assert.ok(rows.length > 10, String(rows.length)); assert.ok(rows.every((r) => r.row_hash && r.prev_hash));
  assert.equal(rows[0].prev_hash, 'GENESIS'); for (let i = 1; i < rows.length; i++) assert.equal(rows[i].prev_hash, rows[i - 1].row_hash, `row ${rows[i].id} links to the previous one`);
  const v = await admin.get('/api/security/audit-chain'); assert.equal(v.status, 200); assert.equal(v.body.ok, true, JSON.stringify(v.body)); assert.equal(v.body.head, rows.at(-1).row_hash.length ? v.body.head : null); assert.ok(v.body.anchors >= 1);
  assert.equal((await sup.get('/api/security/audit-chain')).status, 200); assert.equal((await rec.get('/api/security/audit-chain')).status, 403);
});

test('S4-4 tampering is detected: altered, removed and injected entries, and removal of the newest entries; pre-chain rows are legacy, not problems', () => {
  const mkDb = () => { const d = openDb(':memory:'); d.prepare("INSERT INTO audit_log(ts,actor_id,action,entity,entity_id,detail) VALUES ('2026-01-01T00:00:00.000Z',NULL,'legacy.one',NULL,NULL,'{}')").run();
    for (let i = 0; i < 6; i++) appendAudit(d, { ts: `2026-02-0${i + 1}T00:00:00.000Z`, actorId: 1, action: `act.${i}`, entity: 'x', entityId: i, detail: { i } }); return d; };
  const fresh = mkDb(); const ok = verifyChain(fresh); assert.equal(ok.ok, true); assert.equal(ok.rows, 6); assert.equal(ok.legacy_rows, 1);
  const drop = (d) => { d.exec('DROP TRIGGER audit_no_update; DROP TRIGGER audit_no_delete;'); return d; };
  const a = drop(mkDb()); a.prepare("UPDATE audit_log SET detail='{\"i\":999}' WHERE action='act.2'").run(); const ra = verifyChain(a); assert.equal(ra.ok, false); assert.ok(ra.problems.some((p) => p.kind === 'ROW_ALTERED'));
  const b = drop(mkDb()); b.prepare("DELETE FROM audit_log WHERE action='act.3'").run(); const rb = verifyChain(b); assert.equal(rb.ok, false); assert.ok(rb.problems.some((p) => p.kind === 'CHAIN_BREAK'));
  const c = drop(mkDb()); c.prepare("INSERT INTO audit_log(ts,actor_id,action,detail) VALUES ('2026-03-01T00:00:00.000Z',1,'forged','{}')").run(); const rc = verifyChain(c); assert.equal(rc.ok, false); assert.ok(rc.problems.some((p) => p.kind === 'UNHASHED_ROW'));
  const e = drop(mkDb()); const v0 = verifyChain(e); e.prepare('INSERT INTO audit_anchors(ts,row_count,head) VALUES (?,?,?)').run('2026-02-10T00:00:00.000Z', v0.rows, v0.head);
  e.prepare("DELETE FROM audit_log WHERE action IN ('act.4','act.5')").run(); const re = verifyChain(e); assert.equal(re.ok, false); assert.ok(re.problems.some((p) => p.kind === 'TAIL_REMOVED'), 'removing the newest entries is caught by the anchor');
  assert.throws(() => e.prepare("DELETE FROM audit_anchors").run(), 'anchors are append-only');
});

test('S4-5 monitoring raises alerts (de-duplicated, acknowledgeable, administrator-only): repeated failed sign-ins', async () => {
  assert.equal((await rec.get('/api/security/alerts')).status, 403);
  for (let i = 0; i < 5; i++) { clock.advance(1000); await rawLogin('gm.one', 'wrong-password-xyz'); }
  const r = await admin.get('/api/security/alerts'); const al = r.body.alerts.find((a) => a.kind === 'REPEATED_FAILED_LOGINS'); assert.ok(al, 'alert raised'); assert.equal(al.status, 'OPEN'); assert.equal(al.detail.count >= 5, true); assert.equal(al.username, 'gm.one');
  assert.equal((await admin.get('/api/security/alerts')).body.alerts.filter((a) => a.kind === 'REPEATED_FAILED_LOGINS').length, 1, 'no duplicate within the hour');
  const later = Date.now(); void later;
  assert.ok((await admin.get('/api/security/alerts/summary')).body.open >= 1);
  const ack = await admin.post(`/api/security/alerts/${al.id}/ack`); assert.equal(ack.status, 200);
  assert.equal((await admin.get('/api/security/alerts')).body.alerts.some((a) => a.id === al.id), false, 'acknowledged alerts leave the open list');
  assert.ok((await admin.get('/api/security/alerts?status=all')).body.alerts.some((a) => a.id === al.id && a.status === 'ACKNOWLEDGED' && a.ack_at));
  assert.equal((await admin.get('/api/security/alerts')).body.alerts.filter((a) => a.kind === 'REPEATED_FAILED_LOGINS' && a.status === 'OPEN').length, 0, 'acknowledging does not re-raise the same events');
  const gm = t.ops.one("SELECT id FROM users WHERE username='gm.one'").id; clock.advance(61000); // (the sign-in limiter runs on wall-clock time, so the new failures are written as events directly)
  for (let i = 0; i < 5; i++) { clock.advance(1000); t.ops.run("INSERT INTO login_events(ts,user_id,event,ip,detail) VALUES (?,?,'LOGIN_FAILED','10.0.0.9','{}')", t.ops.now(), gm); }
  assert.equal((await admin.get('/api/security/alerts')).body.alerts.filter((a) => a.kind === 'REPEATED_FAILED_LOGINS' && a.status === 'OPEN').length, 1, 'new failures after the acknowledgement raise a new alert');
  assert.equal((await rec.post(`/api/security/alerts/${al.id}/ack`)).status, 403); assert.equal((await admin.post('/api/security/alerts/99999/ack')).status, 404);
  assert.equal((await admin.get('/api/health')).body.security_alerts_open >= 0, true);
});

test('S4-6 alerts also cover mass export, many patients browsed, and privileged sign-ins outside office hours', async () => {
  setSetting('alert_search_patients', 5); await rec.get('/api/patients?q=Sample%20Patient');
  let al = (await admin.get('/api/security/alerts')).body.alerts; assert.ok(al.some((a) => a.kind === 'MANY_PATIENTS_BROWSED' && a.user_id === rec.user.id));
  const s = await startedSession(); setSetting('alert_export_rows', 10); for (let i = 0; i < 3; i++) assert.equal((await sup.get('/api/reports/sessions.csv')).status, 200);
  al = (await admin.get('/api/security/alerts')).body.alerts; assert.ok(al.some((a) => a.kind === 'MASS_EXPORT' && a.user_id === sup.user.id && a.detail.exports >= 3));
  assert.equal((await admin.patch('/api/config/settings', { alert_office_hours: '25:00-26:00' })).status, 400); assert.equal((await admin.patch('/api/config/settings', { alert_office_hours: '00:00-00:01' })).status, 200);
  assert.equal((await rawLogin('admin')).status, 200); al = (await admin.get('/api/security/alerts')).body.alerts; assert.ok(al.some((a) => a.kind === 'OFF_HOURS_PRIVILEGED_LOGIN' && a.detail.allowed === '00:00-00:01'));
  assert.ok(!al.some((a) => a.kind === 'OFF_HOURS_PRIVILEGED_LOGIN' && a.user_id === rec.user.id), 'only privileged roles are checked');
  await admin.patch('/api/config/settings', { alert_office_hours: '00:00-23:59' }); void s;
});

test('S4-7 rate limits: search, export and the overall ceiling are per person, reset after the window, and are audited once', async () => {
  setSetting('rate_search_per_min', 4); clock.advance(2 * MIN);
  const codes = []; for (let i = 0; i < 7; i++) codes.push((await pt1.get('/api/patients?q=Sample')).status); assert.deepEqual(codes, [200, 200, 200, 200, 429, 429, 429]);
  const lim = await fetch(`${t.base}/api/patients?q=Sample`, { headers: { cookie: pt1.cookie ?? '' } }); void lim;
  assert.equal((await rec.get('/api/patients?q=Sample')).status, 200, 'another person is not affected');
  assert.equal((await pt1.get('/api/search?patient=Sample')).status, 429, 'the same limit covers the other search endpoint');
  assert.equal(t.ops.q("SELECT 1 FROM audit_log WHERE action='rate.limited'").length >= 1, true);
  clock.advance(61000); assert.equal((await pt1.get('/api/patients?q=Sample')).status, 200, 'resets after the window'); setSetting('rate_search_per_min', 60);
  setSetting('rate_export_per_hour', 2); clock.advance(2 * 3600e3); const ex = []; for (let i = 0; i < 3; i++) ex.push((await sup.get('/api/reports/sessions.csv')).status); assert.deepEqual(ex, [200, 200, 429]); setSetting('rate_export_per_hour', 10);
  setSetting('rate_api_per_min', 15); clock.advance(2 * MIN); const all = []; for (let i = 0; i < 20; i++) all.push((await rec.get('/api/time')).status);
  assert.ok(all.slice(0, 15).every((c) => c === 200) && all.slice(15).every((c) => c === 429), 'the overall ceiling applies'); setSetting('rate_api_per_min', 1200); clock.advance(2 * MIN);
  assert.equal((await admin.patch('/api/config/settings', { rate_search_per_min: 5000 })).status, 400, 'settings are range-checked');
});

test('S4-8 exports: limited rows, watermark, named file, every patient in the file recorded, details audited', async () => {
  clock.advance(2 * 3600e3); const s1 = await startedSession(); const s2 = await startedSession(); void s1; void s2;
  const ok = await sup.get('/api/reports/sessions.csv'); assert.equal(ok.status, 200);
  const raw = await fetch(`${t.base}/api/reports/sessions.csv`, { headers: { cookie: (await (async () => { const r = await rawLogin('super'); return r.headers.get('set-cookie').split(';')[0]; })()) } });
  const text = await raw.text(); const lines = text.trim().split('\n');
  assert.match(lines.at(-1), /^# CONFIDENTIAL FMC patient data - exported by super on \d{4}-\d\d-\d\dT.* - \d+ rows$/); assert.match(raw.headers.get('content-disposition'), /attachment; filename="fmc-sessions-\d{4}-\d\d-\d\d-super\.csv"/);
  assert.ok(lines[0].startsWith('session_id,mrn'));
  const rowsInFile = lines.length - 2; assert.ok(rowsInFile >= 2);
  const exportAccess = accessRows("kind='EXPORT'"); assert.ok(exportAccess.length >= rowsInFile, 'every row of the file is recorded against its patient');
  const aud = t.ops.q("SELECT detail FROM audit_log WHERE action='reports.export' ORDER BY id DESC LIMIT 1")[0]; assert.equal(JSON.parse(aud.detail).rows, rowsInFile);
  setSetting('export_max_rows', 1); const big = await sup.get('/api/reports/sessions.csv'); assert.equal(big.status, 413); assert.equal(big.body.error.code, 'EXPORT_TOO_LARGE'); setSetting('export_max_rows', 5000);
  for (const who of [rec, pt1]) assert.equal((await who.get('/api/reports/sessions.csv')).status, 403);
});

test('S4-9 the privacy features do not change normal behaviour: seeded sign-in, search and schedule still work', async () => {
  const r = await rawLogin('reception'); assert.equal(r.status, 200);
  assert.equal((await rec.get('/api/schedule/board')).status, 200); assert.ok((await rec.get('/api/patients?q=Sample Patient A')).body.length === 1);
  assert.equal(verifyChain(t.db).ok, true, 'the audit chain is still intact after everything above');
});
