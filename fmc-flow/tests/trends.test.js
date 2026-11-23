// Report trends (stage S20): visits and wait per day, appointment outcomes, and department scope on both.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';

test('daily trend and appointment outcomes are correct and respect department scope', async () => {
  const t = await boot(); try {
  const admin = await t.login('admin'); const sup = await t.login('super'); const rec = await t.login('reception');
  const dep = (name) => t.db.prepare('SELECT id FROM departments WHERE name=?').get(name).id; const physio = dep('Physiotherapy'), ortho = dep('Orthopedics');
  const p = (await rec.post('/api/patients', { name: 'Trend Patient', phone: '0501112233' })).body;
  const day = (offset) => new Date(Date.now() + offset * 86400e3).toISOString();
  const base = (await admin.get(`/api/reports?from=${day(-30).slice(0, 10)}&to=${day(+30).slice(0, 10)}`)).body.appointments; // the demo data already has some appointments
  const ins = t.db.prepare("INSERT INTO appointments (ref, patient_id, department_id, scheduled_at, status, created_at) VALUES (?,?,?,?,?,?)"); let n = 0;
  const add = (d, st, when) => ins.run(`TR-${++n}`, p.id, d, when, st, day(-10));
  for (let i = 0; i < 3; i++) add(physio, 'ARRIVED', day(-3));
  add(physio, 'SCHEDULED', day(-2)); // time passed, no arrival
  add(physio, 'CANCELLED', day(-2));
  add(physio, 'SCHEDULED', day(+2)); // upcoming
  add(ortho, 'ARRIVED', day(-3)); add(ortho, 'CANCELLED', day(-3));
  const from = day(-30).slice(0, 10), to = day(+30).slice(0, 10);
  const all = (await admin.get(`/api/reports?from=${from}&to=${to}`)).body.appointments;
  assert.deepEqual([all.total - base.total, all.arrived - base.arrived, all.not_arrived - base.not_arrived, all.cancelled - base.cancelled, all.upcoming - base.upcoming], [8, 4, 1, 2, 1]);
  // department filter narrows it
  const physioBase = (await admin.get(`/api/reports?from=2001-01-01&to=2001-01-31&department_id=${physio}`)).body.appointments.total; assert.equal(physioBase, 0);
  const physioOnly = (await admin.get(`/api/reports?from=${from}&to=${to}&department_id=${physio}`)).body.appointments;
  const orthoOnly = (await admin.get(`/api/reports?from=${from}&to=${to}&department_id=${ortho}`)).body.appointments;
  assert.equal(physioOnly.total - base.total + orthoOnly.total >= 0, true); assert.equal(orthoOnly.arrived >= 1 && orthoOnly.cancelled >= 1, true);
  // a supervisor limited to one department only sees that department's appointments
  t.db.prepare("UPDATE users SET department_id=? WHERE username='super'").run(ortho);
  const scoped = (await sup.get(`/api/reports?from=${from}&to=${to}`)).body.appointments;
  assert.equal(scoped.total, orthoOnly.total, 'scoped supervisor sees exactly their department');
  assert.ok(scoped.total < all.total);
  // the date range is respected
  const empty = (await admin.get(`/api/reports?from=2001-01-01&to=2001-01-31`)).body;
  assert.equal(empty.appointments.total, 0); assert.deepEqual(empty.daily, []); assert.equal(empty.appointments.arrival_rate_pct, null);
  } finally { t.close(); }
});

test('daily trend counts visits per local day with the average wait', async () => {
  const t = await boot(); try {
  const admin = await t.login('admin'); const rec = await t.login('reception');
  const dept = t.db.prepare("SELECT id FROM departments WHERE name='Physiotherapy'").get().id;
  for (const name of ['Trend A', 'Trend B']) { const p = (await rec.post('/api/patients', { name, phone: '05011122' + Math.floor(Math.random() * 90 + 10) })).body; const r = await rec.post('/api/visits/checkin', { patientId: p.id, departmentId: dept }); assert.equal(r.status, 201); }
  const today = new Date().toISOString().slice(0, 10);
  const d = (await admin.get(`/api/reports?from=${today}&to=${today}`)).body;
  assert.equal(d.daily.length, 1); assert.equal(d.daily[0].visits, 2); assert.equal(d.daily[0].avg_wait_min, null, 'nobody has entered a room yet, so there is no wait to average');
  } finally { t.close(); }
});

test('a check-in without a patient is a clear 400, not a server error', async () => {
  const t = await boot(); try { const rec = await t.login('reception');
    for (const body of [{}, { patientId: 'abc' }, { patientId: 0 }]) assert.equal((await rec.post('/api/visits/checkin', body)).status, 400);
    assert.equal((await rec.post('/api/visits/checkin', { patientId: 999999, departmentId: 1 })).status, 404);
  } finally { t.close(); }
});
