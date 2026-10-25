import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';

let t, admin, rec, pt1, pt2, ort, sup, cfg;
const dept = (n) => cfg.departments.find((d) => d.name === n);
const svc = (n) => cfg.services.find((s) => s.name === n);
const room = (c) => cfg.rooms.find((r) => r.code === c);
let seq = 0;
async function inRoom(deptName, roomCode, actor = rec) {
  const p = (await rec.post('/api/patients', { name: `Synthetic Treatment ${++seq}` })).body.id;
  const r = await rec.post('/api/registrations', { patient_id: p, department_id: dept(deptName).id });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const v = r.body.visit.id;
  if (t.ops.one('SELECT status FROM rooms WHERE code=?', roomCode).status === 'CLEANING') await rec.put(`/api/rooms/${room(roomCode).id}/status`, { status: 'AVAILABLE' });
  assert.equal((await actor.post(`/api/visits/${v}/room`, { room_id: room(roomCode).id })).status, 201);
  assert.equal((await actor.post(`/api/visits/${v}/room/enter`)).status, 200);
  return v;
}
const start = (who, v, serviceName, extra = {}) => who.post(`/api/visits/${v}/sessions`, { service_id: svc(serviceName).id, ...extra });

before(async () => {
  t = await boot();
  [admin, rec, pt1, pt2, ort, sup] = await Promise.all(['admin', 'reception', 'pt.one', 'pt.two', 'dr.ort', 'super'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
});
after(() => t.close());

test('full workflow: check-in → queue → room → entry → start → complete → room exit → check-out (physiotherapist)', async () => {
  const p = (await rec.post('/api/patients', { name: 'Synthetic Workflow PT' })).body.id;
  const reg = await rec.post('/api/registrations', { patient_id: p, department_id: dept('Physiotherapy').id, service_id: svc('PT Treatment').id });
  const v = reg.body.visit.id;
  assert.equal((await pt1.post('/api/queue/call-next', { department_id: dept('Physiotherapy').id })).body.visit_id, v);
  assert.equal((await rec.post(`/api/visits/${v}/room`, { room_id: room('PT-01').id })).status, 201);
  assert.equal((await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id })).body.error.code, 'NOT_IN_ROOM', 'cannot start before room entry');
  assert.equal((await rec.post(`/api/visits/${v}/room/enter`)).status, 200);

  const t0 = Date.now();
  const s = await start(pt1, v, 'PT Treatment', { idem_key: 'wf-1' });
  const t1 = Date.now();
  assert.equal(s.status, 201, JSON.stringify(s.body));
  assert.equal(s.body.clinician_id, pt1.user.id); assert.equal(s.body.service_id, svc('PT Treatment').id); assert.equal(s.body.visit_id, v);
  assert.equal(s.body.room_id, room('PT-01').id, 'room recorded');
  const started = Date.parse(s.body.started_at);
  assert.ok(started >= t0 - 5 && started <= t1 + 5, 'start timestamp is the server time of the click');
  const ev = t.ops.one("SELECT ts, actor_id FROM events WHERE visit_id=? AND type='TREATMENT_STARTED'", v);
  assert.equal(ev.ts, s.body.started_at, 'timeline event and session share the exact timestamp'); assert.equal(ev.actor_id, pt1.user.id);

  const active = (await pt1.get('/api/sessions/active')).body.sessions.find((x) => x.id === s.body.id);
  assert.ok(active && active.status === 'ACTIVE' && active.room === 'PT-01', 'appears on the Sessions page data');
  assert.equal((await pt1.post(`/api/visits/${v}/room/exit`)).body.error.code, 'SESSION_OPEN', 'cannot leave the room mid-treatment');

  const done = await pt1.post(`/api/sessions/${s.body.id}/complete`);
  assert.equal(done.body.status, 'COMPLETED'); assert.ok(Date.parse(done.body.ended_at) >= started);
  assert.ok(!(await pt1.get('/api/sessions/active')).body.sessions.some((x) => x.id === s.body.id), 'leaves the active list');
  const open = (await rec.get('/api/visits/open')).body.find((x) => x.id === v);
  assert.deepEqual(open.open_sessions, [], 'visit no longer has open sessions');
  assert.equal((await pt1.post(`/api/visits/${v}/room/exit`)).status, 200);
  assert.equal((await rec.post(`/api/visits/${v}/checkout`)).status, 200);
  const tl = (await rec.get(`/api/visits/${v}/timeline`)).body;
  assert.equal(tl.visit.status, 'CHECKED_OUT'); assert.ok(tl.durations.total_ms >= 0);
  assert.deepEqual(tl.events.map((e) => e.type), ['ARRIVED', 'QUEUE_ENTERED', 'QUEUE_CALLED', 'ROOM_ASSIGNED', 'ROOM_ENTERED', 'TREATMENT_STARTED', 'TREATMENT_COMPLETED', 'ROOM_EXITED', 'CLINIC_DEPARTED']);
  assert.equal(t.ops.one("SELECT status FROM queue_entries WHERE visit_id=?", v).status, 'DONE');
});

test('authorized orthopedic doctor starts orthopedic treatment', async () => {
  const v = await inRoom('Orthopedics', 'ORT-01');
  const o = (await ort.get(`/api/visits/${v}/treatment-options`)).body;
  assert.deepEqual(o.departments.map((d) => d.name), ['Orthopedics']);
  assert.deepEqual(o.departments[0].services.map((x) => x.name), ['Orthopedic Consultation'], 'only the patient’s department services');
  assert.equal(o.departments[0].services[0].can_start_as_me, true);
  const s = await start(ort, v, 'Orthopedic Consultation');
  assert.equal(s.status, 201); assert.equal(s.body.clinician_id, ort.user.id);
  assert.equal((await ort.post(`/api/sessions/${s.body.id}/complete`)).body.status, 'COMPLETED');
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('unauthorized clinician is blocked with a clear message', async () => {
  const v = await inRoom('Physiotherapy', 'PT-03');
  const r = await start(pt2, v, 'Electrical Stimulation'); // pt.two is only authorized for PT Treatment
  assert.equal(r.status, 403); assert.equal(r.body.error.code, 'NOT_AUTHORIZED_FOR_SERVICE');
  assert.match(r.body.error.message, /not authorized .*Electrical Stimulation.*Settings → Staff/);
  assert.equal(t.ops.one('SELECT COUNT(*) c FROM treatment_sessions WHERE visit_id=?', v).c, 0);
  // an orthopedic doctor cannot even see a physiotherapy patient (department scope)
  assert.equal((await ort.get(`/api/visits/${v}/treatment-options`)).status, 403);
  assert.equal((await start(ort, v, 'Orthopedic Consultation')).status, 403);
  // an authorized clinician is still blocked from using a service of another department on this patient
  const wrongDept = await start(pt1, v, 'Orthopedic Consultation');
  assert.equal(wrongDept.status, 409); assert.equal(wrongDept.body.error.code, 'SERVICE_NOT_IN_VISIT_DEPARTMENT'); assert.match(wrongDept.body.error.message, /Orthopedic Consultation.*Orthopedics.*Physiotherapy/);
  // pt.two's options show which services they may start
  const o = (await pt2.get(`/api/visits/${v}/treatment-options`)).body.departments[0].services;
  assert.deepEqual(o.filter((x) => x.can_start_as_me).map((x) => x.name), ['PT Treatment']);
  assert.ok(o.some((x) => x.name === 'Electrical Stimulation' && !x.can_start_as_me));
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('administrator has no automatic clinical authorization; on-behalf start requires an authorized clinician', async () => {
  const v = await inRoom('Physiotherapy', 'PT-HALL-01', rec).catch(() => null);
  const vv = v ?? (await (async () => { return inRoom('Physiotherapy', 'PT-02'); })());
  const own = await start(admin, vv, 'PT Treatment');
  assert.equal(own.status, 403); assert.equal(own.body.error.code, 'NOT_AUTHORIZED_FOR_SERVICE'); assert.match(own.body.error.message, /administrator role does not include clinical authorization/i);
  const wrong = await start(admin, vv, 'Electrical Stimulation', { clinician_id: pt2.user.id });
  assert.equal(wrong.status, 403); assert.match(wrong.body.error.message, /PT Two.*not authorized/);
  const o = (await admin.get(`/api/visits/${vv}/treatment-options`)).body;
  assert.equal(o.viewer.can_start_for_others, true);
  assert.ok(o.departments[0].services.every((x) => x.can_start_as_me === false), 'admin is authorized for nothing');
  const ES = o.departments[0].services.find((x) => x.name === 'Electrical Stimulation');
  assert.deepEqual(ES.authorized.map((c) => c.name), ['PT One (Demo)'], 'only explicitly authorized people are offered');
  const ok = await start(admin, vv, 'Electrical Stimulation', { clinician_id: pt1.user.id });
  assert.equal(ok.status, 201); assert.equal(ok.body.clinician_id, pt1.user.id, 'recorded for the authorized clinician, not the admin');
  const ev = t.ops.one("SELECT actor_id, data FROM events WHERE session_id=? AND type='TREATMENT_STARTED'", ok.body.id);
  assert.equal(ev.actor_id, admin.user.id); assert.equal(JSON.parse(ev.data).on_behalf, true);
  // clinicians cannot start for somebody else
  assert.equal((await start(pt2, vv, 'PT Treatment', { clinician_id: pt1.user.id })).status, 403);
  // reception cannot start treatment at all
  assert.equal((await start(rec, vv, 'PT Treatment')).status, 403);
  await admin.post(`/api/sessions/${ok.body.id}/complete`);
  await rec.post(`/api/visits/${vv}/room/exit`);
});

test('administrator manages service authorizations through Settings (and every change is audited)', async () => {
  const v = await inRoom('Physiotherapy', 'PT-HALL-01').catch(() => inRoom('Physiotherapy', 'PT-03'));
  assert.equal((await start(pt2, v, 'PT Evaluation')).status, 403);
  const staff = (await admin.get('/api/staff')).body;
  const two = staff.find((s) => s.username === 'pt.two');
  assert.equal((await pt2.patch(`/api/config/staff/${two.id}`, { service_ids: [svc('PT Evaluation').id] })).status, 403, 'only administrators');
  assert.equal((await admin.patch(`/api/config/staff/${two.id}`, { service_ids: [...two.service_ids, svc('PT Evaluation').id] })).status, 200);
  const s = await start(pt2, v, 'PT Evaluation');
  assert.equal(s.status, 201, JSON.stringify(s.body));
  await pt2.post(`/api/sessions/${s.body.id}/complete`);
  assert.equal((await admin.patch(`/api/config/staff/${two.id}`, { service_ids: two.service_ids })).status, 200, 'revoke');
  assert.equal((await start(pt2, v, 'PT Evaluation')).status, 403, 'revoked authorization takes effect immediately');
  assert.equal((await admin.patch(`/api/config/staff/${two.id}`, { service_ids: [99999] })).status, 400);
  const log = (await admin.get('/api/audit?limit=300')).body.filter((a) => a.action === 'config.staff.authorization');
  assert.ok(log.length >= 2 && JSON.parse(log[0].detail).removed.includes(svc('PT Evaluation').id) && JSON.parse(log[1].detail).added.includes(svc('PT Evaluation').id));
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('no services configured / no authorized clinician produce actionable messages', async () => {
  // a department with no services
  const d = (await admin.post('/api/config/departments', { name: 'Synthetic Empty Dept', queue_prefix: 'E' })).body;
  const r = (await admin.post('/api/config/rooms', { department_id: d.id, code: 'EMP-01', name: 'Empty Room', capacity: 1 })).body;
  const p = (await rec.post('/api/patients', { name: 'Synthetic No Services' })).body.id;
  const v = (await rec.post('/api/registrations', { patient_id: p, department_id: d.id })).body.visit.id;
  await rec.post(`/api/visits/${v}/room`, { room_id: r.id }); await rec.post(`/api/visits/${v}/room/enter`);
  const o = (await admin.get(`/api/visits/${v}/treatment-options`)).body;
  assert.equal(o.departments[0].services.length, 0);
  assert.equal((await admin.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id })).body.error.code, 'SERVICE_NOT_IN_VISIT_DEPARTMENT');
  // a service nobody is authorized for
  const sv = (await admin.post('/api/config/services', { department_id: dept('Physiotherapy').id, name: 'Synthetic Unassigned Service', default_minutes: 20 })).body;
  const v2 = await inRoom('Physiotherapy', 'PT-01');
  const none = await pt1.post(`/api/visits/${v2}/sessions`, { service_id: sv.id });
  assert.equal(none.status, 403); assert.equal(none.body.error.code, 'NO_AUTHORIZED_CLINICIAN');
  assert.match(none.body.error.message, /No authorized clinician is available for “Synthetic Unassigned Service”\. Please assign an authorized clinician in Settings/);
  const opts = (await sup.get(`/api/visits/${v2}/treatment-options`)).body.departments[0].services.find((x) => x.id === sv.id);
  assert.deepEqual(opts.authorized, []);
  // inactive services are not offered or startable
  await admin.patch(`/api/config/services/${sv.id}`, { active: 0 });
  assert.ok(!(await pt1.get(`/api/visits/${v2}/treatment-options`)).body.departments[0].services.some((x) => x.id === sv.id));
  assert.equal((await pt1.post(`/api/visits/${v2}/sessions`, { service_id: sv.id })).body.error.code, 'SERVICE_INVALID');
  assert.equal((await pt1.post(`/api/visits/${v2}/sessions`, {})).body.error.code, 'SERVICE_REQUIRED');
  await rec.post(`/api/visits/${v2}/room/exit`);
});

test('treatment-options reports why a visit is not ready (no room / not entered)', async () => {
  const p = (await rec.post('/api/patients', { name: 'Synthetic Not Ready' })).body.id;
  const v = (await rec.post('/api/registrations', { patient_id: p, department_id: dept('Physiotherapy').id })).body.visit.id;
  assert.equal((await pt1.get(`/api/visits/${v}/treatment-options`)).body.not_ready_reason, 'NO_ROOM');
  await rec.put(`/api/rooms/${room('PT-01').id}/status`, { status: 'AVAILABLE' });
  await rec.post(`/api/visits/${v}/room`, { room_id: room('PT-01').id });
  const o = (await pt1.get(`/api/visits/${v}/treatment-options`)).body; assert.equal(o.not_ready_reason, 'NOT_ENTERED'); assert.equal(o.ready, false);
  const blocked = await start(pt1, v, 'PT Treatment'); assert.match(blocked.body.error.message, /Confirm that the patient has entered the room/);
  assert.equal((await rec.get(`/api/visits/${v}/treatment-options`)).status, 403, 'reception cannot run treatment');
  await rec.post(`/api/visits/${v}/room/enter`); await rec.post(`/api/visits/${v}/room/exit`);
});

test('two services in one visit, started by two clinicians; duplicate open session for the same service is refused clearly', async () => {
  const v = await inRoom('Physiotherapy', 'PT-HALL-01').catch(() => inRoom('Physiotherapy', 'PT-03'));
  const a = await start(pt1, v, 'PT Treatment'); const b = await start(pt1, v, 'Electrical Stimulation');
  assert.equal(a.status, 201); assert.equal(b.status, 201);
  const dup = await start(pt1, v, 'PT Treatment'); assert.equal(dup.status, 409); assert.match(dup.body.error.message, /already have an open “PT Treatment” session/);
  for (const s of [a, b]) await pt1.post(`/api/sessions/${s.body.id}/complete`);
  const tl = (await rec.get(`/api/visits/${v}/timeline`)).body;
  assert.equal(tl.durations.sessions.length, 2); assert.ok(tl.durations.total_ms <= tl.durations.sum_ms);
  await rec.post(`/api/visits/${v}/room/exit`);
});
