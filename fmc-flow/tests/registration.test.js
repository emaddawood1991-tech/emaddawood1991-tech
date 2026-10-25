import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { boot } from './helpers.js';
import { openDb } from '../server/db.js';
import { seed } from '../server/seed.js';
import { normalizePhone } from '../server/registration.js';

let t, rec, admin, pt, sup, cfg;
const dept = (n) => cfg.departments.find((d) => d.name === n);
const svc = (n) => cfg.services.find((s) => s.name === n);
const count = () => t.ops.one('SELECT COUNT(*) c FROM patients').c;
const reg = (body) => rec.post('/api/patients', body);

before(async () => {
  t = await boot();
  [rec, admin, pt, sup] = await Promise.all(['reception', 'admin', 'pt.one', 'super'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
});
after(() => t.close());

test('catalog: only current FMC departments are active; OT and Speech Therapy are not offered', () => {
  const active = cfg.departments.filter((d) => d.active).map((d) => d.name).sort();
  assert.deepEqual(active, ['General Medicine', 'Neurological Rehabilitation', 'Orthopedics', 'Physiotherapy', 'Rehabilitation', 'Sports Injury Treatment']);
  assert.ok(!cfg.services.some((s) => /Occupational|Speech|OT |ST /.test(s.name)));
  assert.ok(cfg.services.some((s) => s.name === 'Postoperative Rehabilitation'));
});

test('catalog migration: an older database retires OT/ST without deleting history, and is idempotent', () => {
  const db = openDb(':memory:');
  seed(db); db.exec("DELETE FROM settings WHERE key='catalog_v2'");
  db.exec("INSERT INTO departments(name,name_ar,queue_prefix) VALUES ('Occupational Therapy','x','T'),('Speech Therapy','y','X')");
  db.exec("INSERT INTO services(department_id,name) SELECT id,'OT Session' FROM departments WHERE name='Occupational Therapy'");
  db.exec("INSERT INTO rooms(department_id,code,name) SELECT id,'OT-01','OT Room' FROM departments WHERE name='Occupational Therapy'");
  db.exec("INSERT INTO patients(mrn,name,created_at) VALUES ('HIST-1','History Patient','2025-01-01T00:00:00Z')");
  db.exec("INSERT INTO visits(patient_id,status,arrived_at,departed_at) VALUES (last_insert_rowid(),'CHECKED_OUT','2025-01-01T00:00:00Z','2025-01-01T01:00:00Z')");
  db.exec("INSERT INTO queue_entries(visit_id,department_id,number,display,status,created_at) SELECT 1,id,1,'T001','DONE','2025-01-01T00:00:00Z' FROM departments WHERE name='Occupational Therapy'");
  assert.equal(seed(db), true);
  const row = (sql) => db.prepare(sql).get();
  assert.equal(row("SELECT active a FROM departments WHERE name='Occupational Therapy'").a, 0);
  assert.equal(row("SELECT active a FROM departments WHERE name='Speech Therapy'").a, 0);
  assert.equal(row("SELECT active a FROM services WHERE name='OT Session'").a, 0);
  assert.equal(row("SELECT active a FROM rooms WHERE code='OT-01'").a, 0);
  assert.equal(row('SELECT COUNT(*) c FROM queue_entries').c, 1, 'historical queue record kept');
  assert.equal(row('SELECT COUNT(*) c FROM visits').c, 1, 'historical visit kept');
  assert.equal(seed(db), false, 'second run changes nothing');
});

test('manual MRN is saved exactly (normalised), and a duplicate MRN is rejected without overwriting', async () => {
  const r = await reg({ mrn_mode: 'manual', mrn: ' fmc-10045 ', name: 'Synthetic Manual One' });
  assert.equal(r.status, 201, JSON.stringify(r.body)); assert.equal(r.body.mrn, 'FMC-10045');
  const before = count();
  const dup = await reg({ mrn_mode: 'manual', mrn: 'FMC-10045', name: 'Different Person' });
  assert.equal(dup.status, 409); assert.equal(dup.body.error.code, 'MRN_DUPLICATE');
  assert.equal(dup.body.error.existing.name, 'Synthetic Manual One');
  assert.equal(count(), before);
  assert.equal(t.ops.one('SELECT name FROM patients WHERE mrn=?', 'FMC-10045').name, 'Synthetic Manual One', 'not silently overwritten');
  const lower = await reg({ mrn_mode: 'manual', mrn: 'fmc-10045', name: 'Case Variant' });
  assert.equal(lower.body.error.code, 'MRN_DUPLICATE', 'case-insensitive uniqueness');
  assert.equal((await reg({ mrn_mode: 'manual', mrn: '!!', name: 'Bad Mrn' })).body.error.fields.mrn.length > 0, true);
});

test('automatic MRN is generated, unique, and skips MRNs already taken manually', async () => {
  await reg({ mrn_mode: 'manual', mrn: `MRN-${String(count() + 1).padStart(6, '0')}`, name: 'Takes The Next Number' });
  const a = await reg({ mrn_mode: 'auto', name: 'Synthetic Auto One' });
  const b = await reg({ mrn_mode: 'auto', name: 'Synthetic Auto Two' });
  assert.equal(a.status, 201); assert.equal(b.status, 201);
  assert.match(a.body.mrn, /^MRN-\d{6}$/); assert.notEqual(a.body.mrn, b.body.mrn);
});

test('English and Arabic names are saved; Arabic field must contain Arabic letters; required-ness is configurable', async () => {
  const ok = await reg({ name: 'Synthetic Bilingual', name_ar: 'مريض تجريبي ثنائي' });
  assert.equal(ok.body.name_ar, 'مريض تجريبي ثنائي');
  assert.equal(t.ops.one('SELECT name_ar FROM patients WHERE id=?', ok.body.id).name_ar, 'مريض تجريبي ثنائي');
  assert.ok((await reg({ name: 'Latin In Arabic', name_ar: 'Latin only' })).body.error.fields.name_ar);
  assert.ok((await reg({ name: '' })).body.error.fields.name, 'English name is required');
  assert.equal((await reg({ name: 'No Arabic Given' })).status, 201, 'optional by default');
  assert.equal((await admin.patch('/api/config/settings', { registration_require_name_ar: '1' })).status, 200);
  assert.ok((await reg({ name: 'Needs Arabic Now' })).body.error.fields.name_ar);
  await admin.patch('/api/config/settings', { registration_require_name_ar: '0' });
  assert.equal((await rec.get('/api/patients?q=' + encodeURIComponent('ثنائي'))).body.length, 1, 'Arabic search');
});

test('date of birth: stored exactly as a calendar date; future and impossible dates rejected', async () => {
  const ok = await reg({ name: 'Synthetic Dob', dob: '1990-03-15' });
  assert.equal(ok.body.dob, '1990-03-15'); assert.equal(t.ops.one('SELECT dob FROM patients WHERE id=?', ok.body.id).dob, '1990-03-15');
  const tomorrow = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
  assert.ok((await reg({ name: 'Future Dob', dob: tomorrow })).body.error.fields.dob);
  assert.ok((await reg({ name: 'Bad Dob', dob: '2024-02-30' })).body.error.fields.dob);
  assert.ok((await reg({ name: 'Bad Dob 2', dob: '15/03/1990' })).body.error.fields.dob);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());
  assert.equal((await reg({ name: 'Born Today', dob: today })).status, 201);
});

test('phone numbers: UAE formats normalised, international kept, invalid rejected', async () => {
  for (const [input, want] of [['050 123 4567', '+971501234567'], ['0501234567', '+971501234567'], ['+971 50 123 4567', '+971501234567'], ['00971501234567', '+971501234567'], ['04 123 4567', '+97141234567'], ['+44 7700 900123', '+447700900123'], ['+91 98765 43210', '+919876543210'], ['+1 (415) 555-0132', '+14155550132']])
    assert.equal(normalizePhone(input).value, want, `${input} → ${want}`);
  assert.equal(normalizePhone('٠٥٠١٢٣٤٥٦٧').value, '+971501234567', 'Arabic-Indic digits');
  for (const bad of ['12345', '+971 1 2345', 'abcdefg', '+0 123456789', '+44']) assert.ok(normalizePhone(bad).error, `${bad} rejected`);
  const ok = await reg({ name: 'Synthetic Phone', phone: '+44 7700 900123' });
  assert.equal(ok.body.phone, '+447700900123');
  assert.ok((await reg({ name: 'Bad Phone', phone: '12345' })).body.error.fields.phone);
});

test('gender options are configurable and validated', async () => {
  assert.equal((await reg({ name: 'Synthetic Female', sex: 'F' })).body.sex, 'F');
  assert.ok((await reg({ name: 'Unknown Gender', sex: 'Z' })).body.error.fields.sex);
  assert.equal((await admin.patch('/api/config/settings', { gender_options: [{ code: 'M', en: 'Male', ar: 'ذكر' }, { code: 'F', en: 'Female', ar: 'أنثى' }, { code: 'X', en: 'Unspecified', ar: 'غير محدد' }] })).status, 200);
  assert.equal((await reg({ name: 'Synthetic Unspecified', sex: 'X' })).status, 201);
  assert.equal((await admin.patch('/api/config/settings', { gender_options: [{ code: 'M', en: '' }] })).status, 400);
  assert.equal((await admin.patch('/api/config/settings', { gender_options: [{ code: 'M', en: 'Male' }, { code: 'M', en: 'Dup' }] })).status, 400);
});

test('register and check in: patient, visit and queue entry are created together in the chosen department', async () => {
  const before = count();
  const d = dept('Neurological Rehabilitation');
  const r = await rec.post('/api/registrations', { idem_key: 'k-reg-1', patient: { mrn_mode: 'auto', name: 'Synthetic Neuro Patient', name_ar: 'مريض عصبي', dob: '1985-06-01', sex: 'M', phone: '050 765 4321' }, department_id: d.id, service_id: svc('Neurological Assessment').id });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(count(), before + 1);
  assert.match(r.body.queue.display, /^N\d{3}$/); assert.equal(r.body.queue.department_id, d.id);
  const q = (await rec.get('/api/queue')).body.entries.find((e) => e.visit_id === r.body.visit.id);
  assert.equal(q.department, 'Neurological Rehabilitation'); assert.equal(q.service, 'Neurological Assessment');
  const tl = (await rec.get(`/api/visits/${r.body.visit.id}/timeline`)).body.events.map((e) => e.type);
  assert.deepEqual(tl, ['ARRIVED', 'QUEUE_ENTERED']);
});

test('department is required; services must belong to the department; clinicians must be in it; service can be made mandatory', async () => {
  const noDept = await rec.post('/api/registrations', { patient: { name: 'No Department' } });
  assert.equal(noDept.status, 400); assert.ok(noDept.body.error.fields.department_id);
  const n = count();
  const wrong = await rec.post('/api/registrations', { patient: { name: 'Wrong Service' }, department_id: dept('Physiotherapy').id, service_id: svc('Neurological Assessment').id });
  assert.equal(wrong.status, 400); assert.ok(wrong.body.error.fields.service_id);
  assert.equal(count(), n, 'whole registration rolled back — no orphan patient');
  const clin = cfg.departments && (await rec.get('/api/staff')).body.find((s) => s.username === 'dr.ort');
  const wrongClin = await rec.post('/api/registrations', { patient: { name: 'Wrong Clinician' }, department_id: dept('Physiotherapy').id, clinician_id: clin.id });
  assert.equal(wrongClin.status, 400); assert.equal(count(), n);
  await admin.patch('/api/config/settings', { require_service_at_checkin: '1' });
  assert.ok((await rec.post('/api/registrations', { patient: { name: 'Needs Service' }, department_id: dept('Physiotherapy').id })).body.error.fields.service_id);
  await admin.patch('/api/config/settings', { require_service_at_checkin: '0' });
  assert.equal((await rec.post('/api/registrations', { patient: { name: 'Service Optional' }, department_id: dept('Physiotherapy').id })).status, 201);
});

test('search by MRN, English name, Arabic name and phone; check in an existing patient without creating a duplicate', async () => {
  const made = (await rec.post('/api/registrations', { patient: { mrn_mode: 'manual', mrn: 'FMC-77001', name: 'Synthetic Findable', name_ar: 'مريض قابل للبحث', phone: '+971 52 111 2233' }, department_id: dept('Physiotherapy').id })).body;
  await rec.post(`/api/visits/${made.visit.id}/checkout`);
  const find = async (q) => (await rec.get(`/api/patients?q=${encodeURIComponent(q)}`)).body;
  for (const q of ['FMC-77001', 'Findable', 'قابل للبحث', '0521112233', '+971521112233', '521112233']) assert.ok((await find(q)).some((p) => p.id === made.patient.id), `found by ${q}`);
  const n = count();
  const again = await rec.post('/api/registrations', { patient_id: made.patient.id, department_id: dept('Orthopedics').id });
  assert.equal(again.status, 201); assert.equal(again.body.created, false);
  assert.equal(count(), n, 'no duplicate patient');
  assert.equal(again.body.queue.department_id, dept('Orthopedics').id);
  // same patient attends a different department on a different visit
  await rec.post(`/api/visits/${again.body.visit.id}/checkout`);
  const third = await rec.post('/api/registrations', { patient_id: made.patient.id, department_id: dept('Rehabilitation').id, service_id: svc('Postoperative Rehabilitation').id });
  const depts = t.ops.q('SELECT DISTINCT department_id d FROM queue_entries qe JOIN visits v ON v.id=qe.visit_id WHERE v.patient_id=?', made.patient.id).map((r) => r.d).sort();
  assert.deepEqual(depts, [dept('Physiotherapy').id, dept('Orthopedics').id, dept('Rehabilitation').id].sort());
  assert.equal(third.status, 201);
  assert.ok(!t.ops.q('PRAGMA table_info(patients)').some((c) => /depart/i.test(c.name)), 'department is never stored on the patient');
  const open = (await rec.get('/api/patients?q=FMC-77001')).body[0];
  assert.ok(open.open_visit_id, 'search tells reception the patient already has an open visit');
});

test('double-clicking Save cannot create two patients (idempotency key) and a repeat check-in is not queued twice', async () => {
  const n = count();
  const body = { idem_key: 'dbl-1', patient: { name: 'Synthetic Double Click' }, department_id: dept('General Medicine').id };
  const [a, b] = await Promise.all([rec.post('/api/registrations', body), rec.post('/api/registrations', body)]);
  assert.deepEqual([a.status, b.status].sort(), [200, 201]);
  assert.equal(count(), n + 1);
  assert.equal(a.body.patient.id, b.body.patient.id);
  assert.equal(t.ops.one('SELECT COUNT(*) c FROM queue_entries WHERE visit_id=?', a.body.visit.id).c, 1);
  const p1 = await reg({ idem_key: 'dbl-2', name: 'Synthetic Save Twice' }); const p2 = await reg({ idem_key: 'dbl-2', name: 'Synthetic Save Twice' });
  assert.equal(p1.body.id, p2.body.id); assert.equal(p2.body.replayed, true);
  assert.equal((await reg({ idem_key: 'dbl-1', name: 'x' })).body.error.code, 'IDEMPOTENCY_KEY_REUSED');
});

test('possible duplicate people are flagged and need confirmation', async () => {
  await reg({ name: 'Synthetic Same Person', dob: '1980-01-01', phone: '+971 50 999 8877' });
  const dupPhone = await reg({ name: 'Another Name', phone: '0509998877' });
  assert.equal(dupPhone.status, 409); assert.equal(dupPhone.body.error.code, 'POSSIBLE_DUPLICATE'); assert.equal(dupPhone.body.error.candidates.length, 1);
  const dupName = await reg({ name: 'synthetic same person', dob: '1980-01-01' });
  assert.equal(dupName.body.error.code, 'POSSIBLE_DUPLICATE');
  assert.equal((await reg({ name: 'Another Name', phone: '0509998877', confirm_duplicate: true })).status, 201);
});

test('records persist across a refresh (new session) and a full database restart', async () => {
  const fresh = await t.login('reception');
  assert.ok((await fresh.get('/api/patients?q=FMC-10045')).body.some((p) => p.name === 'Synthetic Manual One'));
  const path = join(mkdtempSync(join(tmpdir(), 'fmcreg-')), 'p.db');
  const db1 = openDb(path); seed(db1);
  db1.prepare('INSERT INTO patients(mrn,name,name_ar,dob,sex,phone,created_at) VALUES (?,?,?,?,?,?,?)').run('PERSIST-1', 'Persist Me', 'ثابت', '1991-02-03', 'F', '+971501110000', 'x'); db1.close();
  const db2 = openDb(path); const row = db2.prepare('SELECT * FROM patients WHERE mrn=?').get('PERSIST-1'); db2.close();
  assert.deepEqual([row.name, row.name_ar, row.dob, row.sex, row.phone], ['Persist Me', 'ثابت', '1991-02-03', 'F', '+971501110000']);
});

test('only reception and admin can register patients; clinicians, supervisors and signed-out users cannot', async () => {
  for (const who of [pt, sup]) {
    assert.equal((await who.post('/api/patients', { name: 'Blocked' })).status, 403);
    assert.equal((await who.post('/api/registrations', { patient: { name: 'Blocked' }, department_id: dept('Physiotherapy').id })).status, 403);
  }
  assert.equal((await fetch(`${t.base}/api/patients`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: '{"name":"x"}' })).status, 401);
  assert.equal((await fetch(`${t.base}/api/registrations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 401);
  assert.equal(t.ops.one("SELECT COUNT(*) c FROM patients WHERE name='Blocked'").c, 0);
  assert.equal((await admin.post('/api/patients', { name: 'Admin Registered' })).status, 201);
});

test('deactivated services cannot be selected, but historical sessions stay readable', async () => {
  const s = svc('Rehabilitation Session');
  assert.equal((await admin.patch(`/api/config/services/${s.id}`, { active: 0 })).status, 200);
  const r = await rec.post('/api/registrations', { patient: { name: 'Inactive Service Try' }, department_id: dept('Rehabilitation').id, service_id: s.id });
  assert.equal(r.status, 400); assert.ok(r.body.error.fields.service_id);
  await admin.patch(`/api/config/services/${s.id}`, { active: 1 });
});

test('registration writes audit entries without storing patient details', async () => {
  const log = (await admin.get('/api/audit?limit=500')).body.filter((a) => a.action === 'patient.create');
  assert.ok(log.length > 5);
  assert.ok(log.every((a) => !/Synthetic|\+971|1990-03-15/.test(a.detail)), 'no PHI in audit detail');
});
