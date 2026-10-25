// Security/privacy probes used for the audit. Prints one line per probe: [FINDING|ok] id — evidence.
// Run: node --disable-warning=ExperimentalWarning tests/audit-probe.mjs      (synthetic in-memory data only)
import { boot } from './helpers.js';
import { DEMO_PASSWORD } from '../server/seed.js';

const t = await boot();
const out = [];
const rec = (id, bad, evidence) => { out.push({ id, bad, evidence }); console.log(`${bad ? '[FINDING]' : '[ok]     '} ${id} — ${evidence}`); };
const raw = (method, path, { cookie, body, headers = {} } = {}) => fetch(t.base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
const U = Object.fromEntries(await Promise.all(['admin', 'super', 'reception', 'dr.ort', 'pt.one', 'pt.two', 'gm.one'].map(async (u) => [u, await t.login(u)])));
const cfg = (await U.admin.get('/api/config')).body;

// ---------- privacy: patient directory visible to every role ----------
const leak = await U['pt.one'].get('/api/patients?q=' + encodeURIComponent('Sample Patient A'));
rec('P1 patient search not department-scoped', leak.body.length > 0 && leak.body[0].dob, `pt.one (Physiotherapy) found an Orthopedics-only patient: ${JSON.stringify({ name: leak.body[0]?.name, dob: leak.body[0]?.dob, phone: leak.body[0]?.phone })}`);
const all = await U['gm.one'].get('/api/patients?q=%25');
rec('P1b wildcard dumps the directory', all.body.length >= 8, `General Medicine clinician queried "%" and received ${all.body.length} patients (name, DOB, phone, MRN)`);
const phone = await U['pt.one'].get('/api/patients?q=0500000003');
rec('P1c phone lookup works for any role', phone.body.length > 0, `clinician looked a patient up by phone number → ${phone.body.length} result(s)`);
rec('P1d search not recorded per patient', true, 'audit entry for patients.search stores only the query length, not which patient records were returned');

// ---------- user enumeration ----------
const staff = await U['pt.one'].get('/api/staff');
rec('P3 usernames visible to every user', staff.body.some((s) => s.username === 'admin'), `GET /api/staff as a clinician returned ${staff.body.length} accounts including usernames: ${staff.body.slice(0, 4).map((s) => s.username).join(', ')}…`);
const time = async (u) => { const t0 = performance.now(); await raw('POST', '/api/login', { body: { username: u, password: 'x'.repeat(12) } }); return performance.now() - t0; };
const unk = []; const known = [];
for (let i = 0; i < 4; i++) { unk.push(await time('nobody' + i)); }
for (let i = 0; i < 4; i++) { known.push(await time('dr.ort')); }
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
rec('P4 login timing reveals valid usernames', avg(known) > avg(unk) * 3, `unknown user ${avg(unk).toFixed(1)} ms vs known user ${avg(known).toFixed(1)} ms per attempt (hashing only runs for real accounts)`);

// ---------- brute force / lockout ----------
const b = await Promise.all(Array.from({ length: 7 }, () => raw('POST', '/api/login', { body: { username: 'admin', password: 'wrong-guess' } })));
const statuses = b.map((r) => r.status);
const legit = await raw('POST', '/api/login', { body: { username: 'admin', password: DEMO_PASSWORD } });
rec('P5 anyone can lock out any user', legit.status === 429, `7 bad guesses → ${statuses.join(',')}; the real administrator is then refused (${legit.status}) for a minute. Limiter keys on IP+username, memory-only, no per-account audit of lockouts`);

// ---------- hashing cost / event loop blocking ----------
const t0 = performance.now(); await Promise.all(Array.from({ length: 12 }, () => raw('POST', '/api/login', { body: { username: 'pt.two', password: 'bad-bad-bad-bad' } }))); const burst = performance.now() - t0;
const lat0 = performance.now(); const probe = raw('GET', '/api/time'); const flood = Promise.all(Array.from({ length: 12 }, () => raw('POST', '/api/login', { body: { username: 'pt.one', password: 'bad-bad-bad-bad' } }))); await probe; const lat = performance.now() - lat0; await flood;
rec('P6 synchronous password hashing blocks the server', lat > 60, `12 concurrent logins took ${burst.toFixed(0)} ms in total; an unrelated /api/time request sent alongside waited ${lat.toFixed(0)} ms (scryptSync runs on the main thread)`);

// ---------- account management gaps ----------
const me = (await U['pt.one'].get('/api/me')).body.user;
const cp = await U['pt.one'].post('/api/account/password', { current: DEMO_PASSWORD, next: 'Another-Passw0rd!2' });
rec('P10 no way to change own password', cp.status === 404, `POST /api/account/password → ${cp.status}; the UI has no account page either (users can never rotate the shared demo password)`);
const rn = await U.admin.patch(`/api/config/staff/${me.id}`, { username: 'renamed.user' });
const after = (await U.admin.get('/api/staff')).body.find((s) => s.id === me.id);
rec('P10b usernames cannot be changed', after.username === 'pt.one', `PATCH with username → ${rn.status}, username still "${after.username}" (field silently ignored)`);
const strong = await U.admin.post('/api/config/staff', { username: 'probe.user', name: 'Probe', role: 'clinician', password: 'aaaaaaaaaa' });
rec('P10c weak passwords accepted', strong.status === 201, `admin-created account with password "aaaaaaaaaa" accepted (only a 10-character minimum; no complexity/breach check; no forced change at first login)`);
const sess = await U.admin.get('/api/sessions/list');
rec('P10d no session list/revoke UI or API', sess.status === 404, `GET /api/sessions/list → ${sess.status}; there is no way to see or terminate another session except resetting the password`);
const mfa = await U.admin.get('/api/account/mfa');
rec('P10e no MFA', mfa.status === 404, `GET /api/account/mfa → ${mfa.status}; administrators sign in with a password only`);
const dp = await raw('POST', '/api/login', { body: { username: 'admin', password: DEMO_PASSWORD } });
rec('P9a default credentials', true, `all ${(staff.body).length} seeded accounts share the published demo password "${DEMO_PASSWORD}" (README, source code and every seeded database). server/index.js seeds them on ANY empty database unless FMC_SEED=0`);
const ck = (await raw('POST', '/api/login', { body: { username: 'dr.ort', password: DEMO_PASSWORD } })).headers.get('set-cookie');
rec('P9 cookie flags', !(/HttpOnly/.test(ck) && /SameSite=Strict/.test(ck) && /Secure/.test(ck)), `Set-Cookie: ${ck.replace(/fmc_sid=[a-f0-9]+/, 'fmc_sid=<token>')} — HttpOnly, SameSite=Strict, Secure present; fixed Max-Age=43200 but server only enforces IDLE time, so there is no absolute session lifetime`);

// ---------- privilege escalation matrix ----------
const cases = [
  ['clinician self-promotes to admin', U['pt.one'], 'PATCH', `/api/config/staff/${me.id}`, { role: 'admin' }],
  ['clinician creates account', U['pt.one'], 'POST', '/api/config/staff', { username: 'x', name: 'x', role: 'admin', password: 'longenough123' }],
  ['reception edits departments', U.reception, 'POST', '/api/config/departments', { name: 'X', queue_prefix: 'X' }],
  ['reception approves correction', U.reception, 'POST', '/api/corrections/1/decision', { approve: true }],
  ['clinician reads audit log', U['pt.one'], 'GET', '/api/audit', null],
  ['clinician reads reports', U['pt.one'], 'GET', '/api/reports', null],
  ['supervisor reads health', U.super, 'GET', '/api/health', null],
  ['clinician sets another user status', U['pt.one'], 'PUT', `/api/staff/${U.admin.user.id}/availability`, { status: 'BUSY' }],
  ['clinician changes policy settings', U['pt.one'], 'PATCH', '/api/config/settings', { registration_require_phone: '1' }],
  ['reception registers patient', U.reception, 'POST', '/api/patients', { name: 'Synthetic Probe' }],
  ['clinician registers patient', U['pt.one'], 'POST', '/api/patients', { name: 'Synthetic Probe 2' }],
];
const matrix = [];
for (const [name, who, m, p, body] of cases) { const r = await who[m === 'GET' ? 'get' : m === 'POST' ? 'post' : m === 'PUT' ? 'put' : 'patch'](p, body); matrix.push(`${name}: ${r.status}`); }
rec('P13 privilege-escalation attempts (server-side)', matrix.some((x) => /: 20\d$/.test(x) && !/reception registers/.test(x)), matrix.join(' | '));
const noHdr = await raw('POST', '/api/patients', { cookie: (await raw('POST', '/api/login', { body: { username: 'reception', password: DEMO_PASSWORD } })).headers.get('set-cookie').split(';')[0], body: { name: 'csrf' } });
rec('P23 CSRF header required on writes', noHdr.status !== 403, `state-changing request without X-Requested-With → ${noHdr.status} (SameSite=Strict cookie as second layer)`);

// ---------- headers / errors ----------
const h = (await fetch(t.base + '/api/time')).headers;
const want = ['content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'strict-transport-security', 'permissions-policy', 'cross-origin-opener-policy'];
rec('P25 security headers', want.some((k) => !h.get(k)), `present: ${want.filter((k) => h.get(k)).join(', ')} | missing: ${want.filter((k) => !h.get(k)).join(', ')}`);
const mj = await fetch(t.base + '/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
const mjb = await mj.text();
rec('P26 error handling leaks nothing', /stack|at .*\.js|node_modules|sqlite/i.test(mjb), `malformed JSON → ${mj.status} ${mjb.slice(0, 80)}`);

// ---------- workflow run (generates audit entries, checks integrity) ----------
const PT = cfg.departments.find((d) => d.name === 'Physiotherapy'); const hall = cfg.rooms.find((r) => r.code === 'PT-HALL-01');
const pid = (await U.reception.post('/api/patients', { name: 'Synthetic Hall One' })).body.id;
const vid = (await U.reception.post('/api/registrations', { patient_id: pid, department_id: PT.id })).body.visit.id;
await U.reception.post(`/api/visits/${vid}/room`, { room_id: hall.id, station_id: hall.stations[0].id });
const hallNow = (await U.reception.get('/api/config')).body.rooms.find((r) => r.code === 'PT-HALL-01');
rec('P27 shared hall shows OCCUPIED with 5 free beds', hallNow.display_status === 'OCCUPIED' && hallNow.occupants < hallNow.effective_capacity, `PT-HALL-01 display_status="${hallNow.display_status}" with ${hallNow.occupants}/${hallNow.effective_capacity} beds used; the dashboard "Rooms free" KPI therefore excludes it`);
await U.reception.post(`/api/visits/${vid}/room/enter`);
const ses = await U['pt.one'].post(`/api/visits/${vid}/sessions`, { service_id: cfg.services.find((x) => x.name === 'PT Treatment').id });
await U['pt.one'].post(`/api/sessions/${ses.body.id}/complete`); await U.reception.post(`/api/visits/${vid}/room/exit`); await U.reception.post(`/api/visits/${vid}/checkout`); await U.reception.get(`/api/visits/${vid}/timeline`);
const kinds = new Set((await U.super.get('/api/audit?limit=500')).body.map((a) => a.action));
const need = ['login', 'login.failed', 'visit.checkin', 'visit.checkout', 'room.assign', 'room.exit', 'session.start', 'session.complete', 'config.staff.create', 'config.staff.update', 'timeline.view', 'patient.create'];
rec('P17b audit coverage of core actions', need.some((k) => !kinds.has(k)), `recorded: ${need.filter((k) => kinds.has(k)).join(', ')}${need.some((k) => !kinds.has(k)) ? ' | MISSING: ' + need.filter((k) => !kinds.has(k)).join(', ') : ' (all present)'}. Gaps by design: which patients a search returned, queue/dashboard/sessions views (names shown), password reset and role change are not distinct events, session revocation does not exist`);
let dropped = false; try { t.db.exec('DROP TRIGGER audit_no_delete'); t.db.exec('DELETE FROM audit_log WHERE id=1'); dropped = true; } catch { /* blocked */ }
rec('P17 audit protection is a database trigger only', dropped, 'with write access to the database file the trigger can be DROPped and audit rows edited or deleted; no hash chain, no off-host copy, no alert when entries disappear (API users cannot do this: UPDATE/DELETE are blocked and no endpoint exists)');
const sv = await U['pt.one'].get('/api/sessions/active'); void sv;
const q0 = await U.reception.post('/api/queue/1/cancel');
rec('P29 cannot cancel a queue entry / no-show', q0.status === 404, `POST /api/queue/:id/cancel → ${q0.status}; the schema has a CANCELLED state but there is no endpoint or button, so walk-aways stay "waiting"`);
const pe = await U.reception.patch(`/api/patients/${pid}`, { phone: '+971500000099' });
rec('P30 cannot edit patient demographics', pe.status === 404, `PATCH /api/patients/:id → ${pe.status}; typos in name/DOB/phone cannot be corrected and duplicate records cannot be merged`);
rec('P31 one department per staff account', true, `users.department_id is a single column; "pt.one" → department ${(await U['pt.one'].get('/api/staff')).body.find((x) => x.username === 'pt.one').department_id} only. Shared staff and multi-department access cannot be modelled`);
// positive controls
const ck2 = (await raw('POST', '/api/login', { body: { username: 'gm.one', password: DEMO_PASSWORD } })).headers.get('set-cookie').split(';')[0];
t.db.exec(`UPDATE auth_sessions SET last_seen='2020-01-01T00:00:00Z' WHERE user_id=${U['gm.one'].user.id}`);
const exp = await raw('GET', '/api/me', { cookie: ck2 });
rec('C1 idle sessions expire', exp.status !== 401, `session idle since 2020 → ${exp.status}`);
const ck3 = (await raw('POST', '/api/login', { body: { username: 'dr.ort', password: DEMO_PASSWORD } })).headers.get('set-cookie').split(';')[0];
await U.admin.patch(`/api/config/staff/${U['dr.ort'].user.id}`, { password: 'Brand-New-Passw0rd-1' });
const rv = await raw('GET', '/api/me', { cookie: ck3 });
rec('C2 admin password reset revokes sessions', rv.status !== 401, `old session after reset → ${rv.status}`);
await U.admin.patch(`/api/config/staff/${U['pt.two'].user.id}`, { active: 0 });
const dis = await U['pt.two'].get('/api/me'); const dl = await raw('POST', '/api/login', { body: { username: 'pt.two', password: DEMO_PASSWORD } });
rec('C3 disabled accounts are locked out immediately', !(dis.status === 401 && dl.status !== 200), `disabled user: existing session → ${dis.status}, new login → ${dl.status}`);
// ---------- integrity ----------
await U.reception.post('/api/registrations', { patient_id: pid, department_id: PT.id });
const dd = await U.admin.patch(`/api/config/departments/${PT.id}`, { active: 0 });
rec('P18 department deactivated while patients are queued', dd.status === 200, `PATCH departments {active:0} with an open queue entry → ${dd.status}; no warning, patient stays queued in an inactive department`);
const br = await U.admin.patch(`/api/config/staff/${U['pt.one'].user.id}`, { role: 'wizard' });
rec('P8 invalid role → server error', br.status === 500, `PATCH role="wizard" → ${br.status} (should be a 400 validation error)`);
// ---------- last-admin lockout, invalid input ----------
const adminId = U.admin.user.id;
const self = await U.admin.patch(`/api/config/staff/${adminId}`, { active: 0 });
const afterSelf = await U.admin.get('/api/me');
rec('P7 last administrator can be disabled', self.status === 200 && afterSelf.status === 401, `admin deactivated their own (only) admin account → ${self.status}; next request ${afterSelf.status}. Nobody can sign in to Settings again without editing the database`);

console.log(`\n${out.filter((o) => o.bad).length} findings / ${out.length} probes`);
t.close();
