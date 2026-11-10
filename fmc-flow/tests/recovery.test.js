// Account recovery requests and break-glass emergency access (stage S7).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';
import { clock } from '../server/ops.js';
import { DEMO_PASSWORD } from '../server/seed.js';

let t, admin, sup, rec, pt1, ort, gm, cfg;
const dept = (n) => cfg.departments.find((d) => d.name === n).id;
const anon = (path, body, headers = {}) => fetch(`${t.base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const FMC = { 'x-requested-with': 'fmc' };
const codeOf = (r) => r.body?.error?.code;

before(async () => {
  t = await boot();
  [admin, sup, rec, pt1, ort, gm] = await Promise.all(['admin', 'super', 'reception', 'pt.one', 'dr.ort', 'gm.one'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
});
after(() => t.close());

test('S7-1 a recovery request gives the same answer for real and unknown accounts, and needs the app header', async () => {
  assert.equal((await anon('/api/recovery-request', { username: 'pt.two' })).status, 403, 'no CSRF header');
  const a = await anon('/api/recovery-request', { username: 'pt.two' }, FMC); const b = await anon('/api/recovery-request', { username: 'nobody.here' }, FMC);
  assert.equal(a.status, 202); assert.equal(b.status, 202);
  assert.deepEqual(await a.json(), await b.json(), 'the response must not reveal whether the account exists');
  await anon('/api/recovery-request', { username: 'pt.two' }, FMC);
  const list = (await admin.get('/api/security/recovery-requests')).body;
  assert.equal(list.requests.filter((r) => r.username === 'pt.two').length, 1, 'a repeat within the hour is not added again');
  assert.equal(list.requests.find((r) => r.username === 'nobody.here').user_id, null);
  for (const who of [sup, rec, pt1]) assert.equal((await who.get('/api/security/recovery-requests')).status, 403);
  const alerts = (await admin.get('/api/security/alerts')).body.alerts;
  assert.ok(alerts.some((x) => x.kind === 'RECOVERY_REQUEST'), 'administrators see an alert');
});

test('S7-2 an administrator resolves a request with a temporary password: sessions end, the person must choose their own', async () => {
  const pt2 = await t.login('pt.two'); assert.equal((await pt2.get('/api/me')).status, 200);
  const req = (await admin.get('/api/security/recovery-requests')).body.requests.find((r) => r.username === 'pt.two' && r.status === 'PENDING');
  assert.equal((await admin.post(`/api/security/recovery-requests/${req.id}/resolve`, { action: 'reset', temporary_password: 'short' })).status, 400, 'policy applies to temporary passwords');
  assert.equal((await sup.post(`/api/security/recovery-requests/${req.id}/resolve`, { action: 'reset', temporary_password: 'Temp-Recovery-Pass-91' })).status, 403);
  assert.equal((await admin.post(`/api/security/recovery-requests/${req.id}/resolve`, { action: 'reset', temporary_password: 'Temp-Recovery-Pass-91' })).status, 200);
  assert.equal((await pt2.get('/api/me')).status, 401, 'existing sessions were ended');
  const login = await anon('/api/login', { username: 'pt.two', password: 'Temp-Recovery-Pass-91' }); assert.equal(login.status, 200);
  assert.equal((await login.json()).user.must_change_password, 1);
  assert.equal((await admin.post(`/api/security/recovery-requests/${req.id}/resolve`, { action: 'dismiss' })).status, 409, 'cannot be handled twice');
  const unknown = (await admin.get('/api/security/recovery-requests')).body.requests.find((r) => r.username === 'nobody.here');
  assert.equal((await admin.post(`/api/security/recovery-requests/${unknown.id}/resolve`, { action: 'reset', temporary_password: 'Temp-Recovery-Pass-92' })).status, 400, 'no account behind it');
  assert.equal((await admin.post(`/api/security/recovery-requests/${unknown.id}/resolve`, { action: 'dismiss', note: 'unknown username' })).status, 200);
  const log = (await admin.get('/api/audit')).body; assert.ok((log.rows ?? log).some((a) => a.action === 'recovery.reset'));
});

test('S7-3 recovery requests are rate limited', async () => {
  let last; for (let i = 0; i < 7; i++) last = await anon('/api/recovery-request', { username: `probe${i}` }, FMC);
  assert.equal(last.status, 429);
});

// ---------- break-glass ----------
let phys, physVisit, physSession, other, otherVisit;
async function physioPatient(name) {
  const p = (await rec.post('/api/patients', { name })).body;
  const reg = (await rec.post('/api/registrations', { patient_id: p.id, department_id: dept('Physiotherapy') })).body;
  return { p, visit: reg.visit?.id ?? reg.visit_id };
}
test('S7-4 setup: a physiotherapy patient with a running session', async () => {
  ({ p: phys, visit: physVisit } = await physioPatient('Emergency Probe Patient'));
  ({ p: other, visit: otherVisit } = await physioPatient('Second Probe Patient'));
  const room = cfg.rooms.find((r) => r.department_id === dept('Physiotherapy'));
  assert.equal((await pt1.post(`/api/visits/${physVisit}/room`, { room_id: room.id })).status, 201);
  assert.equal((await pt1.post(`/api/visits/${physVisit}/room/enter`)).status, 200);
  const s = await pt1.post(`/api/visits/${physVisit}/sessions`, { service_id: cfg.services.find((x) => x.name === 'PT Treatment').id });
  assert.equal(s.status, 201); physSession = s.body.id ?? s.body.session?.id;
});

test('S7-5 emergency access is off by default, and nobody outside the department can read the visit', async () => {
  const r = await ort.post('/api/break-glass', { mrn: phys.mrn, reason: 'Patient collapsed in the corridor, need history' });
  assert.equal(r.status, 403); assert.equal(codeOf(r), 'BREAK_GLASS_DISABLED');
  assert.equal((await ort.get(`/api/visits/${physVisit}/timeline`)).status, 403);
  assert.equal((await ort.get(`/api/sessions/${physSession}/documentation`)).status, 403);
});

test('S7-6 with it switched on: reason required, read-only access to that patient only, alert raised, everything logged', async () => {
  assert.equal((await ort.patch('/api/config/settings', { break_glass_enabled: '1' })).status, 403, 'only an administrator can switch it on');
  assert.equal((await admin.patch('/api/config/settings', { break_glass_enabled: '1', break_glass_minutes: '30' })).status, 200);
  assert.equal(codeOf(await ort.post('/api/break-glass', { mrn: phys.mrn, reason: 'too short' })), 'VALIDATION');
  assert.equal((await ort.post('/api/break-glass', { mrn: 'EMR-NOPE', reason: 'Patient collapsed in the corridor, need history' })).status, 404);
  assert.equal((await rec.post('/api/break-glass', { mrn: phys.mrn, reason: 'Patient collapsed in the corridor, need history' })).status, 403, 'reception does not hold the permission');
  assert.equal((await admin.post('/api/break-glass', { mrn: phys.mrn, reason: 'Patient collapsed in the corridor, need history' })).status, 403);
  const g = await ort.post('/api/break-glass', { mrn: phys.mrn, reason: 'Patient collapsed in the corridor, need history' });
  assert.equal(g.status, 201); assert.equal(g.body.visits[0].id, physVisit); assert.equal(g.body.visits[0].sessions[0].id, physSession);
  const mins = (Date.parse(g.body.grant.expires_at) - Date.parse(g.body.grant.granted_at)) / 60000; assert.equal(Math.round(mins), 30);
  // read: the granted patient only
  assert.equal((await ort.get(`/api/visits/${physVisit}/timeline`)).status, 200);
  assert.equal((await ort.get(`/api/sessions/${physSession}/documentation`)).status, 200);
  assert.equal((await ort.get(`/api/visits/${otherVisit}/timeline`)).status, 403, 'another patient of the same department stays closed');
  assert.equal((await gm.get(`/api/visits/${physVisit}/timeline`)).status, 403, 'and so does a colleague');
  // read-only: no changes
  for (const [m, p, b] of [['put', `/api/sessions/${physSession}/documentation`, { clinical_note: 'x' }], ['post', `/api/sessions/${physSession}/pause`], ['post', `/api/sessions/${physSession}/complete`, { mode: 'AUTO' }],
    ['post', `/api/visits/${physVisit}/room/exit`], ['post', `/api/visits/${physVisit}/checkout`], ['post', `/api/visits/${physVisit}/sessions`, { service_id: cfg.services.find((x) => x.name === 'Orthopedic Consultation').id }]]) {
    assert.ok([400, 403, 404, 409].includes((await ort[m](p, b)).status), `${m} ${p} stays refused`);
  }
  assert.equal(t.db.prepare("SELECT status FROM treatment_sessions WHERE id=?").get(physSession).status, 'ACTIVE');
  // the patient does not appear in lists or search
  assert.equal((await ort.get(`/api/patients?q=${encodeURIComponent('Emergency Probe')}`)).body.length, 0);
  // alert, audit, access log
  const alerts = (await admin.get('/api/security/alerts')).body.alerts; const al = alerts.find((x) => x.kind === 'BREAK_GLASS_USED');
  assert.ok(al && al.severity === 'CRITICAL');
  const log = (await admin.get('/api/audit')).body; const rows = log.rows ?? log;
  assert.ok(rows.some((a) => a.action === 'breakglass.grant') && rows.some((a) => a.action === 'breakglass.read'));
  const access = t.db.prepare("SELECT COUNT(*) c FROM patient_access_log WHERE kind='BREAK_GLASS' AND patient_id=?").get(phys.id).c; assert.ok(access >= 1, 'the patient-access log shows the emergency access; each read is in the audit log');
});

test('S7-7 access ends when the person ends it, when it expires, and when an administrator switches the feature off', async () => {
  const mine = (await ort.get('/api/break-glass/mine')).body; const g = mine.grants.find((x) => x.active); assert.ok(g);
  assert.equal((await ort.post('/api/break-glass', { mrn: phys.mrn, reason: 'Still needed for the same emergency now' })).body.grant.id, g.id, 'asking again reuses the active access');
  assert.equal((await ort.post(`/api/break-glass/${g.id}/end`)).status, 200);
  assert.equal((await ort.get(`/api/visits/${physVisit}/timeline`)).status, 403, 'ended');
  const g2 = (await ort.post('/api/break-glass', { mrn: phys.mrn, reason: 'Second emergency, need medication history' })).body.grant;
  assert.equal((await ort.get(`/api/visits/${physVisit}/timeline`)).status, 200);
  clock.offsetMs += 31 * 60000; try { assert.equal((await ort.get(`/api/visits/${physVisit}/timeline`)).status, 403, 'expired after the configured minutes'); } finally { clock.offsetMs -= 31 * 60000; }
  assert.equal((await ort.get(`/api/visits/${physVisit}/timeline`)).status, 200, 'active again before expiry');
  await admin.patch('/api/config/settings', { break_glass_enabled: '0' });
  assert.equal((await ort.get(`/api/visits/${physVisit}/timeline`)).status, 403, 'switching it off stops running accesses');
  await admin.patch('/api/config/settings', { break_glass_enabled: '1' });
  assert.ok(g2.id > g.id);
});

test('S7-8 an administrator reviews every use; grants cannot be deleted', async () => {
  for (const who of [sup, ort, rec]) assert.equal((await who.get('/api/security/break-glass')).status, 403);
  const v = (await admin.get('/api/security/break-glass')).body; assert.ok(v.unreviewed >= 2); assert.equal(v.grants[0].username, 'dr.ort'); assert.equal(v.grants[0].mrn, phys.mrn);
  assert.equal((await admin.post(`/api/security/break-glass/${v.grants[0].id}/review`, { outcome: 'JUSTIFIED' })).status, 400, 'a note is required');
  assert.equal((await admin.post(`/api/security/break-glass/${v.grants[0].id}/review`, { outcome: 'JUSTIFIED', note: 'Confirmed with the duty manager' })).status, 200);
  assert.equal((await admin.post(`/api/security/break-glass/${v.grants[0].id}/review`, { outcome: 'NOT_JUSTIFIED', note: 'changed my mind' })).status, 409);
  assert.throws(() => t.db.exec('DELETE FROM break_glass_grants'), /append-only/);
  assert.throws(() => t.db.exec('DELETE FROM recovery_requests'), /append-only/);
});
