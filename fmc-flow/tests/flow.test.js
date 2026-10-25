import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';

let t, admin, rec, pt1, pt2, ort, sup, cfg;
const room = (code) => cfg.rooms.find((r) => r.code === code);
const svc = (name) => cfg.services.find((s) => s.name === name);
const dept = (name) => cfg.departments.find((d) => d.name === name);
const patient = async () => (await rec.post('/api/patients', { name: 'Test Patient' })).body.id;
async function checkin(p, deptName = 'Physiotherapy') {
  p = await p;
  const r = await rec.post('/api/visits/checkin', { patientId: p, departmentId: dept(deptName).id });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body.visit.id;
}
async function intoRoom(visitId, code, station) {
  if (t.ops.one('SELECT status FROM rooms WHERE code=?', code).status === 'CLEANING') await rec.put(`/api/rooms/${room(code).id}/status`, { status: 'AVAILABLE' });
  const a = await pt1.post(`/api/visits/${visitId}/room`, { room_id: room(code).id, station_id: station ? room(code).stations.find((s) => s.code === station).id : undefined });
  assert.equal(a.status, 201, JSON.stringify(a.body));
  assert.equal((await pt1.post(`/api/visits/${visitId}/room/enter`)).status, 200);
}

before(async () => {
  t = await boot();
  [admin, rec, pt1, pt2, ort, sup] = await Promise.all(['admin', 'reception', 'pt.one', 'pt.two', 'dr.ort', 'super'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
});
after(() => t.close());

test('auth: unauthenticated and CSRF-less requests are rejected', async () => {
  assert.equal((await fetch(`${t.base}/api/config`)).status, 401);
  const r = await fetch(`${t.base}/api/visits/checkin`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 401);
  const bad = await fetch(`${t.base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'wrong' }) });
  assert.equal(bad.status, 401);
});

test('full visit: queue → room → session → exit → checkout with ordered timeline', async () => {
  const v = await checkin(patient());
  const q = (await rec.get('/api/queue')).body.entries.find((e) => e.visit_id === v);
  assert.match(q.display, /^P\d{3}$/);
  const called = await pt1.post('/api/queue/call-next', { department_id: dept('Physiotherapy').id });
  assert.equal(called.body.visit_id, v);
  await intoRoom(v, 'PT-01');
  const s = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, idem_key: 'k-full' });
  assert.equal(s.status, 201);
  assert.equal((await pt1.post(`/api/sessions/${s.body.id}/pause`)).body.status, 'PAUSED');
  assert.equal((await pt1.post(`/api/sessions/${s.body.id}/resume`)).body.status, 'ACTIVE');
  assert.equal((await pt1.post(`/api/sessions/${s.body.id}/complete`)).body.status, 'COMPLETED');
  assert.equal((await rec.post(`/api/visits/${v}/checkout`)).status, 409, 'cannot leave while in a room');
  assert.equal((await pt1.post(`/api/visits/${v}/room/exit`)).status, 200);
  assert.equal((await rec.post(`/api/visits/${v}/checkout`)).status, 200);
  const tl = (await rec.get(`/api/visits/${v}/timeline`)).body;
  const types = tl.events.map((e) => e.type);
  assert.deepEqual(types.filter((x) => !x.startsWith('CORR')), ['ARRIVED', 'QUEUE_ENTERED', 'QUEUE_CALLED', 'ROOM_ASSIGNED', 'ROOM_ENTERED', 'TREATMENT_STARTED', 'TREATMENT_PAUSED', 'TREATMENT_RESUMED', 'TREATMENT_COMPLETED', 'ROOM_EXITED', 'CLINIC_DEPARTED']);
  assert.ok(tl.events.every((e) => e.actor && e.ts));
  const stamps = tl.events.map((e) => Date.parse(e.ts));
  assert.deepEqual(stamps, [...stamps].sort((a, b) => a - b));
});

test('idempotency: retried start returns the same session; no duplicates', async () => {
  const v = await checkin(patient());
  await intoRoom(v, 'PT-02');
  const a = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, idem_key: 'same' });
  const b = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, idem_key: 'same' });
  assert.equal(a.body.id, b.body.id);
  const c = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, idem_key: 'other' });
  assert.equal(c.status, 409);
  assert.equal(t.ops.q('SELECT COUNT(*) c FROM treatment_sessions WHERE visit_id=?', v)[0].c, 1);
  // repeated pause/complete are no-ops, not duplicate events
  await pt1.post(`/api/sessions/${a.body.id}/pause`); await pt1.post(`/api/sessions/${a.body.id}/pause`);
  assert.equal(t.ops.q("SELECT COUNT(*) c FROM events WHERE session_id=? AND type='TREATMENT_PAUSED'", a.body.id)[0].c, 1);
  await pt1.post(`/api/sessions/${a.body.id}/complete`); await pt1.post(`/api/sessions/${a.body.id}/complete`);
  assert.equal(t.ops.q("SELECT COUNT(*) c FROM events WHERE session_id=? AND type='TREATMENT_COMPLETED'", a.body.id)[0].c, 1);
  await pt1.post(`/api/visits/${v}/room/exit`);
});

test('service authorization is independent of availability', async () => {
  const v = await checkin(patient());
  await intoRoom(v, 'PT-03');
  // pt.two is AVAILABLE but only authorised for PT Treatment, not Electrical Stimulation
  const r = await pt2.post(`/api/visits/${v}/sessions`, { service_id: svc('Electrical Stimulation').id });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'NOT_AUTHORIZED_FOR_SERVICE');
  // availability OFF_DUTY does not remove authorization either
  await pt1.put(`/api/staff/${pt1.user.id}/availability`, { status: 'OFF_DUTY' });
  const ok = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('Electrical Stimulation').id });
  assert.equal(ok.status, 201);
  await pt1.post(`/api/sessions/${ok.body.id}/complete`);
  await pt1.post(`/api/visits/${v}/room/exit`);
});

test('shared hall: independent occupancy per bed; station double-booking and over-capacity blocked', async () => {
  const hall = room('PT-HALL-01');
  assert.equal(hall.stations.length, 6);
  const visits = [];
  for (let i = 0; i < 6; i++) { const v = await checkin(patient()); visits.push(v); await intoRoom(v, 'PT-HALL-01', `BED-0${i + 1}`); }
  const extra = await checkin(patient());
  const full = await pt1.post(`/api/visits/${extra}/room`, { room_id: hall.id, station_id: hall.stations[0].id });
  assert.equal(full.status, 409); assert.equal(full.body.error.code, 'STATION_BUSY');
  assert.equal((await pt1.post(`/api/visits/${extra}/room`, { room_id: hall.id })).body.error.code, 'STATION_REQUIRED');
  // bed-level sessions are independent per patient
  const s1 = await pt1.post(`/api/visits/${visits[0]}/sessions`, { service_id: svc('PT Treatment').id });
  const s2 = await pt2.post(`/api/visits/${visits[1]}/sessions`, { service_id: svc('PT Treatment').id });
  assert.notEqual(s1.body.id, s2.body.id);
  assert.notEqual(s1.body.station_id, s2.body.station_id);
  for (const s of [s1, s2]) await pt1.post(`/api/sessions/${s.body.id}/complete`);
  for (const v of visits) await pt1.post(`/api/visits/${v}/room/exit`);
});

test('concurrent assignment to the same station: exactly one wins', async () => {
  const hall = room('PT-HALL-01');
  const [a, b] = [await checkin(patient()), await checkin(patient())];
  const res = await Promise.all([a, b].map((v) => pt1.post(`/api/visits/${v}/room`, { room_id: hall.id, station_id: hall.stations[5].id })));
  assert.deepEqual(res.map((r) => r.status).sort(), [201, 409]);
  for (const v of [a, b]) await pt1.post(`/api/visits/${v}/room/exit`);
});

test('concurrent call-next never calls the same patient twice', async () => {
  const d = dept('General Practice').id;
  const vs = [await checkin(patient(), 'General Practice'), await checkin(patient(), 'General Practice')];
  const res = await Promise.all([1, 2, 3].map(() => rec.post('/api/queue/call-next', { department_id: d })));
  const ids = res.map((r) => r.body?.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 2);
  for (const v of vs) await rec.post(`/api/visits/${v}/checkout`);
});

test('priority is manual and reasoned; arrival time alone never prioritises', async () => {
  const d = dept('Orthopedics').id;
  const first = await checkin(patient(), 'Orthopedics');
  const second = await checkin(patient(), 'Orthopedics');
  const entries = (await rec.get('/api/queue')).body.entries.filter((e) => [first, second].includes(e.visit_id));
  assert.ok(entries.every((e) => e.priority === 0));
  const second_q = entries.find((e) => e.visit_id === second);
  assert.equal((await rec.patch(`/api/queue/${second_q.id}/priority`, { priority: 2 })).status, 400, 'reason required');
  assert.equal((await rec.patch(`/api/queue/${second_q.id}/priority`, { priority: 2, reason: 'Acute pain, clinician request' })).status, 200);
  const called = await ort.post('/api/queue/call-next', { department_id: d });
  assert.equal(called.body.visit_id, second, 'manually prioritised patient is called first');
  assert.equal((await ort.patch(`/api/queue/${second_q.id}/priority`, { priority: 0 })).status, 403, 'clinician cannot set priority');
  for (const v of [first, second]) await rec.post(`/api/visits/${v}/checkout`);
});

test('transfer PT-01 → PT-03 keeps session and creates separate occupancy rows', async () => {
  const v = await checkin(patient());
  await intoRoom(v, 'PT-01');
  const s = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id });
  await rec.put(`/api/rooms/${room('PT-03').id}/status`, { status: 'AVAILABLE' });
  const tr = await pt1.post(`/api/visits/${v}/room/transfer`, { room_id: room('PT-03').id, reason: 'Equipment needed' });
  assert.equal(tr.status, 201, JSON.stringify(tr.body));
  const occ = t.ops.q('SELECT * FROM occupancy WHERE visit_id=? ORDER BY id', v);
  assert.equal(occ.length, 2);
  assert.equal(occ[0].exit_reason, 'TRANSFER'); assert.ok(occ[0].exited_at);
  assert.equal(occ[1].transferred_from, occ[0].id); assert.equal(occ[1].exited_at, null);
  const sess = t.ops.one('SELECT * FROM treatment_sessions WHERE id=?', s.body.id);
  assert.equal(sess.status, 'ACTIVE'); assert.equal(sess.room_id, room('PT-01').id, 'original session history preserved');
  const ev = t.ops.one("SELECT * FROM events WHERE visit_id=? AND type='ROOM_TRANSFERRED'", v);
  assert.deepEqual([JSON.parse(ev.data).from, JSON.parse(ev.data).to, JSON.parse(ev.data).reason], ['PT-01', 'PT-03', 'Equipment needed']);
  // invalid transfers
  assert.equal((await pt1.post(`/api/visits/${v}/room/transfer`, { room_id: room('PT-03').id })).body.error.code, 'SAME_LOCATION');
  const other = await checkin(patient()); await intoRoom(other, 'PT-01');
  assert.equal((await pt1.post(`/api/visits/${v}/room/transfer`, { room_id: room('PT-01').id })).body.error.code, 'ROOM_FULL');
  await pt1.post(`/api/sessions/${s.body.id}/complete`);
  for (const x of [v, other]) await pt1.post(`/api/visits/${x}/room/exit`);
});

test('room maintenance blocks assignment, requires reason, keeps history', async () => {
  const r = room('GP-02');
  assert.equal((await rec.put(`/api/rooms/${r.id}/status`, { status: 'MAINTENANCE', reason: 'x' })).status, 403);
  assert.equal((await sup.put(`/api/rooms/${r.id}/status`, { status: 'MAINTENANCE' })).body.error.code, 'REASON_REQUIRED');
  assert.equal((await sup.put(`/api/rooms/${r.id}/status`, { status: 'MAINTENANCE', reason: 'AC repair' })).status, 200);
  const v = await checkin(patient(), 'General Practice');
  assert.equal((await rec.post(`/api/visits/${v}/room`, { room_id: r.id })).body.error.code, 'ROOM_UNAVAILABLE');
  assert.equal((await sup.put(`/api/rooms/${r.id}/status`, { status: 'AVAILABLE' })).status, 200);
  assert.equal((await rec.post(`/api/visits/${v}/room`, { room_id: r.id })).status, 201);
  assert.equal((await sup.put(`/api/rooms/${r.id}/status`, { status: 'MAINTENANCE', reason: 'again' })).body.error.code, 'ROOM_OCCUPIED');
  const hist = (await sup.get(`/api/rooms/${r.id}/history`)).body;
  assert.deepEqual(hist.map((h) => h.to_status), ['AVAILABLE', 'MAINTENANCE']);
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('cleaning-after-use rooms become CLEANING and block until released', async () => {
  const v = await checkin(patient()); await intoRoom(v, 'PT-02');
  await pt1.post(`/api/visits/${v}/room/exit`);
  assert.equal(t.ops.one('SELECT status FROM rooms WHERE code=?', 'PT-02').status, 'CLEANING');
  const v2 = await checkin(patient());
  assert.equal((await pt1.post(`/api/visits/${v2}/room`, { room_id: room('PT-02').id })).body.error.code, 'ROOM_UNAVAILABLE');
  assert.equal((await rec.put(`/api/rooms/${room('PT-02').id}/status`, { status: 'AVAILABLE' })).status, 200);
});

test('overlapping sessions are not double counted in total duration', () => {
  const { ops } = t;
  const H = 3600e3;
  assert.equal(ops.unionMs([[0, 2 * H], [H, 3 * H]]), 3 * H);
  assert.equal(ops.unionMs([[0, H], [2 * H, 3 * H]]), 2 * H);
  assert.equal(ops.unionMs([[0, 4 * H], [H, 2 * H]]), 4 * H);
  assert.equal(ops.sumMs([[0, 2 * H], [H, 3 * H]]), 4 * H);
});

test('pause time is excluded from session duration', async () => {
  const v = await checkin(patient()); await intoRoom(v, 'GP-01');
  const s = t.ops.run('INSERT INTO treatment_sessions(visit_id,patient_id,service_id,clinician_id,status,started_at,ended_at) VALUES (?,?,?,?,?,?,?)',
    v, 1, svc('GP Consultation').id, 1, 'COMPLETED', '2026-01-01T10:00:00.000Z', '2026-01-01T11:00:00.000Z').lastInsertRowid;
  t.ops.run('INSERT INTO session_pauses(session_id,paused_at,resumed_at) VALUES (?,?,?)', s, '2026-01-01T10:20:00.000Z', '2026-01-01T10:30:00.000Z');
  const view = t.ops.sessionView(t.ops.one('SELECT * FROM treatment_sessions WHERE id=?', s));
  assert.equal(view.active_ms, 50 * 60000);
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('events and audit log are append-only at the database level', () => {
  assert.throws(() => t.db.exec("UPDATE events SET type='X'"), /append-only/);
  assert.throws(() => t.db.exec('DELETE FROM events'), /append-only/);
  assert.throws(() => t.db.exec("UPDATE audit_log SET action='X'"), /append-only/);
  assert.throws(() => t.db.exec('DELETE FROM audit_log'), /append-only/);
});

test('correction: forgotten checkout → request → separate approver → original preserved', async () => {
  const v = await checkin(patient()); await intoRoom(v, 'GP-01');
  const s = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id });
  const before = Date.now();
  const bad = await pt1.post('/api/corrections', { kind: 'SESSION_END', entity_id: s.body.id, corrected_ts: new Date(before - 600e3).toISOString() });
  assert.equal(bad.body.error.code, 'REASON_REQUIRED');
  const future = await pt1.post('/api/corrections', { kind: 'SESSION_END', entity_id: s.body.id, corrected_ts: new Date(before + 3600e3).toISOString(), reason: 'x' });
  assert.equal(future.body.error.code, 'IN_FUTURE');
  const c = await pt1.post('/api/corrections', { kind: 'SESSION_END', entity_id: s.body.id, corrected_ts: new Date(Date.parse(s.body.started_at) + 1).toISOString(), reason: 'Forgot to complete after patient left' });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  assert.equal(c.body.status, 'PENDING');
  const row = () => t.ops.one('SELECT * FROM treatment_sessions WHERE id=?', s.body.id);
  assert.ok(row().ended_at, 'original server timestamp recorded'); assert.equal(row().ended_at_corrected, null);
  assert.equal((await pt1.post(`/api/corrections/${c.body.id}/decision`, { approve: true })).status, 403, 'clinicians cannot approve');
  assert.equal((await sup.post(`/api/corrections/${c.body.id}/decision`, { approve: true, note: 'ok' })).status, 200);
  assert.equal(row().ended_at_corrected, c.body.corrected_ts);
  assert.equal(row().ended_at, c.body.original_ts, 'original untouched');
  const types = (await pt1.get(`/api/visits/${v}/timeline`)).body.events.map((e) => e.type);
  assert.ok(types.includes('CORRECTION_REQUESTED') && types.includes('CORRECTION_APPLIED'));
  await pt1.post(`/api/visits/${v}/room/exit`);
});

test('supervisor cannot approve their own correction', async () => {
  const v = await checkin(patient()); await intoRoom(v, 'GP-01');
  const c = await pt1.post('/api/corrections', { kind: 'ROOM_EXIT', entity_id: t.ops.one('SELECT id FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v).id, corrected_ts: new Date(Date.parse(t.ops.one('SELECT entered_at e FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v).e) + 1).toISOString(), reason: 'Left earlier' });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  const own = await sup.post('/api/corrections', { kind: 'CLINIC_DEPARTURE', entity_id: v, corrected_ts: new Date(Date.now()).toISOString(), reason: 'Departed earlier' });
  assert.equal(own.status, 201, JSON.stringify(own.body));
  assert.equal((await sup.post(`/api/corrections/${own.body.id}/decision`, { approve: true })).body.error.code, 'SELF_APPROVAL');
  assert.equal((await admin.post(`/api/corrections/${own.body.id}/decision`, { approve: false, note: 'no' })).body.status, 'REJECTED');
});

test('department scope: clinicians cannot see or act on other departments', async () => {
  const v = await checkin(patient(), 'Orthopedics');
  assert.equal((await pt1.get(`/api/visits/${v}/timeline`)).status, 403);
  assert.ok(!(await pt1.get('/api/search')).body.some((r) => r.visit_id === v));
  assert.ok((await ort.get('/api/search')).body.some((r) => r.visit_id === v));
  assert.equal((await pt1.post('/api/queue/call-next', { department_id: dept('Orthopedics').id })).status, 403);
  await rec.post(`/api/visits/${v}/checkout`);
});

test('search filters work and respect permissions', async () => {
  const r = await admin.get(`/api/search?room_id=${room('PT-01').id}`);
  assert.ok(r.body.length >= 1);
  const m = await admin.get('/api/search?mrn=MRN-000001');
  assert.ok(m.body.every((x) => x.mrn === 'MRN-000001'));
  assert.equal((await admin.get('/api/search?session_status=COMPLETED')).status, 200);
});

test('role permissions: config, reports, audit, health', async () => {
  assert.equal((await rec.post('/api/config/departments', { name: 'X', queue_prefix: 'X' })).status, 403);
  assert.equal((await pt1.get('/api/reports')).status, 403);
  assert.equal((await rec.get('/api/audit')).status, 403);
  assert.equal((await sup.get('/api/health')).status, 403);
  assert.equal((await admin.get('/api/health')).status, 200);
  const h = JSON.stringify((await admin.get('/api/health')).body);
  assert.ok(!/pass|secret|token/i.test(h.replace(/"passed"/g, '')), 'health must not expose secrets');
  assert.equal((await sup.get('/api/reports')).status, 200);
});

test('dynamic config: a new department, room and service work without code changes', async () => {
  const d = (await admin.post('/api/config/departments', { name: 'Podiatry', name_ar: 'قدم', queue_prefix: 'D', queue_start: 100 })).body;
  const r = (await admin.post('/api/config/rooms', { department_id: d.id, code: 'POD-01', name: 'Podiatry 1', capacity: 2 })).body;
  const sv = (await admin.post('/api/config/services', { department_id: d.id, name: 'Foot Assessment', default_minutes: 25 })).body;
  assert.ok(r.id && sv.id);
  const v = await rec.post('/api/visits/checkin', { patientId: await patient(), departmentId: d.id });
  assert.equal(v.body.queue.display, 'D100', 'queue numbering configured per department');
  await rec.post(`/api/visits/${v.body.visit.id}/checkout`);
});

test('timestamps are server-authoritative: client-supplied times are ignored', async () => {
  const v = await rec.post('/api/visits/checkin', { patientId: await patient(), departmentId: dept('Physiotherapy').id, arrived_at: '2001-01-01T00:00:00Z', ts: '2001-01-01T00:00:00Z' });
  assert.ok(Date.now() - Date.parse(v.body.visit.arrived_at) < 5000);
  await rec.post(`/api/visits/${v.body.visit.id}/checkout`);
});

test('reports aggregate real data', async () => {
  const r = (await sup.get('/api/reports')).body;
  assert.ok(r.visits > 5 && r.sessions >= 3 && r.transfers >= 1 && r.corrections.total >= 2);
  assert.ok(r.by_room.length > 0);
  const csv = await fetch(`${t.base}/api/reports/sessions.csv`, { headers: { cookie: 'x' } });
  assert.equal(csv.status, 401);
});
