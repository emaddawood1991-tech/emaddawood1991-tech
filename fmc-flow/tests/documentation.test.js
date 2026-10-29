// Clinical documentation (Step 4) → schedule colour, and operational check-out, using the real server logic and a persistent (in-memory SQLite) database.
// Procedure codes below are clearly synthetic test codes entered through the admin API; the application ships no code list.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';
import { clock } from '../server/ops.js';

let t, admin, rec, pt1, pt2, ort, sup, cfg, c30, c40, c55, cOrt;
const MIN = 60000;
const dept = (n) => cfg.departments.find((d) => d.name === n);
const svc = (n) => cfg.services.find((s) => s.name === n);
const hall = () => cfg.rooms.find((r) => r.code === 'PT-HALL-01');
let seq = 0; let bedNo = 0;
const GOOD = { chief_complaint: 'Right knee pain after a fall', diagnosis: 'Patellofemoral pain syndrome', cpt_code: 'TST30', progress_note: 'Pain 6/10, ROM limited; exercise program given' };

async function arrive() {
  const p = (await rec.post('/api/patients', { name: `Synthetic Doc ${++seq}` })).body.id;
  const r = await rec.post('/api/registrations', { patient_id: p, department_id: dept('Physiotherapy').id });
  assert.equal(r.status, 201, JSON.stringify(r.body)); return r.body.visit.id;
}
async function intoBed(v, idx = bedNo++ % 6) {
  const a = await rec.post(`/api/visits/${v}/room`, { room_id: hall().id, station_id: hall().stations[idx].id });
  assert.equal(a.status, 201, JSON.stringify(a.body)); assert.equal((await rec.post(`/api/visits/${v}/room/enter`)).status, 200);
}
/** A patient in a hall bed with a started session. */
async function started(minutes = 30, extra = {}) {
  const v = await arrive(); await intoBed(v, extra.bed);
  const s = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, ...(minutes != null ? { planned_minutes: minutes } : {}), ...extra.body });
  assert.equal(s.status, 201, JSON.stringify(s.body)); return { v, id: s.body.id };
}
const colour = async (id, who = pt1) => (await who.get(`/api/sessions/${id}/documentation`)).body.schedule_status;
const status = async (id) => (await pt1.get(`/api/sessions/${id}/documentation`)).body.status;
const save = (id, body, who = pt1) => who.put(`/api/sessions/${id}/documentation`, body);
const events = (id) => t.ops.q('SELECT type FROM events WHERE session_id=? ORDER BY id', id).map((e) => e.type);
const row = (id) => t.ops.one('SELECT * FROM treatment_sessions WHERE id=?', id);
async function finish(v, id) { await pt1.post(`/api/sessions/${id}/complete`, { mode: 'now' }); await rec.post(`/api/visits/${v}/room/exit`); }

before(async () => {
  t = await boot();
  [admin, rec, pt1, pt2, ort, sup] = await Promise.all(['admin', 'reception', 'pt.one', 'pt.two', 'dr.ort', 'super'].map(t.login));
  const mk = async (code, minutes, dep) => (await admin.post('/api/config/cpt_codes', { code, description: 'synthetic test code', default_minutes: minutes, department_id: dep })).body;
  cfg = (await admin.get('/api/config')).body;
  c30 = await mk('TST30', 30, dept('Physiotherapy').id); c40 = await mk('TST40', 40, dept('Physiotherapy').id); c55 = await mk('TST55', 55, null);
  cOrt = await mk('TSTORT', 20, dept('Orthopedics').id);
  cfg = (await admin.get('/api/config')).body;
});
after(() => t.close());

test('nothing is generated for the clinician: a new session has no documentation row and is YELLOW with 0 of 4 complete', async () => {
  const { v, id } = await started();
  assert.equal(t.ops.one('SELECT COUNT(*) c FROM session_documentation WHERE session_id=?', id).c, 0);
  const d = (await pt1.get(`/api/sessions/${id}/documentation`)).body;
  assert.equal(d.schedule_status, 'YELLOW'); assert.equal(d.status.completed, 0);
  assert.deepEqual(d.content, { chief_complaint: '', diagnosis: '', cpt_code: '', progress_note: '' });
  await finish(v, id);
});

test('1-4: zero, one, two and three saved fields all stay YELLOW; the fourth turns it ORANGE', async () => {
  const { v, id } = await started();
  assert.equal(await colour(id), 'YELLOW');
  const steps = [['chief_complaint', 1], ['diagnosis', 2], ['cpt_code', 3]];
  for (const [k, n] of steps) {
    assert.equal((await save(id, { [k]: GOOD[k] })).status, 200);
    assert.equal(await colour(id), 'YELLOW', `${n} of 4 → still YELLOW`);
    assert.equal((await status(id)).completed, n);
  }
  // ORANGE only when the 4th is saved
  assert.equal((await save(id, { progress_note: GOOD.progress_note })).status, 200);
  assert.equal(await colour(id), 'ORANGE');
  assert.equal((await status(id)).completed, 4);
  assert.ok(events(id).includes('DOCUMENTATION_COMPLETE'));
  await finish(v, id);
});

test('5: four fields that were never saved (a rejected save) leave the status YELLOW and write nothing', async () => {
  const { v, id } = await started();
  const r = await save(id, { ...GOOD, cpt_code: 'NOTAPPROVED' });
  assert.equal(r.status, 400); assert.ok(r.body.error.fields.cpt_code, 'the unapproved code is named in the error');
  assert.equal(t.ops.one('SELECT COUNT(*) c FROM session_documentation WHERE session_id=?', id).c, 0, 'nothing was saved, not even the valid fields');
  assert.equal(await colour(id), 'YELLOW');
  await finish(v, id);
});

test('validation: whitespace-only, too-short, unapproved, inactive and other-department codes never satisfy a field', async () => {
  const { v, id } = await started();
  await save(id, { chief_complaint: '     ', diagnosis: 'ab', progress_note: '\n\t ' });
  let s = await status(id);
  assert.equal(s.problems.chief_complaint, 'EMPTY'); assert.equal(s.problems.diagnosis, 'TOO_SHORT'); assert.equal(s.problems.progress_note, 'EMPTY'); assert.equal(s.completed, 0);
  assert.equal((await save(id, { cpt_code: 'TSTORT' })).status, 400, 'another department’s code is refused for this service');
  assert.equal((await save(id, { cpt_code: '99999' })).status, 400, 'an unlisted code is refused');
  await admin.patch(`/api/config/cpt_codes/${c40.id}`, { active: 0 });
  assert.equal((await save(id, { cpt_code: 'TST40' })).status, 400, 'an inactive code is refused');
  await admin.patch(`/api/config/cpt_codes/${c40.id}`, { active: 1 });
  assert.equal((await status(id)).problems.procedure, 'EMPTY');
  assert.equal((await save(id, { chief_complaint: 'x'.repeat(4001) })).status, 400);
  await finish(v, id);
});

test('diagnosis follows the configured rule (pattern setting) and a failing format keeps the field incomplete', async () => {
  const { v, id } = await started();
  await save(id, { ...GOOD });
  assert.equal(await colour(id), 'ORANGE');
  assert.equal((await admin.patch('/api/config/settings', { diagnosis_pattern: '^[A-Z][0-9]{2}' })).status, 200);
  assert.equal(await colour(id), 'YELLOW', 'the diagnosis no longer satisfies the configured rule');
  assert.equal((await status(id)).problems.diagnosis, 'FORMAT');
  await save(id, { diagnosis: 'M25.5 knee pain' });
  assert.equal(await colour(id), 'ORANGE');
  assert.equal((await admin.patch('/api/config/settings', { diagnosis_pattern: '(' })).status, 400, 'an invalid pattern is refused');
  await admin.patch('/api/config/settings', { diagnosis_pattern: '' });
  await finish(v, id);
});

test('6-7: four valid saved fields → ORANGE; emptying a field, or retiring the approved code, returns it to YELLOW', async () => {
  const { v, id } = await started();
  await save(id, GOOD);
  assert.equal(await colour(id), 'ORANGE');
  const visitRow = async () => (await rec.get('/api/visits/open')).body.find((x) => x.id === v);
  assert.equal((await visitRow()).schedule_status, 'ORANGE', 'the Visits list shows the same colour');
  assert.equal((await rec.get('/api/schedule')).body.sessions.find((s) => s.id === id).schedule_status, 'ORANGE', 'and so does the schedule');
  await save(id, { progress_note: '   ' });
  assert.equal(await colour(id), 'YELLOW'); assert.ok(events(id).includes('DOCUMENTATION_INCOMPLETE'));
  assert.equal((await visitRow()).schedule_status, 'YELLOW');
  await save(id, { progress_note: GOOD.progress_note });
  assert.equal(await colour(id), 'ORANGE');
  await admin.patch(`/api/config/cpt_codes/${c30.id}`, { active: 0 });
  assert.equal(await colour(id), 'YELLOW', 'a code that is no longer approved cannot keep the status ORANGE');
  assert.equal((await status(id)).problems.procedure, 'CPT_NOT_APPROVED');
  await admin.patch(`/api/config/cpt_codes/${c30.id}`, { active: 1 });
  assert.equal(await colour(id), 'ORANGE');
  const types = events(id);
  assert.equal(types.filter((x) => x === 'DOCUMENTATION_COMPLETE').length, 2, 'completion is logged each time it is reached');
  await finish(v, id);
});

test('8: timer expires with incomplete documentation → automatic operational check-out, documentation stays incomplete, nothing is verified, room stays occupied', async () => {
  const { v, id } = await started(30);
  await save(id, { chief_complaint: GOOD.chief_complaint, diagnosis: GOOD.diagnosis, cpt_code: 'TST30' }); // 3 of 4
  const sched = row(id).scheduled_end_at;
  clock.advance(31 * MIN);
  assert.equal(await colour(id), 'YELLOW');
  const s = row(id);
  assert.equal(s.operational_checkout_at, sched, 'operational check-out is stamped at the scheduled end');
  assert.equal(s.operational_checkout_kind, 'AUTO');
  assert.equal(s.status, 'ACTIVE'); assert.equal(s.confirmed_at, null); assert.equal(s.ended_at, null, 'not verified clinical completion');
  assert.equal(t.ops.one('SELECT COUNT(*) c FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v).c, 1, 'physical departure has not happened');
  assert.equal((await status(id)).completed, 3);
  const ev = events(id); assert.ok(ev.includes('OPERATIONAL_CHECKOUT')); assert.ok(!ev.includes('TREATMENT_COMPLETED') && !ev.includes('DOCUMENTATION_COMPLETE'));
  assert.equal(t.ops.one('SELECT COUNT(*) c FROM events WHERE session_id=? AND type=?', id, 'OPERATIONAL_CHECKOUT').c, 1, 'recorded once, however often it is read');
  await finish(v, id);
});

test('9: timer expires with complete documentation → automatic operational check-out, documentation stays complete (ORANGE)', async () => {
  const { v, id } = await started(30);
  await save(id, GOOD);
  clock.advance(31 * MIN);
  assert.equal(await colour(id), 'ORANGE');
  const s = row(id);
  assert.equal(s.operational_checkout_kind, 'AUTO'); assert.equal(s.confirmed_at, null); assert.equal(s.status, 'ACTIVE');
  assert.equal((await status(id)).complete, true);
  const ev = events(id); assert.ok(ev.includes('OPERATIONAL_CHECKOUT') && !ev.includes('TREATMENT_COMPLETED'));
  // the three records are separate: operational check-out, verified completion, physical departure
  await pt1.post(`/api/sessions/${id}/complete`, { mode: 'scheduled' });
  assert.ok(row(id).confirmed_at && row(id).completion_kind === 'FULL');
  assert.equal(row(id).operational_checkout_kind, 'AUTO');
  assert.equal(t.ops.one('SELECT COUNT(*) c FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v).c, 1);
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('documentation after automatic check-out and after completion is still allowed and re-evaluated', async () => {
  const { v, id } = await started(30);
  clock.advance(31 * MIN);
  await pt1.post(`/api/sessions/${id}/complete`, { mode: 'scheduled' });
  assert.equal(await colour(id), 'YELLOW');
  await save(id, GOOD);
  assert.equal(await colour(id), 'ORANGE');
  await rec.post(`/api/visits/${v}/room/exit`);
});

test('who may document and who may read the text', async () => {
  const { v, id } = await started();
  assert.equal((await save(id, GOOD, rec)).status, 403, 'reception cannot document');
  assert.equal((await save(id, GOOD, sup)).status, 403, 'a supervisor cannot document on a clinician’s behalf');
  assert.equal((await save(id, GOOD, admin)).status, 403, 'an administrator has no clinical authorization');
  assert.equal((await save(id, GOOD, ort)).status, 403, 'a clinician from another department is out of scope');
  assert.equal((await save(id, { chief_complaint: GOOD.chief_complaint }, pt2)).status, 200, 'another authorized PT clinician may');
  assert.equal((await rec.get(`/api/sessions/${id}/documentation`)).body.content, null, 'reception sees completeness only, never the clinical text');
  assert.equal((await rec.get(`/api/sessions/${id}/documentation`)).body.status.completed, 1);
  assert.equal((await admin.get(`/api/sessions/${id}/documentation`)).body.content, null);
  assert.equal((await pt1.get(`/api/sessions/${id}/documentation`)).body.content.chief_complaint, GOOD.chief_complaint);
  const log = t.ops.q("SELECT detail FROM audit_log WHERE entity='session' AND entity_id=? AND action LIKE 'documentation.%'", String(id)).map((r) => r.detail).join(' ');
  assert.ok(!log.includes('knee') && !log.includes('syndrome'), 'audit entries hold field names, not clinical text');
  const evData = t.ops.q("SELECT data FROM events WHERE session_id=? AND type LIKE 'DOCUMENTATION%'", id).map((r) => r.data).join(' ');
  assert.ok(!evData.includes('knee'), 'events hold no clinical text');
  await finish(v, id);
});

test('approved procedure code selects the duration (30 / 40 / 55) and an unapproved one is refused', async () => {
  for (const [c, m] of [[c30, 30], [c40, 40], [c55, 55]]) {
    const v = await arrive(); await intoBed(v);
    const s = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, cpt_code_id: c.id });
    assert.equal(s.status, 201, JSON.stringify(s.body)); assert.equal(s.body.planned_minutes, m);
    assert.equal(s.body.planned_cpt_id, c.id);
    assert.equal(t.ops.one('SELECT COUNT(*) c FROM session_documentation WHERE session_id=?', s.body.id).c, 0, 'choosing a code at start does not document the procedure');
    await finish(v, s.body.id);
  }
  const v = await arrive(); await intoBed(v);
  assert.equal((await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, cpt_code_id: cOrt.id })).status, 400);
  assert.equal((await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, cpt_code_id: 99999 })).status, 400);
  const ok = await pt1.post(`/api/visits/${v}/sessions`, { service_id: svc('PT Treatment').id, cpt_code_id: c40.id, planned_minutes: 50 });
  assert.equal(ok.body.planned_minutes, 50, 'an explicit duration still wins');
  await finish(v, ok.body.id);
});

test('the next patient waits one minute after the previous operational check-out on the same bed', async () => {
  t.ops.run("UPDATE settings SET value='1' WHERE key='resource_gap_minutes'");
  try {
    clock.advance(5 * MIN); // earlier tests used these beds a moment ago
    const a = await arrive(); await intoBed(a, 5);
    const sa = (await pt1.post(`/api/visits/${a}/sessions`, { service_id: svc('PT Treatment').id, planned_minutes: 30 })).body.id;
    clock.advance(30 * MIN + 5000);
    await pt1.get('/api/sessions/active'); // sweep records the automatic check-out at +30:00
    assert.equal(row(sa).operational_checkout_kind, 'AUTO');
    await pt1.post(`/api/sessions/${sa}/complete`, { mode: 'scheduled' }); await rec.post(`/api/visits/${a}/room/exit`);
    const b = await arrive(); await intoBed(b, 5);
    const early = await pt1.post(`/api/visits/${b}/sessions`, { service_id: svc('PT Treatment').id, planned_minutes: 30 });
    assert.equal(early.status, 409); assert.equal(early.body.error.code, 'RESOURCE_GAP'); assert.ok(early.body.error.retry_after_s > 0 && early.body.error.retry_after_s <= 60);
    // a different bed is not held up by that gap
    const c = await arrive(); await intoBed(c, 4);
    const other = await pt1.post(`/api/visits/${c}/sessions`, { service_id: svc('PT Treatment').id, planned_minutes: 30 });
    assert.equal(other.status, 201); await finish(c, other.body.id);
    clock.advance(61 * 1000);
    const later = await pt1.post(`/api/visits/${b}/sessions`, { service_id: svc('PT Treatment').id, planned_minutes: 30 });
    assert.equal(later.status, 201, JSON.stringify(later.body)); await finish(b, later.body.id);
  } finally { t.ops.run("UPDATE settings SET value='0' WHERE key='resource_gap_minutes'"); }
});

test('administrator procedure-code list: format, duplicates, and Settings numbers are validated', async () => {
  assert.equal((await admin.post('/api/config/cpt_codes', { code: 'AB', default_minutes: 30 })).status, 400);
  assert.equal((await admin.post('/api/config/cpt_codes', { code: 'tst30', default_minutes: 30 })).status, 400, 'duplicate (case-insensitive)');
  assert.equal((await admin.post('/api/config/cpt_codes', { code: 'TSTX1', default_minutes: 0 })).status, 400);
  assert.equal((await rec.post('/api/config/cpt_codes', { code: 'TSTX2', default_minutes: 30 })).status, 403);
  assert.equal((await admin.patch('/api/config/settings', { resource_gap_minutes: 99 })).status, 400);
  assert.equal((await admin.patch('/api/config/settings', { doc_min_chars: 0 })).status, 400);
});
