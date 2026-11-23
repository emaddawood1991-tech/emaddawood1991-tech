// Duplicate linking, follow-up (stage S12): reports and exports count each person once; booked work can be moved to the record that is kept.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';

let t, admin, sup, rec, pt1, cfg;
const dept = (n) => cfg.departments.find((d) => d.name === n).id;
const code = (r) => r.body?.error?.code;
const mk = async (name, extra = {}) => (await rec.post('/api/patients', { name, confirm_duplicate: true, ...extra })).body;
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10) + 'T09:00:00.000Z';
const propose = (dup, surv) => sup.post('/api/patients/links', { duplicate_id: dup.id, survivor_id: surv.id, reason: 'Same person, registered twice at the front desk' });
const link = async (dup, surv) => { const p = await propose(dup, surv); assert.equal(p.status, 201, JSON.stringify(p.body)); assert.equal((await admin.post(`/api/patients/links/${p.body.id}/approve`, {})).status, 200); return p.body; };
/** A finished visit with one completed session, written directly (the flow itself is tested elsewhere). */
function finishedVisit(p) {
  const ts = new Date(Date.now() - 36e5).toISOString(); const end = new Date(Date.now() - 18e5).toISOString();
  const v = Number(t.db.prepare("INSERT INTO visits(patient_id,status,arrived_at,departed_at) VALUES (?, 'CHECKED_OUT', ?, ?)").run(p.id, ts, end).lastInsertRowid);
  const svc = cfg.services.find((s) => s.name === 'PT Treatment'); const cl = t.db.prepare("SELECT id FROM users WHERE username='pt.one'").get().id;
  t.db.prepare("INSERT INTO treatment_sessions(visit_id,patient_id,service_id,clinician_id,status,started_at,ended_at,planned_minutes) VALUES (?,?,?,?, 'COMPLETED', ?, ?, 30)").run(v, p.id, svc.id, cl, ts, end);
  t.db.prepare("INSERT INTO queue_entries(visit_id,department_id,number,display,status,created_at,closed_at) VALUES (?,?,?,?, 'DONE', ?, ?)").run(v, dept('Physiotherapy'), 900 + v, `P-${900 + v}`, ts, end);
  return v;
}

before(async () => {
  t = await boot();
  [admin, sup, rec, pt1] = await Promise.all(['admin', 'super', 'reception', 'pt.one'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
});
after(() => t.close());

test('S12-1 reports and exports count each person once after a link, and carry the surviving EMR number', async () => {
  const A = await mk('Report Person One', { phone: '0507770101', dob: '1980-03-03' }); const B = await mk('Report Persn One', { phone: '0507770101', dob: '1980-03-03' });
  finishedVisit(A); finishedVisit(B);
  const q = '?from=2000-01-01&to=2100-01-01';
  const before = (await admin.get(`/api/reports${q}`)).body; assert.equal(before.visits, 2); assert.equal(before.people, 2, 'two records, two people while unlinked');
  await link(B, A);
  const after = (await admin.get(`/api/reports${q}`)).body; assert.equal(after.visits, 2, 'visits are unchanged'); assert.equal(after.people, 1, 'but they belong to one person');
  const rowB = after.visit_rows.find((r) => r.mrn === B.mrn); assert.equal(rowB.person_mrn, A.mrn, 'the duplicate’s visit shows the surviving EMR number');
  assert.equal(after.visit_rows.find((r) => r.mrn === A.mrn).person_mrn, A.mrn);
  assert.equal((await admin.get(`/api/reports${q}&patient=${encodeURIComponent(A.mrn)}`)).body.visits, 2, 'filtering by the surviving EMR number finds both records’ visits');
  assert.equal((await admin.get(`/api/reports${q}&patient=${encodeURIComponent(B.mrn)}`)).body.visits, 2, 'and so does the old one');
  assert.equal((await admin.get(`/api/reports${q}&patient=${encodeURIComponent('Report Persn')}`)).body.visits, 2, 'and the old name');
  // export: both EMR numbers are kept, the person's number is the last column
  const r = await admin.get(`/api/reports/sessions.csv${q}`); const text = typeof r.body === 'string' ? r.body : '';
  const lines = text.split('\n').filter((l) => l && !l.startsWith('#')); assert.ok(lines[0].startsWith('session_id,mrn') && lines[0].endsWith(',person_mrn'));
  const dupRow = lines.find((l) => l.split(',')[1] === B.mrn); assert.ok(dupRow, 'the duplicate’s own EMR number is still in the file'); assert.equal(dupRow.split(',').pop(), A.mrn, 'and the person’s number is next to it');
  assert.equal(lines.find((l) => l.split(',')[1] === A.mrn).split(',').pop(), A.mrn);
});

test('S12-2 a duplicate’s booked appointments and waiting-list entries can be moved onto the kept record, then the link goes through', async () => {
  const A = await mk('Move Person One', { phone: '0507770202', dob: '1975-07-07' }); const B = await mk('Move Persn One', { phone: '0507770202', dob: '1975-07-07' });
  const phys = dept('Physiotherapy');
  for (const d of [3, 4]) assert.equal((await rec.post('/api/appointments', { patient_id: B.id, department_id: phys, scheduled_at: day(d) })).status, 201);
  assert.equal((await rec.post('/api/schedule/waiting', { patient_id: B.id, department_id: phys })).status, 201);
  const blocked = await propose(B, A); assert.equal(code(blocked), 'OPEN_ACTIVITY'); assert.equal(blocked.body.error.open.appointments, 2); assert.equal(blocked.body.error.open.waiting_list, 1);
  assert.equal((await rec.post(`/api/patients/${B.id}/move-bookings`, { to_patient_id: A.id })).status, 403, 'reception cannot move bookings');
  const moved = await sup.post(`/api/patients/${B.id}/move-bookings`, { to_patient_id: A.id }); assert.equal(moved.status, 200);
  assert.equal(moved.body.moved.length, 2); assert.equal(moved.body.skipped.length, 0); assert.equal(moved.body.waiting_moved, 1);
  assert.equal(t.db.prepare("SELECT COUNT(*) c FROM appointments WHERE patient_id=? AND status='SCHEDULED'").get(A.id).c, 2);
  assert.equal(t.db.prepare("SELECT COUNT(*) c FROM appointments WHERE patient_id=? AND status='SCHEDULED'").get(B.id).c, 0);
  assert.equal(t.db.prepare("SELECT COUNT(*) c FROM appointment_history WHERE action='PATIENT_MOVED'").get().c, 2, 'each move is in the appointment history');
  { const au = (await admin.get('/api/audit')).body; assert.ok((au.rows ?? au).some((x) => x.action === 'patient.bookings.move'), 'the move is in the audit log'); }
  await link(B, A); assert.equal(t.db.prepare("SELECT status FROM patient_links WHERE duplicate_id=?").get(B.id).status, 'ACTIVE');
  assert.equal(code(await sup.post(`/api/patients/${A.id}/move-bookings`, { to_patient_id: B.id })), 'PATIENT_LINKED', 'bookings cannot be moved onto a linked duplicate');
});

test('S12-3 a booking that would overlap one the kept record already has stays where it is and is reported', async () => {
  const A = await mk('Clash Person One', { phone: '0507770303', dob: '1970-01-01' }); const B = await mk('Clash Persn One', { phone: '0507770303', dob: '1970-01-01' });
  const phys = dept('Physiotherapy'); const same = day(6);
  assert.equal((await rec.post('/api/appointments', { patient_id: A.id, department_id: phys, scheduled_at: same })).status, 201);
  assert.equal((await rec.post('/api/appointments', { patient_id: B.id, department_id: phys, scheduled_at: same })).status, 201);
  assert.equal((await rec.post('/api/appointments', { patient_id: B.id, department_id: phys, scheduled_at: day(7) })).status, 201);
  const r = await sup.post(`/api/patients/${B.id}/move-bookings`, { to_patient_id: A.id }); assert.equal(r.status, 200);
  assert.equal(r.body.moved.length, 1); assert.equal(r.body.skipped.length, 1); assert.match(r.body.skipped[0].reason, /already has appointment/);
  const still = await propose(B, A); assert.equal(code(still), 'OPEN_ACTIVITY', 'the clashing booking still blocks the link until someone decides about it'); assert.equal(still.body.error.open.appointments, 1);
  assert.equal(code(await sup.post(`/api/patients/${B.id}/move-bookings`, { to_patient_id: B.id })), 'VALIDATION');
  assert.equal((await sup.post('/api/patients/999999/move-bookings', { to_patient_id: A.id })).status, 404);
});
