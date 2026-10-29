// Default behaviour: the treatment stops and checks out at exactly the entered duration (no overtime, no waiting for a click).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';
import { openDb } from '../server/db.js';
import { clock } from '../server/ops.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let t, admin, rec, pt1, cfg;
const MIN = 60000;
const svc = (n) => cfg.services.find((s) => s.name === n);
const hall = () => cfg.rooms.find((r) => r.code === 'PT-HALL-01');
let seq = 0;
async function started(minutes, bed) {
  const p = (await rec.post('/api/patients', { name: `Synthetic Auto ${++seq}` })).body.id;
  const v = (await rec.post('/api/registrations', { patient_id: p, department_id: cfg.departments.find((d) => d.name === 'Physiotherapy').id })).body.visit.id;
  assert.equal((await rec.post(`/api/visits/${v}/room`, { room_id: hall().id, station_id: hall().stations[bed].id })).status, 201);
  assert.equal((await rec.post(`/api/visits/${v}/room/enter`)).status, 200);
  const s = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, planned_minutes: minutes });
  assert.equal(s.status, 201, JSON.stringify(s.body)); return { v, id: s.body.id };
}
const row = (id) => t.ops.one('SELECT * FROM treatment_sessions WHERE id=?', id);
const active = async () => (await pt1.get('/api/sessions/active')).body.sessions.map((s) => s.id);

before(async () => {
  t = await boot({ autoClose: 1, gap: 1 });
  [admin, rec, pt1] = await Promise.all(['admin', 'reception', 'pt.one'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
});
after(() => t.close());

test('a new database defaults to automatic stop and check-out', () => {
  const db = openDb(':memory:');
  assert.equal(db.prepare("SELECT value FROM settings WHERE key='timer_auto_close'").get().value, '1');
});

test('an older database on the old default is switched once; an administrator’s deliberate choice is kept', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fmc-mig-'));
  try {
    const mk = (name, adminChose) => {
      const f = join(dir, name); const d = openDb(f);
      d.prepare("UPDATE settings SET value='0' WHERE key='timer_auto_close'").run(); d.prepare("DELETE FROM settings WHERE key='timer_auto_close_default_v2'").run();
      if (adminChose) d.prepare('INSERT INTO audit_log(ts,actor_id,action,entity,entity_id,detail) VALUES (?,?,?,?,?,?)').run(new Date().toISOString(), null, 'config.settings', 'settings', 'timer_auto_close', '{}');
      d.close(); const r = openDb(f); const v = r.prepare("SELECT value FROM settings WHERE key='timer_auto_close'").get().value; r.close(); return v;
    };
    assert.equal(mk('old.db', false), '1', 'untouched old default becomes automatic');
    assert.equal(mk('chosen.db', true), '0', 'a recorded administrator change is never overwritten');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('45 minutes entered → at 45:00 the session stops and is checked out; no overtime, nothing to click', async () => {
  const { v, id } = await started(45, 0);
  clock.advance(44 * MIN);
  assert.ok((await active()).includes(id), 'still running at 44:00');
  clock.advance(MIN + 3000); // a few seconds past 45:00
  assert.ok(!(await active()).includes(id), 'no longer an active session');
  const s = row(id);
  assert.equal(s.status, 'COMPLETED');
  assert.equal(s.ended_at, s.scheduled_end_at, 'ended exactly at the scheduled end, not when someone noticed');
  assert.equal(Date.parse(s.ended_at) - Date.parse(s.started_at), 45 * MIN, 'exactly 45 minutes');
  assert.equal(s.completion_kind, 'AUTO'); assert.equal(s.confirmed_at, null, 'not presented as clinician-verified');
  assert.equal(s.operational_checkout_at, s.scheduled_end_at); assert.equal(s.operational_checkout_kind, 'AUTO');
  const ev = t.ops.q('SELECT type, data FROM events WHERE session_id=? ORDER BY id', id);
  assert.deepEqual(ev.map((e) => e.type).filter((x) => /TIMER|OPERATIONAL|TREATMENT_COMPLETED/.test(x)), ['TIMER_ELAPSED', 'OPERATIONAL_CHECKOUT', 'TREATMENT_COMPLETED']);
  assert.equal(JSON.parse(ev.find((e) => e.type === 'TREATMENT_COMPLETED').data).verified, false);
  assert.equal(t.ops.one('SELECT COUNT(*) c FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v).c, 1, 'the patient has not physically left; the room is freed only by room exit');
  assert.equal((await rec.post(`/api/visits/${v}/room/exit`)).status, 200, 'room exit is now available straight away');
});

test('documentation is untouched by the automatic check-out (incomplete stays YELLOW, complete stays ORANGE)', async () => {
  const mk = await admin.post('/api/config/cpt_codes', { code: 'TSTAU', description: 'synthetic', default_minutes: 45 }); assert.equal(mk.status, 201);
  const good = { chief_complaint: 'Low back pain', diagnosis: 'Lumbar strain', cpt_code: 'TSTAU', progress_note: 'Session tolerated well' };
  const a = await started(45, 1); const b = await started(45, 2);
  await pt1.put(`/api/sessions/${a.id}/documentation`, { chief_complaint: good.chief_complaint });
  await pt1.put(`/api/sessions/${b.id}/documentation`, good);
  clock.advance(46 * MIN); await pt1.get('/api/sessions/active'); // the server also sweeps every 10 s
  const colour = async (id) => (await pt1.get(`/api/sessions/${id}/documentation`)).body;
  assert.equal(row(a.id).status, 'COMPLETED'); assert.equal(row(b.id).status, 'COMPLETED');
  assert.equal((await colour(a.id)).schedule_status, 'YELLOW'); assert.equal((await colour(a.id)).status.completed, 1);
  assert.equal((await colour(b.id)).schedule_status, 'ORANGE');
  // documentation can still be completed afterwards
  await pt1.put(`/api/sessions/${a.id}/documentation`, good);
  assert.equal((await colour(a.id)).schedule_status, 'ORANGE');
  for (const x of [a, b]) await rec.post(`/api/visits/${x.v}/room/exit`);
});

test('pause stops the clock; after resume the check-out happens at the recalculated end', async () => {
  const { v, id } = await started(30, 3);
  clock.advance(10 * MIN);
  await pt1.post(`/api/sessions/${id}/pause`);
  clock.advance(60 * MIN); // an hour paused: nothing happens
  assert.equal(row(id).status, 'PAUSED');
  await pt1.post(`/api/sessions/${id}/resume`);
  const end = row(id).scheduled_end_at;
  assert.equal(Date.parse(end) - Date.now() > 19 * MIN, true, 'about 20 minutes left');
  clock.advance(21 * MIN);
  await pt1.get('/api/sessions/active');
  assert.equal(row(id).status, 'COMPLETED'); assert.equal(row(id).ended_at, end);
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('the next patient on the same bed waits one minute after the automatic check-out', async () => {
  const a = await started(30, 4);
  clock.advance(30 * MIN + 5000); await pt1.get('/api/sessions/active');
  assert.equal(row(a.id).status, 'COMPLETED');
  await rec.post(`/api/visits/${a.v}/room/exit`);
  const p = (await rec.post('/api/patients', { name: `Synthetic Auto ${++seq}` })).body.id;
  const v = (await rec.post('/api/registrations', { patient_id: p, department_id: cfg.departments.find((d) => d.name === 'Physiotherapy').id })).body.visit.id;
  await rec.post(`/api/visits/${v}/room`, { room_id: hall().id, station_id: hall().stations[4].id }); await rec.post(`/api/visits/${v}/room/enter`);
  const early = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, planned_minutes: 30 });
  assert.equal(early.body.error.code, 'RESOURCE_GAP');
  clock.advance(60 * 1000);
  assert.equal((await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, planned_minutes: 30 })).status, 201);
});
