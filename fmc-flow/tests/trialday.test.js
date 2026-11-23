// Trial-day dry run (stage S15): executes docs/pilot/TRIAL_DAY_SCRIPT.md step by step through the API and checks every "expected result" it promises.
// If a step in the script stops being true, this test fails — so the printed script can be trusted by the people running the trial.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boot } from './helpers.js';
import { clock } from '../server/ops.js';

let t, admin, sup, rec, pt1, ort, cfg;
const dept = (n) => cfg.departments.find((d) => d.name === n).id;
const code = (r) => r.body?.error?.code;
const GOOD = { chief_complaint: 'Right knee pain after a fall', diagnosis: 'Patellofemoral pain syndrome', cpt_code: 'TRIAL01', progress_note: 'Pain 6/10, range limited; exercise programme given' };
const S = {}; // state carried between steps, as in the real trial day

before(async () => {
  t = await boot({ autoClose: 1, gap: 0 });
  [admin, sup, rec, pt1, ort] = await Promise.all(['admin', 'super', 'reception', 'pt.one', 'dr.ort'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
});
after(() => t.close());

test('T0 the script exists in English and Arabic and lists every step this test runs', () => {
  const en = readFileSync(new URL('../../docs/pilot/TRIAL_DAY_SCRIPT.md', import.meta.url), 'utf8'); const ar = readFileSync(new URL('../../docs/pilot/TRIAL_DAY_SCRIPT_AR.md', import.meta.url), 'utf8');
  for (let i = 0; i <= 14; i++) { assert.ok(new RegExp(`\\|\\s*${i}\\s*\\|`).test(en), `English script has step ${i}`); assert.ok(new RegExp(`\\|\\s*${i}\\s*\\|`).test(ar), `Arabic script has step ${i}`); }
  assert.ok(/[؀-ۿ]{4,}/.test(ar));
});

test('T1 step 0 (administrator): an approved procedure code, emergency access switched on, idle sign-out in minutes', async () => {
  assert.equal((await admin.post('/api/config/cpt_codes', { code: 'TRIAL01', description: 'Trial procedure code', default_minutes: 5, department_id: dept('Physiotherapy') })).status, 201);
  assert.equal((await admin.patch('/api/config/settings', { break_glass_enabled: '1', session_idle_minutes: '30' })).status, 200);
  assert.ok((await admin.get('/api/security/readiness')).body.checks.length >= 15);
});

test('T2 step 1 (reception): register a walk-in and check them in; they get a queue number and appear in the queue', async () => {
  S.p1 = (await rec.post('/api/patients', { name: 'Trial Patient One', phone: '0501234567', dob: '1990-01-01', sex: 'M' })).body;
  const r = await rec.post('/api/registrations', { patient_id: S.p1.id, department_id: dept('Physiotherapy') }); assert.equal(r.status, 201);
  S.v1 = r.body.visit?.id ?? r.body.visit_id; assert.match(r.body.queue.display, /^P-?\d+/);
  assert.ok((await pt1.get('/api/queue')).body.entries.some((e) => e.visit_id === S.v1), 'visible to the clinician');
});

test('T3 step 2 (reception): book tomorrow’s appointment in the Daily Schedule; a double booking is refused with a clear conflict', async () => {
  const p2 = (await rec.post('/api/patients', { name: 'Trial Patient Two', phone: '0507654321' })).body; const day = '2030-03-05';
  const board = (await admin.get(`/api/schedule/board?date=${day}`)).body; const row = board.groups.find((g) => g.department_id === dept('Physiotherapy')).rows.find((r) => r.user_id === t.db.prepare("SELECT id FROM users WHERE username='pt.one'").get().id);
  const b = { patient_id: p2.id, department_id: dept('Physiotherapy'), row_id: row.id, date: day, time: '10:00', duration_minutes: 30 };
  assert.equal((await rec.post('/api/schedule/appointments', b)).status, 201);
  const clash = await rec.post('/api/schedule/appointments', { ...b, patient_id: (await rec.post('/api/patients', { name: 'Trial Patient Three' })).body.id }); assert.equal(clash.status, 409);
});

let sessionId;
test('T4 steps 3–4 (clinician): call next, room, enter, start a 5-minute treatment; the timer is running on Sessions', async () => {
  const c = await pt1.post('/api/queue/call-next', { department_id: dept('Physiotherapy') }); assert.equal(c.status, 200); assert.equal(c.body.visit_id, S.v1);
  const room = cfg.rooms.find((r) => r.code === 'PT-01'); assert.equal((await pt1.post(`/api/visits/${S.v1}/room`, { room_id: room.id })).status, 201); assert.equal((await pt1.post(`/api/visits/${S.v1}/room/enter`)).status, 200);
  const s = await pt1.post(`/api/visits/${S.v1}/sessions`, { service_id: cfg.services.find((x) => x.name === 'PT Treatment').id, planned_minutes: 5 }); assert.equal(s.status, 201, JSON.stringify(s.body));
  sessionId = s.body.id; const active = (await pt1.get('/api/sessions/active')).body.sessions.find((x) => x.id === sessionId); assert.ok(active && active.planned_minutes === 5);
});

test('T5 step 5 (clinician): documentation starts YELLOW 0/4 and turns ORANGE only when all four fields are saved', async () => {
  const d0 = (await pt1.get(`/api/sessions/${sessionId}/documentation`)).body; assert.equal(d0.schedule_status, 'YELLOW'); assert.equal(d0.status.completed, 0);
  assert.equal((await pt1.put(`/api/sessions/${sessionId}/documentation`, { chief_complaint: GOOD.chief_complaint, diagnosis: GOOD.diagnosis })).status, 200);
  assert.equal((await pt1.get(`/api/sessions/${sessionId}/documentation`)).body.schedule_status, 'YELLOW', 'two of four is still yellow');
  assert.equal((await pt1.put(`/api/sessions/${sessionId}/documentation`, GOOD)).status, 200);
  assert.equal((await pt1.get(`/api/sessions/${sessionId}/documentation`)).body.schedule_status, 'ORANGE');
});

test('T6 step 6: at the planned time the system stops the treatment and checks the patient out by itself, marked unverified', async () => {
  clock.advance(5 * 60e3 + 5000); try { assert.equal((await pt1.get('/api/sessions/active')).body.sessions.some((x) => x.id === sessionId), false, 'no longer running');
    const row = t.db.prepare('SELECT status,completion_kind,confirmed_at FROM treatment_sessions WHERE id=?').get(sessionId); assert.equal(row.status, 'COMPLETED'); assert.equal(row.completion_kind, 'AUTO'); assert.equal(row.confirmed_at, null, 'unverified until the clinician confirms');
    assert.ok(t.db.prepare('SELECT operational_checkout_at x FROM treatment_sessions WHERE id=?').get(sessionId).x, 'the patient is operationally checked out (separate from the clinician’s verified completion)');
  } finally { /* the clock stays advanced: later steps happen "after" the treatment */ }
});

test('T7 step 7 (reception): a patient who leaves before being called is marked no-show and disappears from the queue', async () => {
  const p = (await rec.post('/api/patients', { name: 'Trial Walkaway' })).body; const r = (await rec.post('/api/registrations', { patient_id: p.id, department_id: dept('Physiotherapy') })).body;
  const e = t.db.prepare('SELECT id FROM queue_entries WHERE visit_id=? ORDER BY id DESC').get(r.visit?.id ?? r.visit_id);
  assert.equal((await rec.post(`/api/queue/${e.id}/cancel`, { kind: 'NO_SHOW' })).status, 200); assert.ok(!(await pt1.get('/api/queue')).body.entries.some((x) => x.id === e.id));
});

test('T8 step 8: a correction needs a reason, the manager (not the clinician) approves it, and the original time is kept', async () => {
  const s0 = t.db.prepare('SELECT * FROM treatment_sessions WHERE id=?').get(sessionId);
  const req = await pt1.post('/api/corrections', { kind: 'SESSION_END', entity_id: sessionId, corrected_ts: new Date(Date.parse(s0.started_at) + 240e3).toISOString(), reason: 'Patient stopped early and left the bed' }); assert.equal(req.status, 201);
  assert.equal((await pt1.post(`/api/corrections/${req.body.id}/decision`, { approve: true })).status, 403);
  assert.equal((await sup.post(`/api/corrections/${req.body.id}/decision`, { approve: true, note: 'Checked with the clinician' })).status, 200);
  const s1 = t.db.prepare('SELECT ended_at, ended_at_corrected FROM treatment_sessions WHERE id=?').get(sessionId); assert.ok(s1.ended_at_corrected); assert.equal(s1.ended_at, s0.ended_at, 'original time untouched');
});

test('T9 step 9 (reception): fixing a typo keeps the old value in the history and never changes the EMR number', async () => {
  const r = await rec.patch(`/api/patients/${S.p1.id}`, { phone: '0501234568' }); assert.equal(r.status, 200); assert.equal(r.body.mrn, S.p1.mrn);
  const h = (await admin.get(`/api/patients/${S.p1.id}/changes`)).body; assert.equal(h[0].changes.phone.from, S.p1.phone); assert.equal(code(await rec.patch(`/api/patients/${S.p1.id}`, { mrn: 'EMR-999999' })), 'VALIDATION');
});

test('T10 step 10: a duplicate is reported by reception, proposed and approved by two different people, and search then shows the record kept', async () => {
  S.dup = (await rec.post('/api/patients', { name: 'Trial Patient Won', phone: '0501234568', dob: '1990-01-01', sex: 'M', confirm_duplicate: true })).body;
  assert.equal((await rec.post('/api/patients/flag-duplicate', { patient_id: S.p1.id, other_patient_id: S.dup.id, reason: 'Same phone, similar name' })).status, 201);
  const prop = await sup.post('/api/patients/links', { duplicate_id: S.dup.id, survivor_id: S.p1.id, reason: 'Same person registered twice at the desk' }); assert.equal(prop.status, 201);
  assert.equal(code(await sup.post(`/api/patients/links/${prop.body.id}/approve`, {})), 'SAME_PERSON');
  assert.equal((await admin.post(`/api/patients/links/${prop.body.id}/approve`, { note: 'ok' })).status, 200);
  const found = (await rec.get(`/api/patients?q=${encodeURIComponent(S.dup.mrn)}`)).body; assert.equal(found[0].mrn, S.p1.mrn); assert.deepEqual(found[0].also_known_as, [S.dup.mrn]);
});

test('T11 step 12: forgot password — the person asks, the administrator issues a temporary one, the person must choose their own', async () => {
  const ask = await fetch(`${t.base}/api/recovery-request`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: JSON.stringify({ username: 'reception' }) }); assert.equal(ask.status, 202);
  const req = (await admin.get('/api/security/recovery-requests')).body.requests.find((r) => r.username === 'reception' && r.status === 'PENDING');
  assert.equal((await admin.post(`/api/security/recovery-requests/${req.id}/resolve`, { action: 'reset', temporary_password: 'Trial-Temp-Pass-2026' })).status, 200);
  const login = await fetch(`${t.base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'reception', password: 'Trial-Temp-Pass-2026' }) }); assert.equal((await login.json()).user.must_change_password, 1);
});

test('T12 step 13: emergency access from another department is read-only, reasoned, alerted, and reviewed by the administrator', async () => {
  const none = await ort.get(`/api/visits/${S.v1}/timeline`); assert.equal(none.status, 403);
  const g = await ort.post('/api/break-glass', { mrn: S.p1.mrn, reason: 'Patient unwell in the corridor, need history' }); assert.equal(g.status, 201);
  assert.equal((await ort.get(`/api/visits/${S.v1}/timeline`)).status, 200); assert.notEqual((await ort.put(`/api/sessions/${sessionId}/documentation`, { progress_note: 'x' })).status, 200, 'read-only');
  assert.ok((await admin.get('/api/security/alerts')).body.alerts.some((a) => a.kind === 'BREAK_GLASS_USED'));
  const grant = (await admin.get('/api/security/break-glass')).body.grants[0]; assert.equal((await admin.post(`/api/security/break-glass/${grant.id}/review`, { outcome: 'JUSTIFIED', note: 'Trial rehearsal' })).status, 200);
});

test('T13 step 14 (administrator): the audit log verifies and the readiness report is available', async () => {
  const chain = (await admin.get('/api/security/audit-chain')).body; assert.equal(chain.ok, true); assert.ok(chain.rows > 20);
  const r = (await admin.get('/api/security/readiness')).body; assert.ok(r.summary.ok + r.summary.warn + r.summary.fail === r.checks.length);
});
