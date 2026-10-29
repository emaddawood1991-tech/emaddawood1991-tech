// Daily Schedule: real server logic, persistent (in-memory SQLite) data, synthetic patients only.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';
import { zonedToIso, localOf } from '../server/schedule.js';
import { now } from '../server/ops.js';

let t, admin, rec, sup, pt1, ort, cfg, board0;
const DAY = '2030-03-05'; // a Tuesday, far from any seeded data
let seq = 0;
const dept = (n) => cfg.departments.find((d) => d.name === n);
const user = (u) => t.ops.one('SELECT id FROM users WHERE username=?', u).id;
const cat = (n) => t.ops.one('SELECT * FROM appointment_categories WHERE name=?', n);
const patient = async () => (await rec.post('/api/patients', { name: `Synthetic Sched ${++seq}` })).body.id;
const book = (who, b) => who.post('/api/schedule/appointments', b);
const boardOf = async (who = admin, q = '') => (await who.get(`/api/schedule/board?date=${DAY}${q}`)).body;
let physio, ptRow, ptRow2;
const base = (p, extra = {}) => ({ patient_id: p, department_id: dept('Physiotherapy').id, row_id: ptRow.id, date: DAY, time: '09:00', ...extra });

before(async () => {
  t = await boot();
  [admin, rec, sup, pt1, ort] = await Promise.all(['admin', 'reception', 'super', 'pt.one', 'dr.ort'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
  board0 = await boardOf();
  physio = board0.groups.find((g) => g.department_id === dept('Physiotherapy').id);
  ptRow = physio.rows.find((r) => r.user_id === user('pt.one')); ptRow2 = physio.rows.find((r) => r.user_id === user('pt.two'));
});
after(() => t.close());

test('1-2: the schedule page data opens for each role and the date can change', async () => {
  for (const who of [admin, rec, sup, pt1]) assert.equal((await who.get(`/api/schedule/board?date=${DAY}`)).status, 200);
  const a = await boardOf(); const b = (await admin.get('/api/schedule/board?date=2030-03-06')).body;
  assert.equal(a.date, DAY); assert.equal(b.date, '2030-03-06'); assert.equal(a.timezone, 'Asia/Dubai');
  assert.equal((await admin.get('/api/schedule/board?date=not-a-date')).status, 400);
});

test('staff rows come from existing active staff, groups have their own columns, nothing is hardcoded from the sheet', () => {
  assert.ok(physio.columns.length > 3); assert.ok(physio.rows.length >= 2);
  const names = physio.rows.map((r) => r.staff_name);
  assert.ok(names.includes('PT One (Demo)') && names.includes('PT Two (Demo)'));
  assert.equal(t.ops.one("SELECT COUNT(*) c FROM schedule_rows r JOIN users u ON u.id=r.user_id WHERE u.active=0").c, 0);
});

test('19: categories exist with colours, durations are configured by the administrator and not hardcoded', async () => {
  const names = board0.categories.map((c) => c.name);
  for (const n of ['Basic', 'Thiqa', 'Cash', 'Home Care', 'Fixed Appointment', 'Free Session', 'POD', 'Evaluation']) assert.ok(names.includes(n), n);
  assert.ok(board0.categories.every((c) => /^#[0-9a-f]{6}$/i.test(c.color)));
  assert.ok(board0.categories.every((c) => c.default_minutes == null), 'no durations are hardcoded');
  const c = cat('Cash');
  assert.equal((await admin.patch(`/api/config/appointment_categories/${c.id}`, { color: '#112233', default_minutes: 40 })).status, 200);
  assert.equal((await admin.patch(`/api/config/appointment_categories/${c.id}`, { color: 'red' })).status, 400);
  assert.equal((await admin.patch(`/api/config/appointment_categories/${c.id}`, { default_minutes: 3 })).status, 400);
  assert.equal((await rec.patch(`/api/config/appointment_categories/${c.id}`, { color: '#000000' })).status, 403, 'only an administrator configures categories');
  assert.equal((await admin.post('/api/config/appointment_categories', { name: 'Extra Cat', color: '#abcdef', default_minutes: 55 })).status, 201);
  assert.equal((await admin.post('/api/config/appointment_categories', { name: 'extra cat', color: '#abcdef' })).status, 400, 'duplicate name');
  assert.equal((await admin.patch(`/api/config/appointment_categories/${c.id}`, { active: 0 })).status, 200);
  assert.equal((await book(rec, base(await patient(), { category_id: c.id }))).status, 400, 'a deactivated category cannot be used');
  await admin.patch(`/api/config/appointment_categories/${c.id}`, { active: 1 });
});

test('7,10,11: create and save an appointment; it persists and shows in the right row; time zone is Asia/Dubai; no duplicate patient', async () => {
  const p = await patient(); const before = t.ops.one('SELECT COUNT(*) c FROM patients').c;
  const r = await book(rec, base(p, { time: '09:30', category_id: cat('Cash').id, notes: 'first visit' }));
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const a = r.body.appointments[0];
  assert.equal(a.scheduled_at, '2030-03-05T05:30:00.000Z', '09:30 Dubai is 05:30 UTC');
  assert.equal(a.duration_minutes, 40, 'the category default duration is used when none is typed'); assert.equal(a.start_local, '09:30');
  assert.equal(t.ops.one('SELECT COUNT(*) c FROM patients').c, before, 'booking never creates a patient');
  const row = (await boardOf()).groups.find((g) => g.id === physio.id).rows.find((x) => x.id === ptRow.id);
  assert.ok(row.appointments.some((x) => x.id === a.id && x.mrn && x.category === 'Cash' && x.category_color));
  assert.equal(localOf(a.scheduled_at, 'Asia/Dubai').time, '09:30'); assert.equal(zonedToIso('2030-03-05', '09:30', 'Asia/Dubai'), a.scheduled_at);
});

test('8: patient lookup by MRN, English name, Arabic name and phone reuses the existing patient database', async () => {
  const mk = await rec.post('/api/patients', { name: 'Synthetic Lookup', name_ar: 'مريض بحث', phone: '0501234567' });
  assert.equal(mk.status, 201);
  for (const term of [mk.body.mrn, 'Synthetic Lookup', 'مريض بحث', '0501234567']) assert.ok((await rec.get(`/api/patients?q=${encodeURIComponent(term)}`)).body.some((x) => x.id === mk.body.id), term);
});

test('17: conflicts — same clinician, same patient, exclusive row, capacity of shared rows; adjacent bookings are fine', async () => {
  const p1 = await patient(); const p2 = await patient();
  assert.equal((await book(rec, base(p1, { time: '11:00', duration_minutes: 45 }))).status, 201);
  const clin = await book(rec, base(p2, { time: '11:30' }));
  assert.equal(clin.status, 409); assert.equal(clin.body.error.code, 'CONFLICT'); assert.equal(clin.body.error.conflicts[0].type, 'CLINICIAN');
  assert.equal((await book(rec, base(p1, { time: '11:15', row_id: ptRow2.id, clinician_id: user('pt.two') }))).body.error.conflicts[0].type, 'PATIENT', 'the same patient cannot be in two places');
  assert.equal((await book(rec, base(p2, { time: '11:45' }))).status, 201, 'a booking that starts exactly when the other ends is allowed');
  // shared resource row with capacity 3
  const hall = await admin.post('/api/config/schedule_rows', { group_id: physio.id, label: 'Shared hall', capacity: 3, department_id: dept('Physiotherapy').id });
  assert.equal(hall.status, 201);
  const mk = (p) => book(rec, { patient_id: p, department_id: dept('Physiotherapy').id, row_id: hall.body.id, date: DAY, time: '14:00', duration_minutes: 30 });
  for (let i = 0; i < 3; i++) assert.equal((await mk(await patient())).status, 201);
  const full = await mk(await patient()); assert.equal(full.status, 409); assert.equal(full.body.error.conflicts[0].type, 'CAPACITY');
});

test('12-14: edit, reschedule (history kept), cancel with a reason; cancelled slots free up; every step is audited', async () => {
  const p = await patient();
  const a = (await book(rec, base(p, { time: '15:00' }))).body.appointments[0];
  const edit = await rec.patch(`/api/schedule/appointments/${a.id}`, { notes: 'bring report', category_id: cat('Basic').id });
  assert.equal(edit.status, 200); assert.equal(edit.body.notes, 'bring report');
  const mv = await rec.patch(`/api/schedule/appointments/${a.id}`, { date: '2030-03-06', time: '10:00' });
  assert.equal(mv.status, 200); assert.equal(mv.body.start_local, '10:00'); assert.equal(mv.body.date, '2030-03-06');
  const hist = (await rec.get(`/api/schedule/appointments/${a.id}/history`)).body.map((h) => h.action);
  assert.deepEqual(hist, ['CREATED', 'EDITED', 'RESCHEDULED']);
  assert.equal((await rec.post(`/api/schedule/appointments/${a.id}/cancel`, {})).status, 400, 'a reason is required');
  const c = await rec.post(`/api/schedule/appointments/${a.id}/cancel`, { reason: 'patient has no transport' });
  assert.equal(c.status, 200); assert.equal(c.body.status, 'CANCELLED');
  assert.equal((await rec.patch(`/api/schedule/appointments/${a.id}`, { notes: 'x' })).status, 409, 'cancelled appointments are read-only');
  assert.ok(t.ops.one('SELECT 1 x FROM appointments WHERE id=?', a.id), 'the record is kept');
  assert.deepEqual((await rec.get(`/api/schedule/appointments/${a.id}/history`)).body.map((h) => h.action).slice(-1), ['CANCELLED']);
  const acts = t.ops.q("SELECT action FROM audit_log WHERE entity='appointment' AND entity_id=?", String(a.id)).map((r) => r.action);
  for (const x of ['schedule.appointment.create', 'schedule.appointment.edit', 'schedule.appointment.reschedule', 'schedule.appointment.cancel']) assert.ok(acts.includes(x), x);
  assert.equal((await rec.patch(`/api/schedule/appointments/${a.id}`, {})).status, 409);
  assert.equal(t.ops.q('SELECT 1 FROM appointment_history WHERE appointment_id=?', a.id).length, 4);
  assert.throws(() => t.ops.run('DELETE FROM appointment_history WHERE appointment_id=?', a.id), 'history is append-only');
  // cancellations section + rebooking status
  let list = (await rec.get('/api/schedule/cancellations?from=2030-01-01&to=2030-12-31')).body;
  const row = list.find((x) => x.id === a.id); assert.equal(row.cancel_reason, 'patient has no transport'); assert.ok(row.cancelled_at && row.cancelled_by_name); assert.equal(row.reschedule_status, 'PENDING');
  await book(rec, base(p, { time: '16:00', rebooks_id: a.id }));
  list = (await rec.get('/api/schedule/cancellations?from=2030-01-01&to=2030-12-31')).body;
  assert.equal(list.find((x) => x.id === a.id).reschedule_status, 'REBOOKED');
});

test('15: recurring appointments — daily/weekly, end date or count, at most 52, conflicts reported or skipped', async () => {
  const p = await patient();
  const w = await book(rec, base(p, { time: '17:00', recurrence: { freq: 'weekly', count: 4 } }));
  assert.equal(w.status, 201); assert.equal(w.body.appointments.length, 4);
  assert.deepEqual(w.body.appointments.map((x) => x.date), ['2030-03-05', '2030-03-12', '2030-03-19', '2030-03-26']);
  assert.equal(new Set(w.body.appointments.map((x) => x.recurrence_id)).size, 1);
  const d = await book(rec, base(await patient(), { time: '18:00', recurrence: { freq: 'daily', until: '2030-03-08' } }));
  assert.equal(d.body.appointments.length, 4);
  assert.equal((await book(rec, base(await patient(), { time: '08:00', recurrence: { freq: 'daily', count: 53 } }))).status, 400, 'more than 52 is refused');
  assert.equal((await book(rec, base(await patient(), { time: '08:00', recurrence: { freq: 'weekly' } }))).status, 400, 'an end is required');
  assert.equal((await book(rec, base(await patient(), { time: '08:00', recurrence: { freq: 'daily', until: '2031-12-31' } }))).status, 400);
  const p2 = await patient();
  const clash = await book(rec, base(p2, { time: '17:00', recurrence: { freq: 'weekly', count: 3 } }));
  assert.equal(clash.status, 409); assert.ok(/Nothing was booked/.test(clash.body.error.message)); assert.equal(t.ops.one("SELECT COUNT(*) c FROM appointments WHERE patient_id=?", p2).c, 0, 'all or nothing');
  const skip = await book(rec, base(p2, { time: '17:00', recurrence: { freq: 'weekly', count: 3 }, skip_conflicts: true }));
  assert.equal(skip.status, 409, 'every date clashes here, so nothing is booked even when skipping');
});

test('16: breaks block ordinary booking; only an administrator or an authorized supervisor can override, with a reason, and it is audited', async () => {
  const b = await sup.post('/api/schedule/blocks', { row_id: ptRow2.id, date: DAY, start_time: '12:00', end_time: '13:00', kind: 'BREAK', note: 'lunch' });
  assert.equal(b.status, 201, JSON.stringify(b.body));
  assert.equal((await rec.post('/api/schedule/blocks', { row_id: ptRow2.id, date: DAY, start_time: '12:00', end_time: '13:00' })).status, 403, 'reception cannot create blocks');
  assert.equal((await book(rec, base(await patient(), { row_id: ptRow2.id, time: '12:15' }))).body.error.conflicts[0].type, 'BLOCK');
  const rb = (await boardOf()).groups.find((g) => g.id === physio.id).rows.find((r) => r.id === ptRow2.id);
  assert.ok(rb.blocks.some((x) => x.kind === 'BREAK' && x.note === 'lunch' && x.start_local === '12:00'));
  const noReason = await book(admin, base(await patient(), { row_id: ptRow2.id, time: '12:15' }));
  assert.equal(noReason.status, 409); assert.equal(noReason.body.error.overridable, true);
  assert.equal((await book(sup, base(await patient(), { row_id: ptRow2.id, time: '12:15', override: { reason: 'urgent' } }))).status, 409, 'a supervisor without the authorization cannot override');
  assert.equal((await admin.patch(`/api/config/staff/${user('super')}`, { schedule_override: 1 })).status, 200);
  const ok = await book(sup, base(await patient(), { row_id: ptRow2.id, time: '12:15', override: { reason: 'urgent referral' } }));
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
  assert.ok(t.ops.q("SELECT detail FROM audit_log WHERE action='schedule.block_override'").some((r) => r.detail.includes('urgent referral')), 'override reason is audited');
  assert.ok((await rec.get(`/api/schedule/appointments/${ok.body.appointments[0].id}/history`)).body[0].detail.override_reason);
  await admin.patch(`/api/config/staff/${user('super')}`, { schedule_override: 0 });
  const rm = await sup.post(`/api/schedule/blocks/${b.body.ids[0]}/remove`, {}); assert.equal(rm.status, 200);
  assert.equal((await book(rec, base(await patient(), { row_id: ptRow2.id, time: '13:00' }))).status, 201, 'a removed block no longer blocks');
  assert.equal(t.ops.one('SELECT active FROM schedule_blocks WHERE id=?', b.body.ids[0]).active, 0, 'kept for history, not deleted');
  const wk = await sup.post('/api/schedule/blocks', { row_id: ptRow2.id, date: DAY, start_time: '07:00', end_time: '07:30', kind: 'MEETING', recurrence: { freq: 'weekly', count: 3 } });
  assert.equal(wk.body.ids.length, 3);
  assert.equal((await sup.post('/api/schedule/blocks', { row_id: ptRow2.id, date: DAY, start_time: '08:00', end_time: '07:00' })).status, 400);
});

test('18: waiting list — add, update contact status, book into a slot', async () => {
  const p = await patient();
  const w = await rec.post('/api/schedule/waiting', { patient_id: p, department_id: dept('Physiotherapy').id, clinician_id: user('pt.one'), preferred_date: DAY, preferred_time: '19:00', contact_status: 'NOT_CONTACTED', notes: 'prefers evenings' });
  assert.equal(w.status, 201);
  assert.equal((await rec.patch(`/api/schedule/waiting/${w.body.id}`, { contact_status: 'CONTACTED' })).body.contact_status, 'CONTACTED');
  assert.ok((await rec.get('/api/schedule/waiting')).body.some((x) => x.id === w.body.id && x.mrn));
  const b = await book(rec, base(p, { time: '19:00', waiting_id: w.body.id }));
  assert.equal(b.status, 201);
  assert.ok(!(await rec.get('/api/schedule/waiting')).body.some((x) => x.id === w.body.id), 'booked entries leave the waiting list');
  assert.equal(t.ops.one('SELECT appointment_id FROM waiting_list WHERE id=?', w.body.id).appointment_id, b.body.appointments[0].id);
  assert.equal((await rec.patch(`/api/schedule/waiting/${w.body.id}`, { notes: 'x' })).status, 409, 'a booked entry is closed');
  const w2 = await rec.post('/api/schedule/waiting', { patient_id: await patient(), department_id: dept('Physiotherapy').id });
  assert.equal((await rec.patch(`/api/schedule/waiting/${w2.body.id}`, { status: 'BOOKED' })).status, 400, 'only booking an appointment marks an entry booked');
  assert.equal((await rec.patch(`/api/schedule/waiting/${w2.body.id}`, { status: 'REMOVED' })).status, 200);
});

test('follow-up and approval call lists: create, assign, due date, complete', async () => {
  const p = await patient();
  const f = await rec.post('/api/schedule/tasks', { kind: 'FOLLOW_UP', patient_id: p, notes: 'call after session', assigned_to: user('reception'), due_date: DAY });
  assert.equal(f.status, 201);
  const a = await rec.post('/api/schedule/tasks', { kind: 'APPROVAL', patient_id: p, notes: 'awaiting approval' }); assert.equal(a.status, 201);
  assert.equal((await rec.get('/api/schedule/tasks?kind=FOLLOW_UP')).body.every((x) => x.kind === 'FOLLOW_UP'), true);
  assert.equal((await rec.patch(`/api/schedule/tasks/${f.body.id}`, { status: 'IN_PROGRESS' })).body.status, 'IN_PROGRESS');
  const done = (await rec.patch(`/api/schedule/tasks/${f.body.id}`, { status: 'DONE' })).body; assert.ok(done.completed_at && done.status === 'DONE');
  assert.ok(!(await rec.get('/api/schedule/tasks?kind=FOLLOW_UP')).body.some((x) => x.id === f.body.id), 'completed tasks leave the open list');
  assert.ok((await rec.get('/api/schedule/tasks?kind=FOLLOW_UP&status=all')).body.some((x) => x.id === f.body.id));
  assert.equal((await rec.post('/api/schedule/tasks', { kind: 'NOPE', patient_id: p })).status, 400);
  assert.equal((await rec.post('/api/schedule/tasks', { kind: 'REJECTION' })).status, 400, 'a patient or a title is needed');
});

test('3-6: administrators add rows and columns, edit and reorder them; hiding keeps data; removal is refused when in use', async () => {
  const row = await admin.post('/api/config/schedule_rows', { group_id: physio.id, label: 'Evaluation row', capacity: 1, department_id: dept('Physiotherapy').id });
  assert.equal(row.status, 201);
  assert.equal((await admin.post('/api/config/schedule_rows', { group_id: physio.id, capacity: 1 })).status, 400, 'a row needs a name or a staff member');
  assert.equal((await admin.patch(`/api/config/schedule_rows/${row.body.id}`, { label: 'Eval renamed', label_ar: 'تقييم' })).body.label, 'Eval renamed');
  const ids = (await boardOf()).groups.find((g) => g.id === physio.id).rows.map((r) => r.id).reverse();
  assert.equal((await admin.post('/api/schedule/rows/reorder', { ids })).status, 200);
  assert.deepEqual((await boardOf()).groups.find((g) => g.id === physio.id).rows.map((r) => r.id), ids, 'the new order is saved');
  assert.equal((await rec.post('/api/schedule/rows/reorder', { ids })).status, 403);
  // columns: custom times and intervals per group
  const col = await admin.post('/api/config/schedule_columns', { group_id: physio.id, time: '19:50', label: 'late' }); assert.equal(col.status, 201);
  assert.equal((await admin.post('/api/config/schedule_columns', { group_id: physio.id, time: '19:50' })).status, 400, 'duplicate time');
  assert.equal((await admin.post('/api/config/schedule_columns', { group_id: physio.id, time: '25:00' })).status, 400);
  assert.equal((await admin.patch(`/api/config/schedule_columns/${col.body.id}`, { time: '07:05', label: 'early' })).status, 200);
  assert.equal((await boardOf()).groups.find((g) => g.id === physio.id).columns[0].time, '07:05', 'columns are always in time order');
  const bulk = await admin.post('/api/schedule/columns/bulk', { group_id: physio.id, start: '20:00', end: '21:00', interval: 20 }); assert.equal(bulk.body.added, 3);
  const grp = await admin.post('/api/config/schedule_groups', { name: 'Evening 20-min', department_id: dept('Physiotherapy').id, interval_minutes: 20 });
  assert.equal(grp.status, 201, 'different groups can use different intervals');
  assert.equal((await admin.post('/api/config/schedule_groups', { name: 'bad', interval_minutes: 2 })).status, 400);
  // hide / remove safely
  assert.equal((await admin.patch(`/api/config/schedule_columns/${col.body.id}`, { active: 0 })).status, 200);
  assert.ok(!(await boardOf()).groups.find((g) => g.id === physio.id).columns.some((c) => c.id === col.body.id), 'hidden columns leave the board');
  assert.ok((await boardOf(admin, '&include_hidden=1')).groups.find((g) => g.id === physio.id).columns.some((c) => c.id === col.body.id), 'but stay available to administrators');
  assert.equal((await admin.post(`/api/schedule/columns/${col.body.id}/remove`, {})).status, 200);
  const inUse = await admin.post(`/api/schedule/rows/${ptRow.id}/remove`, {}); assert.equal(inUse.status, 409); assert.equal(inUse.body.error.code, 'ROW_IN_USE');
  assert.equal((await admin.post(`/api/schedule/rows/${row.body.id}/remove`, {})).status, 200, 'an unused row can be removed');
  assert.ok(t.ops.one('SELECT COUNT(*) c FROM appointments').c > 5, 'removing layout never deletes appointments');
  // hiding a staff row keeps its appointments in the database and the staff record untouched
  assert.equal((await admin.patch(`/api/config/schedule_rows/${ptRow2.id}`, { active: 0 })).status, 200);
  assert.equal(t.ops.one('SELECT active FROM users WHERE id=?', user('pt.two')).active, 1);
  await admin.patch(`/api/config/schedule_rows/${ptRow2.id}`, { active: 1 });
  const sync = await admin.post(`/api/schedule/groups/${physio.id}/sync-staff`, {}); assert.equal(sync.status, 200); assert.equal(sync.body.added, 0, 'already populated');
});

test('mark arrived uses the existing check-in (visit + queue); only on the day of the appointment', async () => {
  const p = await patient(); const d = localOf(now(), 'Asia/Dubai').date;
  const a = (await book(rec, { patient_id: p, department_id: dept('Physiotherapy').id, row_id: ptRow.id, date: d, time: '23:00' })).body.appointments[0];
  const r = await rec.post(`/api/schedule/appointments/${a.id}/arrive`, {});
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.ok(r.body.visit.id && r.body.queue.display); assert.equal(r.body.appointment.status, 'ARRIVED');
  assert.equal(t.ops.one('SELECT appointment_id FROM visits WHERE id=?', r.body.visit.id).appointment_id, a.id);
  assert.equal(t.ops.one('SELECT COUNT(*) c FROM treatment_sessions WHERE visit_id=?', r.body.visit.id).c, 0, 'no treatment timer is started');
  const later = (await book(rec, base(await patient(), { time: '20:00' }))).body.appointments[0];
  assert.equal((await rec.post(`/api/schedule/appointments/${later.id}/arrive`, {})).status, 409);
  assert.equal((await pt1.post(`/api/schedule/appointments/${later.id}/arrive`, {})).status, 403);
});

test('20: permissions and department scope', async () => {
  assert.equal((await book(pt1, base(await patient()))).status, 403, 'clinicians view but do not book');
  assert.equal((await pt1.post('/api/schedule/blocks', { row_id: ptRow.id, date: DAY, start_time: '07:00', end_time: '08:00' })).status, 403);
  const ob = (await ort.get(`/api/schedule/board?date=${DAY}`)).body;
  assert.ok(ob.groups.length > 0 && ob.groups.every((g) => g.department_id === dept('Orthopedics').id), 'an orthopedic clinician sees only orthopedic schedules');
  assert.ok(!ob.groups.flatMap((g) => g.rows).flatMap((r) => r.appointments).some((a) => a.department !== 'Orthopedics'));
  assert.equal((await book(rec, base(await patient(), { time: '06:00' }))).status, 201);
  assert.equal((await rec.post('/api/schedule/setup', {})).status, 403);
  assert.equal((await rec.get('/api/schedule/board')).status, 200);
  const un = await fetch(`${t.base}/api/schedule/board`); assert.equal(un.status, 401);
});

test('filters: department, staff and category narrow the board', async () => {
  const onlyOne = await boardOf(admin, `&clinician_id=${user('pt.one')}`);
  assert.ok(onlyOne.groups.flatMap((g) => g.rows).every((r) => r.user_id === user('pt.one')));
  const cashOnly = await boardOf(admin, `&category_id=${cat('Cash').id}`);
  assert.ok(cashOnly.groups.flatMap((g) => g.rows).flatMap((r) => r.appointments).every((a) => a.category === 'Cash'));
  const ortho = await boardOf(admin, `&department_id=${dept('Orthopedics').id}`);
  assert.ok(ortho.groups.every((g) => g.department_id === dept('Orthopedics').id));
});

test('existing appointments (without a schedule row) still appear on the board by clinician, and the old API keeps working', async () => {
  const d = t.ops.one("SELECT scheduled_at FROM appointments WHERE row_id IS NULL AND status='SCHEDULED' LIMIT 1").scheduled_at;
  const day = localOf(d, 'Asia/Dubai').date;
  const b = (await admin.get(`/api/schedule/board?date=${day}`)).body;
  const seen = [...b.groups.flatMap((g) => g.rows).flatMap((r) => r.appointments), ...b.unplaced];
  assert.ok(seen.some((a) => a.scheduled_at === d), 'legacy appointment is visible');
  assert.equal((await rec.get('/api/appointments')).status, 200);
});
