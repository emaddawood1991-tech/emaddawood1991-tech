// Workflow gaps found by the audit probes (stage S8): queue cancel / no-show, patient correction, staff in several departments,
// department deactivation with a live queue, and shared-room status.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';

let t, admin, sup, rec, pt1, pt2, ort, gm, cfg;
const dept = (n) => cfg.departments.find((d) => d.name === n).id;
const room = (code) => cfg.rooms.find((r) => r.code === code);
const code = (r) => r.body?.error?.code;
async function arrive(name, deptName = 'Physiotherapy') {
  const p = (await rec.post('/api/patients', { name, phone: `05${Math.floor(10000000 + Math.random() * 89999999)}` })).body;
  const reg = (await rec.post('/api/registrations', { patient_id: p.id, department_id: dept(deptName) })).body;
  return { p, visit: reg.visit?.id ?? reg.visit_id };
}
const audits = async () => { const b = (await admin.get('/api/audit')).body; return b.rows ?? b; };
const qEntry = (visit) => t.db.prepare("SELECT * FROM queue_entries WHERE visit_id=? ORDER BY id DESC").get(visit);

before(async () => {
  t = await boot();
  [admin, sup, rec, pt1, pt2, ort, gm] = await Promise.all(['admin', 'super', 'reception', 'pt.one', 'pt.two', 'dr.ort', 'gm.one'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
});
after(() => t.close());

// ---------- P29 ----------
test('S8-1 reception cancels a waiting patient or marks a no-show; the visit closes; the queue no longer shows them', async () => {
  const a = await arrive('Walked Away Patient'); const e = qEntry(a.visit);
  assert.equal(code(await rec.post(`/api/queue/${e.id}/cancel`, { kind: 'CANCELLED' })), 'VALIDATION', 'a reason is required for a cancellation');
  assert.equal((await pt1.post(`/api/queue/${e.id}/cancel`, { kind: 'CANCELLED', reason: 'tamper attempt' })).status, 403, 'clinicians do not hold the permission');
  const r = await rec.post(`/api/queue/${e.id}/cancel`, { kind: 'CANCELLED', reason: 'Patient left before being called' });
  assert.equal(r.status, 200); assert.equal(r.body.status, 'CANCELLED'); assert.equal(r.body.visit_closed, true);
  assert.equal(t.db.prepare('SELECT status FROM visits WHERE id=?').get(a.visit).status, 'CHECKED_OUT');
  assert.ok(!(await pt1.get('/api/queue')).body.entries.some((x) => x.id === e.id));
  assert.equal((await rec.post(`/api/queue/${e.id}/cancel`, { kind: 'CANCELLED', reason: 'again' })).status, 200, 'idempotent');
  const b = await arrive('No Show Patient'); const e2 = qEntry(b.visit);
  assert.equal((await rec.post(`/api/queue/${e2.id}/cancel`, { kind: 'NO_SHOW' })).status, 200, 'no-show needs no reason');
  assert.ok((await audits()).some((x) => x.action === 'queue.no_show'));
  assert.ok(t.db.prepare("SELECT 1 FROM events WHERE visit_id=? AND type='QUEUE_NO_SHOW'").get(b.visit));
  const c = await arrive('Bogus Kind Patient'); assert.equal(code(await rec.post(`/api/queue/${qEntry(c.visit).id}/cancel`, { kind: 'bogus', reason: 'xxxx' })), 'VALIDATION');
});
test('S8-2 an entry already in a room cannot be cancelled, and a visit with other activity stays open', async () => {
  const a = await arrive('In Room Patient'); const e = qEntry(a.visit);
  assert.equal((await pt1.post(`/api/visits/${a.visit}/room`, { room_id: room('PT-01').id })).status, 201);
  assert.equal(code(await rec.post(`/api/queue/${e.id}/cancel`, { kind: 'CANCELLED', reason: 'mistake' })), 'NOT_CANCELLABLE');
  assert.equal((await rec.post('/api/queue/999999/cancel', { kind: 'NO_SHOW' })).status, 404);
  await pt1.post(`/api/visits/${a.visit}/room/exit`);
});

// ---------- P30 ----------
test('S8-3 demographics can be corrected; the EMR number cannot; every change keeps the old value', async () => {
  const { p } = await arrive('Typo Nmae Patient');
  assert.equal((await pt1.patch(`/api/patients/${p.id}`, { name: 'x' })).status, 403);
  assert.equal(code(await rec.patch(`/api/patients/${p.id}`, { mrn: 'EMR-999999' })), 'VALIDATION');
  assert.equal(code(await rec.patch(`/api/patients/${p.id}`, { name: 'A' })), 'VALIDATION');
  assert.equal(code(await rec.patch(`/api/patients/${p.id}`, { dob: '2999-01-01' })), 'VALIDATION');
  const r = await rec.patch(`/api/patients/${p.id}`, { name: 'Typo Name Patient', dob: '1990-04-02', sex: 'M' });
  assert.equal(r.status, 200); assert.equal(r.body.name, 'Typo Name Patient'); assert.equal(r.body.mrn, p.mrn); assert.equal(r.body.phone, p.phone);
  const h = (await admin.get(`/api/patients/${p.id}/changes`)).body; assert.equal(h.length, 1);
  assert.deepEqual(h[0].changes.name, { from: 'Typo Nmae Patient', to: 'Typo Name Patient' }); assert.equal(h[0].actor, 'Reception (Demo)');
  assert.equal((await rec.patch(`/api/patients/${p.id}`, { name: 'Typo Name Patient' })).status, 200);
  assert.equal((await admin.get(`/api/patients/${p.id}/changes`)).body.length, 1, 'no change, no history entry');
  const log = (await audits()).find((x) => x.action === 'patient.update'); assert.ok(log && !JSON.stringify(log.detail).includes('Typo'), 'audit holds field names only');
  assert.equal((await pt1.get(`/api/patients/${p.id}/changes`)).status, 403);
  assert.throws(() => t.db.exec('DELETE FROM patient_changes'), /append-only/);
});
test('S8-4 correcting a patient into another patient’s details asks for confirmation', async () => {
  const a = (await rec.post('/api/patients', { name: 'Dup One', phone: '0501112233', dob: '1980-01-01' })).body;
  const b = (await rec.post('/api/patients', { name: 'Dup Two', phone: '0504445566' })).body;
  const r = await rec.patch(`/api/patients/${b.id}`, { phone: '0501112233' });
  assert.equal(r.status, 409); assert.equal(code(r), 'POSSIBLE_DUPLICATE');
  assert.equal((await rec.patch(`/api/patients/${b.id}`, { phone: '0501112233', confirm_duplicate: true })).status, 200);
  assert.equal((await rec.patch(`/api/patients/${a.id}`, { sex: 'F' })).status, 200, 'editing a patient is not blocked by itself');
});

// ---------- P31 ----------
test('S8-5 a clinician can work in more than one department, and only in those', async () => {
  const phys = await arrive('Physio Side Patient', 'Physiotherapy'), orth = await arrive('Ortho Side Patient', 'Orthopedics'), gen = await arrive('General Side Patient', 'General Medicine');
  const tw = (await admin.get('/api/staff')).body.find((s) => s.username === 'pt.two');
  assert.equal((await ort.get(`/api/visits/${phys.visit}/timeline`)).status, 403, 'before: Orthopedics cannot see Physiotherapy');
  // validation
  assert.equal(code(await admin.patch(`/api/config/staff/${tw.id}`, { extra_department_ids: [999] })), 'VALIDATION');
  const recId = (await admin.get('/api/staff')).body.find((s) => s.username === 'reception').id;
  assert.equal(code(await admin.patch(`/api/config/staff/${recId}`, { extra_department_ids: [dept('Orthopedics')] })), 'VALIDATION', 'reception cannot have extras');
  assert.equal(code(await admin.patch(`/api/config/staff/${tw.id}`, { extra_department_ids: 'x' })), 'VALIDATION');
  // grant Orthopedics to a physiotherapist
  assert.equal((await admin.patch(`/api/config/staff/${tw.id}`, { extra_department_ids: [dept('Orthopedics'), dept('Physiotherapy')] })).status, 200);
  assert.deepEqual((await admin.get('/api/staff')).body.find((s) => s.id === tw.id).extra_department_ids, [dept('Orthopedics')], 'the main department is not repeated');
  assert.equal((await pt2.get(`/api/visits/${orth.visit}/timeline`)).status, 200, 'now sees Orthopedics');
  assert.equal((await pt2.get(`/api/visits/${phys.visit}/timeline`)).status, 200, 'and still Physiotherapy');
  assert.equal((await pt2.get(`/api/visits/${gen.visit}/timeline`)).status, 403, 'but not General Medicine');
  assert.equal((await pt2.get(`/api/patients?q=${encodeURIComponent('Ortho Side')}`)).body.length, 1);
  assert.equal((await pt2.get(`/api/patients?q=${encodeURIComponent('General Side')}`)).body.length, 0);
  const q1 = (await pt2.get('/api/queue')).body.entries.map((x) => x.department); assert.ok(q1.includes('Orthopedics') && q1.includes('Physiotherapy') && !q1.includes('General Medicine'));
  assert.equal((await pt2.get(`/api/queue?department_id=${dept('General Medicine')}`)).body.entries.length, 0, 'asking for an outside department shows nothing');
  assert.equal((await pt2.post('/api/queue/call-next', { department_id: dept('General Medicine') })).status, 403);
  assert.notEqual((await pt2.post('/api/queue/call-next', { department_id: dept('Orthopedics') })).status, 403);
  // clearing or changing the role removes the extras
  assert.equal((await admin.patch(`/api/config/staff/${tw.id}`, { extra_department_ids: [] })).status, 200);
  assert.equal((await pt2.get(`/api/visits/${orth.visit}/timeline`)).status, 403, 'access ends when the extra department is removed');
  await admin.patch(`/api/config/staff/${tw.id}`, { extra_department_ids: [dept('Orthopedics')] });
  await admin.patch(`/api/config/staff/${tw.id}`, { department_id: null });
  assert.deepEqual((await admin.get('/api/staff')).body.find((s) => s.id === tw.id).extra_department_ids, [], 'no main department: extras lapse');
  await admin.patch(`/api/config/staff/${tw.id}`, { department_id: dept('Physiotherapy') });
});

// ---------- P18 ----------
test('S8-6 deactivating a department with patients still queued asks for confirmation', async () => {
  const rehab = dept('Rehabilitation');
  assert.equal((await admin.patch(`/api/config/departments/${rehab}`, { active: 0 })).status, 200, 'empty department: no question');
  await admin.patch(`/api/config/departments/${rehab}`, { active: 1 });
  await arrive('Queued In Neuro', 'Neurological Rehabilitation'); const neuro = dept('Neurological Rehabilitation');
  const r = await admin.patch(`/api/config/departments/${neuro}`, { active: 0 });
  assert.equal(r.status, 409); assert.equal(code(r), 'DEPARTMENT_HAS_QUEUE'); assert.equal(r.body.error.open_queue, 1);
  assert.equal(t.db.prepare('SELECT active FROM departments WHERE id=?').get(neuro).active, 1, 'nothing changed');
  assert.equal((await admin.patch(`/api/config/departments/${neuro}`, { active: 0, confirm_open_queue: true })).status, 200);
  assert.equal(t.db.prepare('SELECT active FROM departments WHERE id=?').get(neuro).active, 0);
  assert.equal(t.db.prepare("SELECT COUNT(*) c FROM queue_entries WHERE department_id=? AND status='WAITING'").get(neuro).c, 1, 'the queued patient is not deleted');
});

// ---------- P27 ----------
test('S8-7 a shared room with free beds shows “in use”, not “occupied”', async () => {
  const hall = () => t.ops.roomState(t.db.prepare("SELECT * FROM rooms WHERE code='PT-HALL-01'").get());
  assert.equal(hall().display_status, 'AVAILABLE');
  const ids = [];
  for (let i = 0; i < hall().stations.length; i++) {
    const a = await arrive(`Hall Patient ${i}`);
    assert.equal((await pt1.post(`/api/visits/${a.visit}/room`, { room_id: hall().id, station_id: hall().stations.find((s) => !s.occupied_by).id })).status, 201);
    ids.push(a.visit);
    if (i === 0) { assert.equal(hall().display_status, 'IN_USE'); }
  }
  assert.equal(hall().display_status, 'OCCUPIED', 'every bed taken');
  await pt1.post(`/api/visits/${ids[0]}/room/exit`);
  assert.equal(hall().display_status, 'IN_USE', 'one bed free again');
  });
