// Role templates and the permission matrix (stage S5).
// The matrix is read from the real router, so a new route that forgets its guard — or a guard that names a permission that does not exist — fails here.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';
import { PERMS } from '../server/perms.js';
import { ROLE_TEMPLATES, listRoutes, applyTemplate, effectiveTemplate } from '../server/roles.js';

const PUBLIC = new Set(['POST /api/login', 'POST /api/login/mfa', 'GET /api/time']);
const ROLES = ['admin', 'supervisor', 'reception', 'clinician'];
let t, admin, sup, rec, pt1, pt2, ort, gm, cfg, routes;
const dept = (n) => cfg.departments.find((d) => d.name === n).id;
const fill = (path) => path.replace(/:[A-Za-z]+/g, '999999');
const call = (who, r) => who[r.method.toLowerCase()](fill(r.path), r.method === 'GET' ? undefined : {});

before(async () => {
  t = await boot();
  [admin, sup, rec, pt1, pt2, ort, gm] = await Promise.all(['admin', 'super', 'reception', 'pt.one', 'pt.two', 'dr.ort', 'gm.one'].map(t.login));
  cfg = (await admin.get('/api/config')).body;
  routes = listRoutes(t.app);
});
after(() => t.close());

test('S5-1 every API route is either on the public list or behind the guard', () => {
  assert.ok(routes.length > 80, `found ${routes.length} routes`);
  const open = routes.filter((r) => !r.guarded && !PUBLIC.has(`${r.method} ${r.path}`));
  assert.deepEqual(open, [], 'unguarded routes: ' + open.map((r) => `${r.method} ${r.path}`).join(', '));
});

test('S5-2 every permission named by a guard exists in the matrix (a typo would silently lock everyone out or in)', () => {
  const names = [...new Set(routes.filter((r) => r.permission).map((r) => r.permission))];
  for (const n of names) assert.ok(PERMS[n], `permission “${n}” is used by a route but not defined in perms.js`);
});

test('S5-3 without signing in, no guarded route answers with anything but 401', async () => {
  for (const r of routes.filter((x) => x.guarded)) {
    const res = await fetch(t.base + fill(r.path), { method: r.method, headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: r.method === 'GET' ? undefined : '{}' });
    assert.equal(res.status, 401, `${r.method} ${r.path}`);
  }
});

test('S5-4 every route with a named permission refuses each role that does not hold it (403) — across all four roles', async () => {
  const people = { admin, supervisor: sup, reception: rec, clinician: pt1 };
  let checked = 0;
  for (const r of routes.filter((x) => x.guarded && x.permission)) {
    for (const role of ROLES) {
      if (PERMS[r.permission].includes(role)) continue;
      const res = await call(people[role], r);
      assert.equal(res.status, 403, `${role} → ${r.method} ${r.path} (needs ${r.permission}) got ${res.status}`);
      assert.equal(res.body.code ?? res.body.error?.code, 'FORBIDDEN');
      checked++;
    }
  }
  assert.ok(checked > 60, `${checked} denials checked`);
});

test('S5-5 administrator status never grants clinical authorization', async () => {
  const p = (await rec.post('/api/patients', { name: 'Admin Authorization Probe' })).body;
  const reg = (await rec.post('/api/registrations', { patient_id: p.id, department_id: dept('Physiotherapy') })).body;
  const visitId = reg.visit?.id ?? reg.visit_id;
  const room = cfg.rooms.find((r) => r.department_id === dept('Physiotherapy'));
  assert.equal((await admin.post(`/api/visits/${visitId}/room`, { room_id: room.id })).status, 201);
  assert.equal((await admin.post(`/api/visits/${visitId}/room/enter`)).status, 200);
  const svc = cfg.services.find((s) => s.department_id === dept('Physiotherapy') && s.name === 'PT Treatment');
  const r = await admin.post(`/api/visits/${visitId}/sessions`, { service_id: svc.id });
  assert.equal(r.status, 403, 'the administrator holds no service authorization and cannot start treatment without naming an authorized clinician');
});

test('S5-6 role templates: each of the seven maps onto an enforced role and is checked against department', () => {
  assert.deepEqual(ROLE_TEMPLATES.map((x) => x.key), ['super_admin', 'clinic_manager', 'receptionist', 'physiotherapist', 'orthopedic_doctor', 'general_practitioner', 'other_clinical']);
  for (const x of ROLE_TEMPLATES) assert.ok(ROLES.includes(x.base_role));
  const name = (id) => ({ 1: 'Physiotherapy', 2: 'Orthopedics', 3: 'General Medicine', 4: 'Rehabilitation' })[id];
  assert.equal(applyTemplate('physiotherapist', { department_id: 1 }, name).role, 'clinician');
  assert.ok(applyTemplate('physiotherapist', { department_id: null }, name).fields.department_id, 'needs a department');
  assert.ok(applyTemplate('physiotherapist', { department_id: 2 }, name).fields.department_id, 'wrong department');
  assert.equal(applyTemplate('other_clinical', { department_id: 4 }, name).role, 'clinician');
  assert.ok(applyTemplate('receptionist', { role: 'admin' }, name).fields.role_template, 'role must agree with the template');
  assert.ok(applyTemplate('clinic_manager', { department_id: 1 }, name).fields.department_id, 'managers work across departments');
  assert.ok(applyTemplate('nonsense', {}, name).fields.role_template);
  assert.equal(effectiveTemplate({ role: 'reception' }), 'receptionist');
  assert.equal(effectiveTemplate({ role: 'clinician', role_template: 'physiotherapist' }), 'physiotherapist');
});

test('S5-7 creating and editing staff through a template sets the role, rejects mismatches and is audited', async () => {
  const body = { username: 'new.physio', name: 'New Physio', password: 'Str0ng-Pass-Phrase-77', role_template: 'physiotherapist', department_id: dept('Physiotherapy') };
  const bad = await admin.post('/api/config/staff', { ...body, department_id: dept('Orthopedics') });
  assert.equal(bad.status, 400); assert.ok(bad.body.fields?.department_id ?? bad.body.error?.fields?.department_id);
  const ok = await admin.post('/api/config/staff', body); assert.equal(ok.status, 201);
  const list = (await admin.get('/api/staff')).body; const me = list.find((s) => s.id === ok.body.id);
  assert.equal(me.role, 'clinician'); assert.equal(me.role_template, 'physiotherapist');
  assert.deepEqual(me.service_ids, [], 'a template grants no clinical service authorization');
  // changing the role by hand clears the stale template label
  const p = await admin.patch(`/api/config/staff/${ok.body.id}`, { role: 'reception', department_id: null });
  assert.equal(p.status, 200);
  assert.equal((await admin.get('/api/staff')).body.find((s) => s.id === ok.body.id).role_template, 'receptionist');
  const log = (await admin.get('/api/audit')).body;
  assert.ok((log.rows ?? log).some((a) => a.action === 'config.staff.create' && JSON.stringify(a.detail).includes('physiotherapist')));
});

test('S5-8 only an administrator can read the permission matrix, and it lists the real routes', async () => {
  for (const who of [sup, rec, pt1]) assert.equal((await who.get('/api/security/permissions')).status, 403);
  const m = (await admin.get('/api/security/permissions')).body;
  assert.equal(m.templates.length, 7);
  assert.ok(m.endpoints.some((e) => e.method === 'GET' && e.path === '/api/visits/:id/timeline' && e.permission === 'patients.read'));
  assert.ok(m.endpoints.length === routes.length);
});

// ---------- object-level access: changing an id in the URL or body must not reach another department ----------
let orthoVisit, orthoSession, orthoQueue, orthoPatient, orthoRoom, physioRoom;
test('S5-9 setup: an orthopedic patient with a room and a running session', async () => {
  orthoPatient = (await rec.post('/api/patients', { name: 'Ortho Only Patient', phone: '0509990001' })).body;
  const reg = (await rec.post('/api/registrations', { patient_id: orthoPatient.id, department_id: dept('Orthopedics') })).body;
  orthoVisit = reg.visit?.id ?? reg.visit_id;
  orthoQueue = (await admin.get(`/api/queue?department_id=${dept('Orthopedics')}`)).body.entries.find((e) => e.visit_id === orthoVisit).id;
  orthoRoom = cfg.rooms.find((r) => r.department_id === dept('Orthopedics')); physioRoom = cfg.rooms.find((r) => r.department_id === dept('Physiotherapy'));
  assert.equal((await ort.post(`/api/visits/${orthoVisit}/room`, { room_id: orthoRoom.id })).status, 201);
  assert.equal((await ort.post(`/api/visits/${orthoVisit}/room/enter`)).status, 200);
  const svc = cfg.services.find((s) => s.department_id === dept('Orthopedics'));
  const s = await ort.post(`/api/visits/${orthoVisit}/sessions`, { service_id: svc.id });
  assert.equal(s.status, 201); orthoSession = s.body.id ?? s.body.session?.id;
  assert.ok(orthoSession);
});

const DENIED = [401, 403, 404];
test('S5-10 a physiotherapist cannot read, change or act on an orthopedic visit by guessing its ids', async () => {
  const v = orthoVisit, s = orthoSession;
  const attempts = [
    ['get', `/api/visits/${v}/timeline`], ['get', `/api/sessions/${s}/documentation`],
    ['put', `/api/sessions/${s}/documentation`, { clinical_note: 'x' }],
    ['post', `/api/visits/${v}/room`, { room_id: physioRoom.id }], ['post', `/api/visits/${v}/room/enter`], ['post', `/api/visits/${v}/room/exit`],
    ['post', `/api/visits/${v}/room/transfer`, { room_id: physioRoom.id, reason: 'tamper' }],
    ['post', `/api/visits/${v}/sessions`, { service_id: cfg.services.find((x) => x.name === 'PT Treatment').id }],
    ['get', `/api/visits/${v}/treatment-options`],
    ['post', `/api/sessions/${s}/pause`], ['post', `/api/sessions/${s}/resume`], ['post', `/api/sessions/${s}/complete`, { mode: 'AUTO' }],
    ['post', `/api/visits/${v}/checkout`],
    ['patch', `/api/queue/${orthoQueue}/priority`, { priority: 'URGENT', reason: 'tamper' }],
    ['post', '/api/queue/call-next', { department_id: dept('Orthopedics') }],
    ['post', '/api/corrections', { kind: 'SESSION_END', entity_id: s, corrected_ts: new Date().toISOString(), reason: 'tamper' }],
  ];
  for (const [m, path, body] of attempts) {
    const res = await pt1[m](path, body);
    assert.ok(DENIED.includes(res.status), `physiotherapist ${m.toUpperCase()} ${path} → ${res.status} (expected a refusal)`);
  }
  // nothing changed
  const tl = (await ort.get(`/api/visits/${v}/timeline`)).body; assert.ok(tl);
  const sess = (await admin.get('/api/sessions/active')).body.sessions.find((x) => x.id === s); assert.equal(sess.status, 'ACTIVE');
});

test('S5-11 lists never show another department’s patients, and searching by name, phone, EMR or id finds nothing', async () => {
  const contains = (rows, f) => JSON.stringify(rows).includes(f);
  assert.ok(!contains((await pt1.get('/api/visits/open')).body, 'Ortho Only'));
  assert.ok(!contains((await pt1.get('/api/sessions/active')).body, 'Ortho Only'));
  assert.ok(!contains((await pt1.get('/api/schedule')).body, 'Ortho Only'));
  assert.ok(!contains((await pt1.get('/api/queue')).body, 'Ortho Only'));
  assert.ok(!contains((await pt1.get('/api/search?patient=Ortho Only')).body, 'Ortho Only'));
  for (const q of ['Ortho Only', '0509990001', orthoPatient.mrn]) assert.equal((await pt1.get(`/api/patients?q=${encodeURIComponent(q)}`)).body.length, 0, q);
  const qd = await pt1.get(`/api/queue?department_id=${dept('Orthopedics')}`);
  assert.ok(qd.status === 403 || !contains(qd.body, 'Ortho Only'), 'asking for the other department explicitly is refused or empty');
  // the same data is visible to the right people
  assert.ok(contains((await ort.get('/api/visits/open')).body, 'Ortho Only'));
  assert.ok(contains((await admin.get('/api/visits/open')).body, 'Ortho Only'));
});

test('S5-12 walking every visit and session id as a physiotherapist exposes only physiotherapy records', async () => {
  const maxV = t.db.prepare('SELECT MAX(id) m FROM visits').get().m, maxS = t.db.prepare('SELECT MAX(id) m FROM treatment_sessions').get().m;
  const physio = dept('Physiotherapy');
  for (let i = 1; i <= maxV + 2; i++) {
    const res = await pt1.get(`/api/visits/${i}/timeline`);
    const row = t.db.prepare('SELECT v.id, (SELECT department_id FROM queue_entries WHERE visit_id=v.id ORDER BY id LIMIT 1) dep FROM visits v WHERE v.id=?').get(i);
    if (res.status === 200) assert.equal(row?.dep, physio, `visit ${i} was readable but belongs to department ${row?.dep}`);
    else assert.ok(DENIED.includes(res.status), `visit ${i} → ${res.status}`);
  }
  for (let i = 1; i <= maxS + 2; i++) {
    const res = await pt1.get(`/api/sessions/${i}/documentation`);
    const row = t.db.prepare('SELECT s.id, (SELECT department_id FROM services WHERE id=s.service_id) dep FROM treatment_sessions s WHERE s.id=?').get(i);
    if (res.status === 200) assert.equal(row?.dep, physio, `session ${i} documentation was readable but belongs to department ${row?.dep}`);
    else assert.ok(DENIED.includes(res.status), `session ${i} → ${res.status}`);
  }
});

test('S5-13 a clinician cannot start treatment for a service they are not authorized for, nor on behalf of a colleague', async () => {
  // rooms are shared facilities (a visit may use any free room); patient data is protected through the visit, which is checked above
  // a colleague with a different service list cannot be impersonated either: pt.two is not authorized for Electrical Stimulation
  const p = (await rec.post('/api/patients', { name: 'Service Tamper Patient' })).body;
  const reg = (await rec.post('/api/registrations', { patient_id: p.id, department_id: dept('Physiotherapy') })).body; const v = reg.visit?.id ?? reg.visit_id;
  await pt2.post(`/api/visits/${v}/room`, { room_id: physioRoom.id }); await pt2.post(`/api/visits/${v}/room/enter`);
  const es = cfg.services.find((x) => x.name === 'Electrical Stimulation');
  assert.equal((await pt2.post(`/api/visits/${v}/sessions`, { service_id: es.id })).status, 403, 'unauthorized service');
  assert.equal((await pt2.post(`/api/visits/${v}/sessions`, { service_id: es.id, clinician_id: (await pt1.get('/api/me')).body.user?.id ?? pt1.user.id })).status, 403, 'a clinician cannot start on behalf of another clinician');
});

test('S5-14 reception and managers have no clinical or administrative reach beyond their template', async () => {
  const s = orthoSession;
  assert.equal((await rec.put(`/api/sessions/${s}/documentation`, { clinical_note: 'x' })).status, 403);
  assert.equal((await rec.get('/api/reports')).status, 403);
  assert.equal((await rec.get('/api/audit')).status, 403);
  assert.equal((await rec.patch('/api/config/settings', { clinic_name: 'x' })).status, 403);
  assert.equal((await sup.patch('/api/config/settings', { clinic_name: 'x' })).status, 403);
  assert.equal((await sup.post('/api/config/staff', { username: 'x.y', name: 'X', role: 'admin', password: 'Str0ng-Pass-Phrase-77' })).status, 403);
  assert.equal((await sup.get('/api/security/permissions')).status, 403);
  assert.equal((await gm.get('/api/reports')).status, 403);
});
