// Waiting-time and treatment-countdown tests. A controllable clock (clock.advance) replaces real waiting.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';
import { clock } from '../server/ops.js';

let t, admin, rec, pt1, pt2, ort, sup, cfg;
const MIN = 60000;
const near = (a, b, tol = 4000) => Math.abs(a - b) <= tol;
const dept = (n) => cfg.departments.find((d) => d.name === n);
const svc = (n) => cfg.services.find((s) => s.name === n);
const hall = () => cfg.rooms.find((r) => r.code === 'PT-HALL-01');
let seq = 0; let bed = 0;
const patient = async () => (await rec.post('/api/patients', { name: `Synthetic Timer ${++seq}` })).body.id;
async function arrive(deptName = 'Physiotherapy') {
  const r = await rec.post('/api/registrations', { patient_id: await patient(), department_id: dept(deptName).id });
  assert.equal(r.status, 201, JSON.stringify(r.body)); return r.body.visit.id;
}
async function enter(v, roomCode, useBed) {
  const room = cfg.rooms.find((x) => x.code === roomCode);
  if (t.ops.one('SELECT status FROM rooms WHERE code=?', roomCode).status === 'CLEANING') await rec.put(`/api/rooms/${room.id}/status`, { status: 'AVAILABLE' });
  const a = await rec.post(`/api/visits/${v}/room`, { room_id: room.id, station_id: useBed != null ? room.stations[useBed].id : undefined });
  assert.equal(a.status, 201, JSON.stringify(a.body)); assert.equal((await rec.post(`/api/visits/${v}/room/enter`)).status, 200);
}
const start = (who, v, minutes, name = 'PT Treatment', extra = {}) => who.post(`/api/visits/${v}/sessions`, { service_id: svc(name).id, ...(minutes != null ? { planned_minutes: minutes } : {}), ...extra });
const sess = async (who, id) => (await who.get('/api/sessions/active')).body.sessions.find((s) => s.id === id);
const events = (id) => t.ops.q('SELECT type, ts, data FROM events WHERE session_id=? ORDER BY id', id).map((e) => ({ ...e, data: JSON.parse(e.data) }));

before(async () => {
  t = await boot();
  [admin, rec, pt1, pt2, ort, sup] = await Promise.all(['admin', 'reception', 'pt.one', 'pt.two', 'dr.ort', 'super'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
});
after(() => t.close());

test('1-2: arrival is recorded by the server; waiting before room, in the room and in total are calculated from stored timestamps', async () => {
  const v = await arrive();
  const row = async () => (await rec.get('/api/visits/open')).body.find((x) => x.id === v).timing;
  const before = Date.now();
  assert.ok(near(Date.parse((await row()).arrival_at), before, 3000), 'arrival timestamp = server time at check-in');
  clock.advance(7 * MIN);
  let tm = await row();
  assert.ok(near(tm.waiting_before_room_ms, 7 * MIN) && tm.waiting_is_live, 'waiting before room is live and ≈ 7 min');
  await enter(v, 'PT-01');
  clock.advance(4 * MIN);
  tm = await row();
  assert.ok(near(tm.waiting_before_room_ms, 7 * MIN), 'waiting before room is now fixed at 7 min (does not keep growing)');
  assert.ok(near(tm.waiting_in_room_ms, 4 * MIN) && tm.in_room_wait_is_live, 'waiting inside the room is live ≈ 4 min');
  assert.ok(near(tm.total_waiting_ms, 11 * MIN), 'total waiting ≈ 11 min');
  const s = await start(pt1, v, 20);
  clock.advance(1000);
  tm = await row();
  assert.ok(near(tm.waiting_in_room_ms, 4 * MIN) && near(tm.total_waiting_ms, 11 * MIN) && !tm.waiting_is_live, 'all waiting values freeze when treatment starts');
  assert.equal(tm.treatment_start_at, s.body.started_at);
  clock.advance(30 * MIN);
  assert.ok(near((await row()).total_waiting_ms, 11 * MIN), 'historical waiting never changes afterwards');
  await pt1.post(`/api/sessions/${s.body.id}/complete`); await rec.post(`/api/visits/${v}/room/exit`);
});

test('3-8, 15: 20/40/50/55/60-minute timers run independently, stop at zero and never go negative', async () => {
  const plans = [20, 40, 50, 55, 60]; const runs = [];
  for (const m of plans) {
    const v = await arrive(); await enter(v, 'PT-HALL-01', bed++ % 6);
    const r = await start(pt1, v, m); assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.planned_minutes, m);
    assert.equal(Date.parse(r.body.scheduled_end_at) - Date.parse(r.body.started_at), m * MIN, `scheduled end = start + ${m} min exactly`);
    assert.ok(near(r.body.remaining_ms, m * MIN) && r.body.timer_state === 'RUNNING');
    runs.push({ m, id: r.body.id, v, end: r.body.scheduled_end_at });
  }
  // 19 minutes in: everything still running with different remaining times
  clock.advance(19 * MIN);
  let live = (await pt1.get('/api/sessions/active')).body.sessions;
  for (const r of runs) { const s = live.find((x) => x.id === r.id); assert.equal(s.timer_state, 'RUNNING'); assert.ok(near(s.remaining_ms, (r.m - 19) * MIN), `${r.m}: remaining ≈ ${r.m - 19} min`); }
  clock.advance(1 * MIN + 2000); // 20 min: only the 20-minute timer has elapsed
  live = (await pt1.get('/api/sessions/active')).body.sessions;
  assert.deepEqual(plans.map((m) => live.find((x) => x.id === runs.find((r) => r.m === m).id).timer_state), ['ELAPSED', 'RUNNING', 'RUNNING', 'RUNNING', 'RUNNING']);
  clock.advance(20 * MIN); // 40
  live = (await pt1.get('/api/sessions/active')).body.sessions;
  assert.deepEqual(plans.map((m) => live.find((x) => x.id === runs.find((r) => r.m === m).id).timer_state), ['ELAPSED', 'ELAPSED', 'RUNNING', 'RUNNING', 'RUNNING']);
  clock.advance(10 * MIN); // 50
  clock.advance(5 * MIN); // 55
  clock.advance(5 * MIN); // 60
  clock.advance(30 * MIN); // 90 — far past every deadline
  live = (await pt1.get('/api/sessions/active')).body.sessions;
  for (const r of runs) {
    const s = live.find((x) => x.id === r.id);
    assert.equal(s.timer_state, 'ELAPSED'); assert.equal(s.remaining_ms, 0, 'countdown stops at 0 and never goes negative');
    assert.equal(s.status, 'ACTIVE', 'the treatment is NOT completed automatically');
    assert.equal(s.timer_elapsed_at, r.end, 'elapsed time recorded as the scheduled end, not invented');
    assert.equal(s.ended_at, null, 'no actual completion timestamp exists yet');
    assert.ok(s.overrun_ms > 25 * MIN, 'overtime is reported separately from the remaining time');
    const ev = events(r.id).filter((e) => e.type === 'TIMER_ELAPSED'); assert.equal(ev.length, 1, 'one elapsed event per timer');
    assert.equal(ev[0].ts, r.end);
    assert.equal(t.ops.one('SELECT exited_at FROM occupancy WHERE visit_id=?', r.v).exited_at, null, 'room stays occupied until the room-exit workflow');
  }
  const cfg2 = (await rec.get('/api/config')).body.rooms.find((x) => x.code === 'PT-HALL-01');
  assert.equal(cfg2.timers.length, 5); assert.ok(cfg2.timers.every((x) => x.timer_state === 'ELAPSED' && !('patient_name' in x)), 'room map shows timers without patient identity');
  assert.equal((await pt1.get('/api/sessions/active')).body.sessions.length, 5);
  globalThis.__elapsed = runs;
});

test('13-14: after the timer elapses the clinician confirms; scheduled end and verified end are kept separately; room exit and check-out follow', async () => {
  const [a, b] = globalThis.__elapsed.slice(0, 2); // 20 min and 40 min
  const full = await pt1.post(`/api/sessions/${a.id}/complete`, { mode: 'scheduled' });
  assert.equal(full.body.completion_kind, 'FULL'); assert.equal(full.body.ended_at, a.end, 'clinical end = scheduled end when the clinician confirms it ran to time');
  assert.ok(Date.parse(full.body.confirmed_at) > Date.parse(a.end), 'confirmation time recorded separately'); assert.ok(near(full.body.active_ms, 20 * MIN, 2000));
  const over = await pt1.post(`/api/sessions/${b.id}/complete`, {});
  assert.equal(over.body.completion_kind, 'OVERRUN'); assert.ok(over.body.overrun_ms > 40 * MIN, 'overrun measured against the plan');
  assert.equal((await pt1.post(`/api/sessions/${a.id}/complete`)).body.completion_kind, 'FULL', 'completing twice changes nothing');
  assert.equal((await pt1.post(`/api/sessions/${a.id}/pause`)).status, 409);
  assert.equal((await rec.post(`/api/visits/${a.v}/checkout`)).status, 409, 'cannot leave while still in the room');
  assert.equal((await pt1.post(`/api/visits/${a.v}/room/exit`)).status, 200);
  assert.equal((await rec.post(`/api/visits/${a.v}/checkout`)).status, 200);
  const tl = (await rec.get(`/api/visits/${a.v}/timeline`)).body;
  assert.equal(tl.visit.status, 'CHECKED_OUT'); assert.ok(tl.timing.total_visit_ms > 20 * MIN && tl.timing.departed_at && tl.timing.room_exit_at && tl.timing.last_treatment_end_at);
  assert.deepEqual(tl.events.map((e) => e.type), ['ARRIVED', 'QUEUE_ENTERED', 'ROOM_ASSIGNED', 'ROOM_ENTERED', 'TREATMENT_STARTED', 'TIMER_ELAPSED', 'TREATMENT_COMPLETED', 'ROOM_EXITED', 'CLINIC_DEPARTED']);
  for (const r of globalThis.__elapsed.slice(1)) { // tidy remaining
    if (r.id !== b.id) await pt1.post(`/api/sessions/${r.id}/complete`);
    await pt1.post(`/api/visits/${r.v}/room/exit`);
  }
});

test('9, 17: timer state survives refresh, another device, and a reconnect long after the deadline (derived from stored timestamps)', async () => {
  const v = await arrive(); await enter(v, 'PT-02');
  const s = await start(pt1, v, 20); const id = s.body.id;
  clock.advance(8 * MIN);
  const refreshed = await t.login('pt.one'); const other = await t.login('pt.one'); // "refresh / log in again" and "second device"
  for (const who of [pt1, refreshed, other]) { const x = await sess(who, id); assert.ok(near(x.remaining_ms, 12 * MIN), 'same remaining time on every device'); assert.equal(x.scheduled_end_at, s.body.scheduled_end_at); }
  await other.post('/api/logout');
  clock.advance(90 * MIN); // nobody is looking; no polling happens
  assert.equal(t.ops.one('SELECT timer_elapsed_at e FROM treatment_sessions WHERE id=?', id).e, null, 'nothing was written while nobody looked');
  const back = await t.login('pt.one');
  const x = await sess(back, id);
  assert.equal(x.timer_state, 'ELAPSED'); assert.equal(x.remaining_ms, 0); assert.equal(x.timer_elapsed_at, s.body.scheduled_end_at);
  assert.equal(events(id).find((e) => e.type === 'TIMER_ELAPSED').ts, s.body.scheduled_end_at, 'recorded at the true scheduled end, not at reconnect time');
  assert.equal(x.status, 'ACTIVE'); assert.ok(near(x.overrun_ms, 78 * MIN, 5000), "98 min since start minus 20 planned");
  await pt1.post(`/api/sessions/${id}/complete`); await rec.post(`/api/visits/${v}/room/exit`);
});

test('10: ending early records EARLY with the real elapsed treatment time', async () => {
  const v = await arrive(); await enter(v, 'PT-03');
  const s = await start(pt1, v, 40); clock.advance(10 * MIN);
  const r = await pt1.post(`/api/sessions/${s.body.id}/complete`);
  assert.equal(r.body.completion_kind, 'EARLY'); assert.ok(near(r.body.active_ms, 10 * MIN)); assert.ok(near(Date.parse(r.body.ended_at), Date.parse(r.body.started_at) + 10 * MIN));
  assert.equal(r.body.scheduled_end_at, s.body.scheduled_end_at, 'planned end kept for reporting');
  assert.ok(!events(s.body.id).some((e) => e.type === 'TIMER_ELAPSED'));
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('11: pause freezes the countdown; resume recalculates the end from remaining ACTIVE time', async () => {
  const v = await arrive(); await enter(v, 'PT-01');
  const s = await start(pt1, v, 20); const id = s.body.id;
  clock.advance(5 * MIN);
  const p = await pt1.post(`/api/sessions/${id}/pause`); assert.equal(p.body.timer_state, 'PAUSED'); assert.ok(near(p.body.remaining_ms, 15 * MIN));
  clock.advance(30 * MIN);
  const frozen = await sess(pt1, id); assert.equal(frozen.timer_state, 'PAUSED'); assert.ok(near(frozen.remaining_ms, 15 * MIN), 'still 15 min after a 30-minute pause');
  const resumedAt = Date.now() + clock.offsetMs;
  const r = await pt1.post(`/api/sessions/${id}/resume`); assert.equal(r.body.timer_state, 'RUNNING');
  assert.ok(near(Date.parse(r.body.scheduled_end_at), resumedAt + 15 * MIN), 'new scheduled end = resume + remaining active time');
  clock.advance(14 * MIN); assert.equal((await sess(pt1, id)).timer_state, 'RUNNING');
  clock.advance(1 * MIN + 3000);
  const done = await sess(pt1, id); assert.equal(done.timer_state, 'ELAPSED'); assert.ok(near(done.active_ms, 20 * MIN, 5000), 'exactly 20 minutes of ACTIVE treatment time');
  assert.equal((await pt1.post(`/api/sessions/${id}/pause`)).body.error.code, 'TIMER_ELAPSED', 'cannot pause after the scheduled time elapsed');
  const c = await pt1.post(`/api/sessions/${id}/complete`, { mode: 'scheduled' }); assert.equal(c.body.completion_kind, 'FULL'); assert.ok(near(c.body.active_ms, 20 * MIN, 5000));
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('12: a room transfer does not disturb the running timer', async () => {
  const v = await arrive(); await enter(v, 'PT-HALL-01', 5);
  const s = await start(pt1, v, 50); clock.advance(12 * MIN);
  await rec.put(`/api/rooms/${cfg.rooms.find((r) => r.code === 'PT-03').id}/status`, { status: 'AVAILABLE' });
  const tr = await pt1.post(`/api/visits/${v}/room/transfer`, { room_id: cfg.rooms.find((r) => r.code === 'PT-03').id, reason: 'Equipment' });
  assert.equal(tr.status, 201, JSON.stringify(tr.body));
  const x = await sess(pt1, s.body.id); assert.equal(x.timer_state, 'RUNNING'); assert.ok(near(x.remaining_ms, 38 * MIN)); assert.equal(x.scheduled_end_at, s.body.scheduled_end_at);
  const rooms = (await rec.get('/api/config')).body.rooms;
  assert.equal(rooms.find((r) => r.code === 'PT-HALL-01').stations[5].occupied_by, null, 'bed released by the transfer');
  await pt1.post(`/api/sessions/${s.body.id}/complete`); await rec.post(`/api/visits/${v}/room/exit`);
});

test('16 and validation: unauthorized users are blocked; durations must be whole minutes inside the service range', async () => {
  const v = await arrive(); await enter(v, 'PT-02');
  assert.equal((await start(pt2, v, 20, 'Electrical Stimulation')).status, 403, 'unauthorized clinician');
  assert.equal((await start(rec, v, 20)).status, 403, 'reception');
  assert.equal((await start(ort, v, 20)).status, 403, 'wrong department');
  assert.equal((await start(admin, v, 20)).status, 403, 'administrator has no clinical authorization of their own');
  for (const bad of [0, -5, 3, 181, 20.5, 'abc', '1e3']) { const r = await start(pt1, v, bad); assert.equal(r.status, 400, `${bad}`); assert.equal(r.body.error.code, 'VALIDATION'); assert.ok(r.body.error.fields.planned_minutes); }
  for (const ok of [5, 20, 40, 50, 55, 60, 180]) { const r = await start(pt1, v, ok); assert.equal(r.status, 201, `${ok}`); await pt1.post(`/api/sessions/${r.body.id}/complete`); }
  const dflt = await start(pt1, v, null); assert.equal(dflt.body.planned_minutes, svc('PT Treatment').default_minutes, 'default duration applied when none is entered'); await pt1.post(`/api/sessions/${dflt.body.id}/complete`);
  assert.equal(t.ops.q('SELECT COUNT(*) c FROM treatment_sessions WHERE visit_id=? AND planned_minutes=3', v)[0].c, 0, 'rejected requests created nothing');
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('administrator configures default, minimum, maximum and whether clinicians may override', async () => {
  const sv = svc('PT Evaluation');
  assert.equal((await pt1.patch(`/api/config/services/${sv.id}`, { max_minutes: 90 })).status, 403, 'only administrators');
  assert.equal((await admin.patch(`/api/config/services/${sv.id}`, { min_minutes: 30, max_minutes: 90, default_minutes: 45 })).status, 200);
  assert.equal((await admin.patch(`/api/config/services/${sv.id}`, { min_minutes: 100 })).status, 400, 'min above max rejected');
  assert.equal((await admin.patch(`/api/config/services/${sv.id}`, { default_minutes: 20 })).status, 400, 'default below min rejected');
  const v = await arrive(); await enter(v, 'PT-03');
  assert.equal((await start(pt1, v, 20, 'PT Evaluation')).body.error.fields.planned_minutes, 'Allowed range: 30–90 minutes.');
  assert.equal((await admin.patch(`/api/config/services/${sv.id}`, { allow_override: 0 })).status, 200);
  const fixed = await start(pt1, v, 60, 'PT Evaluation'); assert.equal(fixed.status, 400); assert.match(fixed.body.error.message, /fixed at 45 minutes/);
  const ok = await start(pt1, v, 45, 'PT Evaluation'); assert.equal(ok.status, 201);
  const o = (await pt1.get(`/api/visits/${v}/treatment-options`)).body; const row = o.departments[0].services.find((x) => x.id === sv.id);
  assert.deepEqual([row.default_minutes, row.min_minutes, row.max_minutes, row.allow_override], [45, 30, 90, 0]); assert.ok(o.patient.mrn && o.location);
  await pt1.post(`/api/sessions/${ok.body.id}/complete`); await rec.post(`/api/visits/${v}/room/exit`);
});

test('optional administrator policy: auto-close marks the timer closed but UNVERIFIED and keeps the room occupied', async () => {
  assert.equal((await admin.patch('/api/config/settings', { timer_auto_close: '1' })).status, 200);
  const v = await arrive(); await enter(v, 'PT-01'); const s = await start(pt1, v, 20);
  clock.advance(25 * MIN); const x = await sess(pt1, s.body.id);
  assert.equal(x, undefined, 'no longer in the active list');
  const row = t.ops.one('SELECT * FROM treatment_sessions WHERE id=?', s.body.id);
  assert.equal(row.completion_kind, 'AUTO'); assert.equal(row.ended_at, s.body.scheduled_end_at); assert.equal(row.confirmed_at, null, 'not clinician-verified');
  assert.equal(t.ops.one('SELECT exited_at FROM occupancy WHERE visit_id=?', v).exited_at, null, 'room is not freed by auto-close');
  const tl = events(s.body.id).find((e) => e.type === 'TREATMENT_COMPLETED'); assert.equal(tl.data.verified, false);
  assert.equal((await pt1.patch('/api/config/settings', { timer_auto_close: '0' })).status, 403);
  await admin.patch('/api/config/settings', { timer_auto_close: '0' });
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('reports: waiting, planned vs confirmed, overruns, early, occupancy, visit length — with filters and CSV', async () => {
  const r = (await sup.get('/api/reports')).body;
  assert.ok(r.waiting.before_room_avg_min > 0 && r.waiting.in_room_avg_min >= 0 && r.waiting.total_avg_min > 0 && r.waiting.visit_total_avg_min > 0);
  assert.ok(r.treatment.planned_avg_min > 0 && r.treatment.actual_confirmed_avg_min > 0);
  assert.ok(r.treatment.full >= 1 && r.treatment.overruns >= 1 && r.treatment.early >= 1 && r.treatment.auto_closed_unverified >= 1);
  assert.ok(r.treatment.overrun_avg_min > 0 && r.treatment.early_avg_min > 0 && r.room_occupancy_avg_min > 0 && r.visit_rows.length > 5);
  const q = (qs) => sup.get(`/api/reports?${qs}`).then((x) => x.body);
  const pt = dept('Physiotherapy').id; const ortId = dept('Orthopedics').id;
  assert.ok((await q(`department_id=${pt}`)).visits > 0); assert.equal((await q(`department_id=${ortId}`)).visits, 0);
  assert.ok((await q(`service_id=${svc('PT Treatment').id}`)).sessions > 0); assert.equal((await q(`service_id=${svc('Electrical Stimulation').id}`)).sessions, 0);
  assert.ok((await q(`clinician_id=${pt1.user.id}`)).sessions > 0); assert.equal((await q(`clinician_id=${pt2.user.id}`)).sessions, 0);
  assert.ok((await q(`room_id=${cfg.rooms.find((x) => x.code === 'PT-01').id}`)).visits > 0);
  assert.equal((await q('patient=Synthetic%20Timer%201')).visit_rows.filter((x) => /Timer 1$/.test(x.patient)).length, 1);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date(Date.now() + clock.offsetMs));
  assert.equal((await q('from=2001-01-01&to=2001-01-02')).visits, 0); assert.ok((await q(`from=${today}&to=${today}`)).visits >= 0);
  assert.equal((await pt1.get('/api/reports')).status, 403);
  const csv = await fetch(`${t.base}/api/reports/sessions.csv?service_id=${svc('PT Treatment').id}`, { headers: { cookie: (await fetch(`${t.base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'super', password: 'Demo-Passw0rd!' }) })).headers.get('set-cookie').split(';')[0] } });
  const text = await csv.text(); assert.match(text.split('\n')[0], /planned_minutes,started_at,scheduled_end_at,timer_elapsed_at,clinical_end_at,confirmed_at,completion_kind,active_minutes,arrival_at,room_entry_at,waiting_before_room_min,waiting_in_room_min,total_waiting_min/);
  assert.ok(text.split('\n').length > 3);
});

test('legacy sessions without a planned duration still work (no countdown, plain elapsed time)', async () => {
  const v = await arrive(); await enter(v, 'PT-02');
  const id = Number(t.ops.run("INSERT INTO treatment_sessions(visit_id,patient_id,service_id,clinician_id,status,started_at) VALUES (?,?,?,?, 'ACTIVE', ?)", v, 1, svc('PT Treatment').id, pt1.user.id, new Date(Date.now() + clock.offsetMs).toISOString()).lastInsertRowid);
  clock.advance(5 * MIN); const x = await sess(pt1, id);
  assert.equal(x.planned_minutes, null); assert.equal(x.remaining_ms, null); assert.equal(x.timer_state, 'RUNNING'); assert.ok(near(x.active_ms, 5 * MIN));
  assert.equal((await pt1.post(`/api/sessions/${id}/complete`)).body.status, 'COMPLETED'); await rec.post(`/api/visits/${v}/room/exit`);
});
