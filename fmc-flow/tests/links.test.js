// Duplicate patient records (stage S11): linking, two-person approval, flags, read resolution, undo.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';

let t, admin, sup, rec, pt1, ort, cfg;
let A, B, C, visitB, visitA;
const dept = (n) => cfg.departments.find((d) => d.name === n).id;
const code = (r) => r.body?.error?.code;
const mk = async (name, extra = {}) => (await rec.post('/api/patients', { name, confirm_duplicate: true, ...extra })).body;
const arrive = async (p, dep) => { const r = (await rec.post('/api/registrations', { patient_id: p.id, department_id: dept(dep) })).body; return r.visit?.id ?? r.visit_id; };
const qEntry = (visit) => t.db.prepare('SELECT * FROM queue_entries WHERE visit_id=? ORDER BY id DESC').get(visit);
const audits = async () => { const b = (await admin.get('/api/audit')).body; return b.rows ?? b; };
const propose = (dup, surv, extra = {}) => sup.post('/api/patients/links', { duplicate_id: dup.id, survivor_id: surv.id, reason: 'Same person: same phone, same name, registered twice at the front desk', ...extra });

before(async () => {
  t = await boot();
  [admin, sup, rec, pt1, ort] = await Promise.all(['admin', 'super', 'reception', 'pt.one', 'dr.ort'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
  A = await mk('Linked Person One', { phone: '0505550101', dob: '1990-01-01', sex: 'M' });
  B = await mk('Linked Persn One', { phone: '0505550101', dob: '1990-01-01', sex: 'M' });
  C = await mk('Different Dob Person', { phone: '0505550999', dob: '1985-05-05', sex: 'M' });
  visitB = await arrive(B, 'Physiotherapy'); visitA = await arrive(A, 'Orthopedics');
});
after(() => t.close());

test('S11-1 candidates are found by phone or by name and date of birth, for managers only', async () => {
  const list = (await sup.get('/api/patients/duplicate-candidates')).body;
  assert.ok(list.some((x) => [x.a.id, x.b.id].sort().join() === [A.id, B.id].sort().join()), 'the pair is listed');
  const row = list.find((x) => x.a.id === A.id || x.b.id === A.id); assert.ok(row.a.visit_count >= 1 && Array.isArray(row.a.departments) && row.a.open);
  for (const who of [rec, pt1, ort]) assert.equal((await who.get('/api/patients/duplicate-candidates')).status, 403);
});

test('S11-2 reception can report a suspected duplicate but cannot link; managers review the flags', async () => {
  const f = await rec.post('/api/patients/flag-duplicate', { patient_id: A.id, other_patient_id: C.id, reason: 'Looks like the same family member' }); assert.equal(f.status, 201);
  assert.equal(code(await rec.post('/api/patients/flag-duplicate', { patient_id: C.id, other_patient_id: A.id, reason: 'again' })), 'ALREADY_FLAGGED');
  assert.equal(code(await rec.post('/api/patients/flag-duplicate', { patient_id: A.id, other_patient_id: A.id, reason: 'same one' })), 'VALIDATION');
  assert.equal((await pt1.post('/api/patients/flag-duplicate', { patient_id: A.id, other_patient_id: C.id, reason: 'clinician' })).status, 403);
  assert.equal((await rec.post('/api/patients/links', { duplicate_id: B.id, survivor_id: A.id, reason: 'Reception tries to link directly' })).status, 403);
  const v = (await sup.get('/api/patients/links')).body; assert.equal(v.flags.length, 1);
  assert.equal((await sup.post(`/api/patients/flags/${v.flags[0].id}/dismiss`)).status, 200);
  assert.equal((await sup.get('/api/patients/links')).body.flags.length, 0);
});

test('S11-3 a proposal needs a reason, different records, no open work, and acknowledgement of conflicting details', async () => {
  assert.equal(code(await sup.post('/api/patients/links', { duplicate_id: B.id, survivor_id: A.id, reason: 'too short' })), 'VALIDATION');
  assert.equal(code(await sup.post('/api/patients/links', { duplicate_id: A.id, survivor_id: A.id, reason: 'Same record twice, should be refused' })), 'VALIDATION');
  const busy = await propose(B, A); assert.equal(busy.status, 409); assert.equal(code(busy), 'OPEN_ACTIVITY'); assert.ok(busy.body.error.open.queue_entries >= 1);
  assert.equal((await rec.post(`/api/queue/${qEntry(visitB).id}/cancel`, { kind: 'CANCELLED', reason: 'Registered twice by mistake' })).status, 200);
  const conflict = await propose(C, A); assert.equal(code(conflict), 'DEMOGRAPHIC_CONFLICT'); assert.deepEqual(conflict.body.error.conflicts, ['dob']);
  const ok = await propose(C, A, { acknowledge_conflicts: true }); assert.equal(ok.status, 201); assert.deepEqual(ok.body.conflicts, ['dob']);
  assert.equal((await sup.post(`/api/patients/links/${ok.body.id}/reject`, { note: 'Not the same person after all' })).status, 200, 'the proposer can withdraw');
  assert.equal(code(await sup.post(`/api/patients/links/${ok.body.id}/reject`, { note: 'again please' })), 'NOT_PENDING');
});

let link;
test('S11-4 a link needs a different person to approve it; approval is audited, logged and alerted', async () => {
  const p = await propose(B, A); assert.equal(p.status, 201); link = p.body; assert.equal(link.status, 'PROPOSED');
  assert.equal(code(await propose(B, A)), 'ALREADY_LINKED', 'one live link per duplicate');
  assert.equal(code(await sup.post(`/api/patients/links/${link.id}/approve`, {})), 'SAME_PERSON');
  assert.equal((await rec.post(`/api/patients/links/${link.id}/approve`, {})).status, 403);
  const ok = await admin.post(`/api/patients/links/${link.id}/approve`, { note: 'Checked the ID card copies' }); assert.equal(ok.status, 200); assert.equal(ok.body.status, 'ACTIVE'); assert.equal(ok.body.approver, 'System Admin (Demo)');
  assert.ok((await audits()).some((x) => x.action === 'patient.link'));
  assert.ok((await admin.get('/api/security/alerts')).body.alerts.some((x) => x.kind === 'PATIENT_LINKED'));
  assert.ok(t.db.prepare("SELECT COUNT(*) c FROM patient_access_log WHERE kind='PATIENT_LINK' AND patient_id IN (?,?)").get(A.id, B.id).c >= 2, 'both records in the access log');
});

test('S11-5 no chains or loops, and nothing is deleted', async () => {
  const D = await mk('Chain Test Person', { phone: '0505550777' });
  assert.equal(code(await propose(D, B)), 'VALIDATION', 'the survivor cannot itself be a duplicate');
  assert.equal(code(await propose(A, D)), 'VALIDATION', 'a record that has duplicates cannot become a duplicate');
  assert.throws(() => t.db.exec('DELETE FROM patient_links'), /append-only/); assert.throws(() => t.db.exec('DELETE FROM duplicate_flags'), /append-only/);
  assert.ok(t.db.prepare('SELECT 1 FROM patients WHERE id=?').get(B.id), 'the duplicate record still exists');
  assert.equal(t.db.prepare('SELECT mrn FROM patients WHERE id=?').get(B.id).mrn, B.mrn, 'and keeps its EMR number');
});

test('S11-6 searching either EMR number finds the surviving record; the duplicate is not offered; scope covers the whole person', async () => {
  const viaDup = (await rec.get(`/api/patients?q=${encodeURIComponent(B.mrn)}`)).body; assert.equal(viaDup.length, 1); assert.equal(viaDup[0].id, A.id);
  assert.equal(viaDup[0].matched_via, B.mrn); assert.deepEqual(viaDup[0].also_known_as, [B.mrn]);
  const byName = (await rec.get(`/api/patients?q=${encodeURIComponent('Linked Pers')}`)).body; assert.equal(byName.filter((x) => x.mrn === B.mrn).length, 0, 'the duplicate itself is not a result'); assert.equal(byName.filter((x) => x.mrn === A.mrn).length, 1, 'and the person appears once');
  // physiotherapy only ever saw the duplicate record (visit in Physiotherapy): the person is found through it
  assert.equal((await pt1.get(`/api/patients?q=${encodeURIComponent('Linked Pers')}`)).body.length, 1);
  // /api/search by EMR number includes the linked family's visits
  const s = (await admin.get(`/api/search?mrn=${A.mrn}`)).body; const rows = s.rows ?? s.visits ?? s; assert.ok(rows.some((r) => r.visit_id === visitB || r.id === visitB || JSON.stringify(r).includes(B.mrn)), 'visits of the linked record appear when searching the surviving EMR number');
});

test('S11-7 new work cannot go on the duplicate record, only on the surviving one', async () => {
  const r = await rec.post('/api/registrations', { patient_id: B.id, department_id: dept('Physiotherapy') }); assert.equal(r.status, 409); assert.equal(code(r), 'PATIENT_LINKED'); assert.equal(r.body.error.survivor.mrn, A.mrn);
  assert.equal(code(await rec.post('/api/visits/checkin', { patientId: B.id, departmentId: dept('Physiotherapy') })), 'PATIENT_LINKED');
  assert.equal(code(await rec.post('/api/appointments', { patient_id: B.id, department_id: dept('Physiotherapy'), scheduled_at: new Date(Date.now() + 864e5).toISOString() })), 'PATIENT_LINKED');
  const day = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
  const bk = await rec.post('/api/schedule/appointments', { patient_id: B.id, department_id: dept('Physiotherapy'), date: day, time: '10:00', duration_minutes: 30 }); assert.equal(code(bk), 'PATIENT_LINKED');
  assert.equal(code(await rec.post('/api/schedule/waiting', { patient_id: B.id, department_id: dept('Physiotherapy') })), 'PATIENT_LINKED');
  const okR = await rec.post('/api/registrations', { patient_id: A.id, department_id: dept('Sports Injury Treatment') }); assert.equal(okR.status, 201, 'the surviving record works normally');
  const e = qEntry(okR.body.visit?.id ?? okR.body.visit_id); await rec.post(`/api/queue/${e.id}/cancel`, { kind: 'NO_SHOW' });
});

test('S11-8 history shows both records together, labelled, and only what the person may see', async () => {
  const h = (await admin.get(`/api/patients/${B.id}/history`)).body; assert.equal(h.patient.id, A.id); assert.deepEqual(h.also_known_as, [B.mrn]); assert.equal(h.requested, B.mrn);
  const mrns = new Set(h.visits.map((v) => v.mrn)); assert.ok(mrns.has(A.mrn) && mrns.has(B.mrn), 'visits of both records');
  assert.ok(h.visits.some((v) => v.from_linked_record === true && v.mrn === B.mrn));
  const own = (await pt1.get(`/api/patients/${A.id}/history`)).body; assert.ok(own.visits.length >= 1 && own.visits.every((v) => v.departments.includes('Physiotherapy') || v.departments.length === 0 || v.id !== visitA), 'physiotherapy sees its own visits');
  assert.ok(!own.visits.some((v) => v.id === visitA), 'but not the orthopedic visit of the same person');
  const x = await ort.get(`/api/patients/${A.id}/history`); assert.equal(x.status, 200); assert.ok(x.body.visits.some((v) => v.id === visitA));
  const none = await mk('Nobody Visits Me'); assert.equal((await pt1.get(`/api/patients/${none.id}/history`)).status, 403, 'a scoped user with nothing visible is refused');
  assert.equal((await admin.get('/api/patients/999999/history')).status, 404);
});

test('S11-9 emergency (break-glass) access to either record covers the whole person', async () => {
  await admin.patch('/api/config/settings', { break_glass_enabled: '1' });
  assert.equal((await pt1.get(`/api/visits/${visitA}/timeline`)).status, 403);
  const g = await pt1.post('/api/break-glass', { mrn: B.mrn, reason: 'Patient unwell in the corridor, need history now' }); assert.equal(g.status, 201);
  assert.ok(g.body.visits.length >= 2, 'both records’ visits are offered');
  assert.equal((await pt1.get(`/api/visits/${visitA}/timeline`)).status, 200, 'a grant on the duplicate opens the surviving record’s visit');
  await admin.patch('/api/config/settings', { break_glass_enabled: '0' });
});

test('S11-10 only an administrator can undo; afterwards both records are independent again', async () => {
  assert.equal((await sup.post(`/api/patients/links/${link.id}/undo`, { reason: 'We were wrong about this' })).status, 403);
  assert.equal(code(await admin.post(`/api/patients/links/${link.id}/undo`, { reason: 'short' })), 'VALIDATION');
  const u = await admin.post(`/api/patients/links/${link.id}/undo`, { reason: 'Two different people with the same phone' }); assert.equal(u.status, 200); assert.equal(u.body.status, 'UNDONE');
  assert.equal(code(await admin.post(`/api/patients/links/${link.id}/undo`, { reason: 'once more please' })), 'NOT_ACTIVE');
  assert.ok((await audits()).some((x) => x.action === 'patient.link.undo'));
  assert.equal((await rec.post('/api/registrations', { patient_id: B.id, department_id: dept('Physiotherapy') })).status, 201, 'the record takes new work again');
  const found = (await rec.get(`/api/patients?q=${encodeURIComponent('Linked Pers')}`)).body; assert.equal(found.length, 2, 'both appear in search');
  assert.equal((await propose(B, A)).status, 409, 'B has a live visit now, so a new link must wait (and the old one stays in the history)');
  assert.ok(t.db.prepare("SELECT COUNT(*) c FROM patient_links WHERE status='UNDONE'").get().c === 1, 'the undone link is kept');
});

test('S11-11 every new route is protected by its permission', async () => {
  for (const who of [rec, pt1, ort]) { assert.equal((await who.get('/api/patients/links')).status, 403); assert.equal((await who.post('/api/patients/links/1/approve', {})).status, 403); }
  assert.equal((await sup.post('/api/patients/links/1/undo', { reason: 'not an administrator' })).status, 403);
  assert.equal((await pt1.post('/api/patients/flags/1/dismiss')).status, 403);
});
