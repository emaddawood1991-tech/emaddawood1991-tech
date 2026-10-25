import express from 'express';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { openDb, tx } from './db.js';
import { makeOps, HttpError, now } from './ops.js';
import { makeRegistration } from './registration.js';
import { can, deptScope } from './perms.js';

export function hashPassword(pw) {
  const salt = randomBytes(16);
  return `s1$${salt.toString('hex')}$${scryptSync(pw, salt, 32).toString('hex')}`;
}
function verifyPassword(pw, stored) {
  const [, saltHex, hashHex] = String(stored).split('$');
  if (!saltHex) return false;
  const h = scryptSync(pw, Buffer.from(saltHex, 'hex'), 32);
  return timingSafeEqual(h, Buffer.from(hashHex, 'hex'));
}
const sha = (s) => createHash('sha256').update(s).digest('hex');

// whitelisted columns for generic config CRUD
const CONFIG = {
  departments: ['name', 'name_ar', 'queue_prefix', 'queue_start', 'queue_reset_daily', 'active'],
  rooms: ['department_id', 'code', 'name', 'name_ar', 'capacity', 'cleaning_after_use', 'active'],
  stations: ['room_id', 'code', 'active'],
  services: ['department_id', 'name', 'name_ar', 'default_minutes', 'active'],
};

export function createApp({ db = openDb(), backupDir = new URL('../data/backups/', import.meta.url).pathname, staticDir } = {}) {
  const ops = makeOps(db);
  const { q, one, run, audit, fail } = ops;
  const reg = makeRegistration(db, ops);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '200kb' }));
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:",
    });
    next();
  });

  // ---- auth ----
  const cookieOf = (req) => /(?:^|;\s*)fmc_sid=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
  const attempts = new Map();
  function authenticate(req, _res, next) {
    const tok = cookieOf(req);
    req.user = null;
    if (tok) {
      const s = one('SELECT * FROM auth_sessions WHERE token_hash=?', sha(tok));
      const maxIdle = Number(ops.setting('session_idle_hours') || 12) * 3600e3;
      if (s && Date.now() - Date.parse(s.last_seen) < maxIdle) {
        const u = one('SELECT id,username,name,name_ar,role,department_id,active FROM users WHERE id=?', s.user_id);
        if (u?.active) { req.user = u; run('UPDATE auth_sessions SET last_seen=? WHERE token_hash=?', now(), s.token_hash); }
      }
    }
    next();
  }
  const guard = (perm) => (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'UNAUTHENTICATED', 'Please sign in'));
    if (perm && !can(req.user, perm)) return next(new HttpError(403, 'FORBIDDEN', `Missing permission: ${perm}`));
    // CSRF: state-changing requests must carry the custom header (cross-site forms cannot set it)
    if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'fmc') return next(new HttpError(403, 'CSRF', 'Missing request header'));
    next();
  };
  app.use('/api', authenticate);

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body || {};
    const key = `${req.ip}|${String(username).toLowerCase()}`;
    const a = attempts.get(key);
    if (a && a.n >= 5 && Date.now() - a.t < 60e3) throw new HttpError(429, 'TOO_MANY_ATTEMPTS', 'Try again in a minute');
    const u = one('SELECT * FROM users WHERE username=? AND active=1', String(username || ''));
    if (!u || !verifyPassword(String(password || ''), u.pass_hash)) {
      attempts.set(key, { n: (a && Date.now() - a.t < 60e3 ? a.n : 0) + 1, t: Date.now() });
      audit(null, 'login.failed', 'user', null, { username: String(username).slice(0, 50) });
      throw new HttpError(401, 'BAD_CREDENTIALS', 'Invalid username or password');
    }
    attempts.delete(key);
    const token = randomBytes(32).toString('hex');
    run('INSERT INTO auth_sessions(token_hash,user_id,created_at,last_seen) VALUES (?,?,?,?)', sha(token), u.id, now(), now());
    res.set('Set-Cookie', `fmc_sid=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.FMC_INSECURE_COOKIES === '1' ? '' : '; Secure'}`);
    audit(u, 'login', 'user', u.id);
    res.json({ user: { id: u.id, username: u.username, name: u.name, name_ar: u.name_ar, role: u.role, department_id: u.department_id }, server_time: now() });
  });
  app.post('/api/logout', guard(), (req, res) => {
    const tok = cookieOf(req);
    if (tok) run('DELETE FROM auth_sessions WHERE token_hash=?', sha(tok));
    res.set('Set-Cookie', 'fmc_sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    audit(req.user, 'logout', 'user', req.user.id);
    res.json({ ok: true });
  });
  app.get('/api/me', guard(), (req, res) => res.json({ user: req.user, server_time: now(), timezone: ops.setting('timezone') }));
  app.get('/api/time', (_req, res) => res.json({ server_time: now() }));

  // ---- reference data (read: any signed-in user) ----
  app.get('/api/config', guard(), (req, res) => {
    const s = deptScope(req.user);
    res.json({
      departments: q('SELECT * FROM departments ORDER BY name'),
      rooms: q('SELECT * FROM rooms ORDER BY code').map(ops.roomState),
      services: q('SELECT * FROM services ORDER BY name'),
      scope_department: s,
      settings: Object.fromEntries(q('SELECT * FROM settings').map((r) => [r.key, r.value])),
    });
  });
  app.get('/api/staff', guard(), (_req, res) => {
    res.json(q(`SELECT u.id,u.username,u.name,u.name_ar,u.role,u.department_id,u.active, COALESCE(a.status,'OFF_DUTY') availability, a.updated_at availability_updated,
      (SELECT group_concat(service_id) FROM staff_services WHERE user_id=u.id) service_ids FROM users u LEFT JOIN staff_availability a ON a.user_id=u.id ORDER BY u.name`)
      .map((r) => ({ ...r, service_ids: r.service_ids ? r.service_ids.split(',').map(Number) : [] })));
  });

  // ---- config CRUD (admin) ----
  for (const [table, cols] of Object.entries(CONFIG)) {
    app.post(`/api/config/${table}`, guard('config.manage'), (req, res) => {
      const vals = cols.filter((c) => req.body[c] !== undefined);
      if (!vals.length) throw new HttpError(400, 'EMPTY');
      let r;
      try { r = run(`INSERT INTO ${table}(${vals.join(',')}) VALUES (${vals.map(() => '?').join(',')})`, ...vals.map((c) => req.body[c])); }
      catch (e) { throw new HttpError(400, 'INVALID', String(e.message).replace(/^.*constraint failed: /, '')); }
      audit(req.user, `config.${table}.create`, table, r.lastInsertRowid, req.body);
      res.status(201).json(one(`SELECT * FROM ${table} WHERE id=?`, Number(r.lastInsertRowid)));
    });
    app.patch(`/api/config/${table}/:id`, guard('config.manage'), (req, res) => {
      const vals = cols.filter((c) => req.body[c] !== undefined);
      if (!vals.length) throw new HttpError(400, 'EMPTY');
      if (table === 'rooms' && req.body.active === 0 && ops.one('SELECT 1 x FROM occupancy WHERE room_id=? AND exited_at IS NULL', req.params.id)) throw new HttpError(409, 'ROOM_OCCUPIED');
      try { run(`UPDATE ${table} SET ${vals.map((c) => `${c}=?`).join(',')} WHERE id=?`, ...vals.map((c) => req.body[c]), req.params.id); }
      catch (e) { throw new HttpError(400, 'INVALID', String(e.message).replace(/^.*constraint failed: /, '')); }
      audit(req.user, `config.${table}.update`, table, req.params.id, req.body);
      res.json(one(`SELECT * FROM ${table} WHERE id=?`, req.params.id));
    });
  }
  app.patch('/api/config/settings', guard('config.manage'), (req, res) => {
    const flags = ['correction_requires_approval', 'transfer_reason_required', 'registration_require_name_ar', 'registration_require_phone', 'require_service_at_checkin'];
    const allowed = ['timezone', 'session_idle_hours', 'gender_options', ...flags];
    const body = req.body || {};
    for (const [k, v] of Object.entries(body)) {
      if (!allowed.includes(k)) continue;
      if (flags.includes(k) && !['0', '1'].includes(String(v))) throw new HttpError(400, 'INVALID', `${k} must be 0 or 1`);
      if (k === 'gender_options') {
        const list = typeof v === 'string' ? (() => { try { return JSON.parse(v); } catch { return null; } })() : v;
        if (!Array.isArray(list) || !list.length || list.some((g) => !g || !/^[A-Za-z0-9_-]{1,10}$/.test(String(g.code)) || !String(g.en || '').trim()) || new Set(list.map((g) => g.code)).size !== list.length)
          throw new HttpError(400, 'INVALID', 'Gender options need a unique short code and an English label.');
        run('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', k, JSON.stringify(list.map((g) => ({ code: String(g.code), en: String(g.en).trim(), ar: String(g.ar || '').trim() }))));
      } else run('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', k, String(v));
      audit(req.user, 'config.settings', 'settings', k, { v: k === 'gender_options' ? 'updated' : v });
    }
    res.json({ ok: true });
  });
  app.post('/api/config/staff', guard('config.manage'), (req, res) => {
    const { username, name, name_ar = '', role, department_id = null, password, service_ids = [] } = req.body;
    if (!password || String(password).length < 10) throw new HttpError(400, 'WEAK_PASSWORD', 'Password must be at least 10 characters');
    const id = tx(db, () => {
      let r;
      try { r = run('INSERT INTO users(username,name,name_ar,role,department_id,pass_hash) VALUES (?,?,?,?,?,?)', username, name, name_ar, role, department_id, hashPassword(password)); }
      catch (e) { throw new HttpError(400, 'INVALID', String(e.message).replace(/^.*constraint failed: /, '')); }
      const uid = Number(r.lastInsertRowid);
      for (const s of service_ids) run('INSERT INTO staff_services VALUES (?,?)', uid, s);
      run("INSERT INTO staff_availability(user_id,status,updated_at,updated_by) VALUES (?, 'OFF_DUTY', ?, ?)", uid, now(), req.user.id);
      return uid;
    });
    audit(req.user, 'config.staff.create', 'user', id, { username, role });
    res.status(201).json({ id });
  });
  app.patch('/api/config/staff/:id', guard('config.manage'), (req, res) => {
    const id = Number(req.params.id);
    if (!one('SELECT 1 x FROM users WHERE id=?', id)) throw new HttpError(404, 'NOT_FOUND', 'Staff member not found.');
    let diff = null;
    if (Array.isArray(req.body.service_ids)) {
      const ids = [...new Set(req.body.service_ids.map(Number))];
      const known = new Set(q('SELECT id FROM services').map((x) => x.id));
      if (ids.some((x) => !known.has(x))) throw new HttpError(400, 'INVALID', 'One of the selected services does not exist.');
      const before = new Set(q('SELECT service_id FROM staff_services WHERE user_id=?', id).map((x) => x.service_id));
      diff = { added: ids.filter((x) => !before.has(x)), removed: [...before].filter((x) => !ids.includes(x)) };
      req.body.service_ids = ids;
    }
    tx(db, () => {
      for (const c of ['name', 'name_ar', 'role', 'department_id', 'active']) if (req.body[c] !== undefined) run(`UPDATE users SET ${c}=? WHERE id=?`, req.body[c], id);
      if (req.body.password) { if (String(req.body.password).length < 10) throw new HttpError(400, 'WEAK_PASSWORD'); run('UPDATE users SET pass_hash=? WHERE id=?', hashPassword(req.body.password), id); run('DELETE FROM auth_sessions WHERE user_id=?', id); }
      if (diff) { run('DELETE FROM staff_services WHERE user_id=?', id); for (const s of req.body.service_ids) run('INSERT INTO staff_services VALUES (?,?)', id, s); }
    });
    audit(req.user, 'config.staff.update', 'user', id, { ...req.body, service_ids: undefined, password: req.body.password ? '***' : undefined });
    if (diff && (diff.added.length || diff.removed.length)) audit(req.user, 'config.staff.authorization', 'user', id, diff);
    res.json({ ok: true });
  });
  app.get('/api/staff/:id/schedule', guard(), (req, res) => res.json(q('SELECT weekday,start_time,end_time FROM staff_schedules WHERE user_id=? ORDER BY weekday,start_time', req.params.id)));
  app.put('/api/staff/:id/schedule', guard('config.manage'), (req, res) => {
    const rows = Array.isArray(req.body) ? req.body : [];
    tx(db, () => { run('DELETE FROM staff_schedules WHERE user_id=?', req.params.id); for (const r of rows) run('INSERT INTO staff_schedules(user_id,weekday,start_time,end_time) VALUES (?,?,?,?)', req.params.id, r.weekday, r.start_time, r.end_time); });
    audit(req.user, 'config.schedule', 'user', req.params.id, { rows: rows.length });
    res.json({ ok: true });
  });
  app.put('/api/staff/:id/availability', guard(), (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFF_DUTY', 'UNAVAILABLE'].includes(status)) throw new HttpError(400, 'BAD_STATUS');
    if (id !== req.user.id && !can(req.user, 'availability.others')) throw new HttpError(403, 'FORBIDDEN');
    run(`INSERT INTO staff_availability(user_id,status,updated_at,updated_by) VALUES (?,?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET status=excluded.status, updated_at=excluded.updated_at, updated_by=excluded.updated_by`, id, status, now(), req.user.id);
    audit(req.user, 'availability.set', 'user', id, { status });
    res.json({ ok: true, status });
  });

  // ---- patients / appointments ----
  app.get('/api/patients', guard('patients.read'), (req, res) => res.json(reg.search(req.user, req.query.q)));
  app.post('/api/patients', guard('patients.write'), (req, res) => {
    const r = reg.createPatient(req.user, req.body || {});
    res.status(r.replayed ? 200 : 201).json({ ...r.patient, replayed: !!r.replayed });
  });
  // Register (or select) a patient and check them into a department queue in one atomic step.
  app.post('/api/registrations', guard('patients.write'), (req, res) => {
    const r = reg.register(req.user, req.body || {});
    res.status(r.replayed ? 200 : 201).json(r);
  });
  app.get('/api/appointments', guard('patients.read'), (req, res) => {
    const s = deptScope(req.user);
    res.json(q(`SELECT a.*, p.name patient_name, p.name_ar patient_name_ar, p.mrn, d.name department, sv.name service, u.name clinician
      FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN departments d ON d.id=a.department_id
      LEFT JOIN services sv ON sv.id=a.service_id LEFT JOIN users u ON u.id=a.clinician_id
      WHERE (? IS NULL OR a.department_id=?) AND a.status='SCHEDULED' ORDER BY a.scheduled_at LIMIT 100`, s, s));
  });
  app.post('/api/appointments', guard('patients.write'), (req, res) => {
    const { patient_id, department_id, service_id = null, clinician_id = null, scheduled_at } = req.body;
    if (!patient_id || !department_id || Number.isNaN(Date.parse(scheduled_at))) throw new HttpError(400, 'INVALID');
    const id = tx(db, () => {
      const n = one('SELECT COALESCE(MAX(id),0)+1 n FROM appointments').n;
      const r = run('INSERT INTO appointments(ref,patient_id,department_id,service_id,clinician_id,scheduled_at,created_at) VALUES (?,?,?,?,?,?,?)', `APT-${String(n).padStart(6, '0')}`, patient_id, department_id, service_id, clinician_id, new Date(scheduled_at).toISOString(), now());
      return Number(r.lastInsertRowid);
    });
    audit(req.user, 'appointment.create', 'appointment', id);
    res.status(201).json(one('SELECT * FROM appointments WHERE id=?', id));
  });

  // ---- visits / queue ----
  app.post('/api/visits/checkin', guard(), (req, res) => res.status(201).json(ops.checkIn(req.user, req.body)));
  app.post('/api/visits/:id/checkout', guard(), (req, res) => res.json(ops.checkOut(req.user, Number(req.params.id))));
  app.get('/api/visits/open', guard('patients.read'), (req, res) => {
    const s = deptScope(req.user);
    const rows = q(`SELECT v.*, p.name patient_name, p.name_ar patient_name_ar, p.mrn FROM visits v JOIN patients p ON p.id=v.patient_id WHERE v.status='OPEN' ORDER BY v.arrived_at`)
      .filter((v) => s == null || ops.visitVisible(req.user, v.id));
    res.json(rows.map((v) => ({
      ...v,
      queue: one("SELECT display,status,department_id FROM queue_entries WHERE visit_id=? AND status IN ('WAITING','CALLED','IN_ROOM') ORDER BY id DESC LIMIT 1", v.id) || null,
      occupancy: one(`SELECT o.id,o.room_id,o.station_id,o.entered_at,r.code room_code,st.code station_code FROM occupancy o JOIN rooms r ON r.id=o.room_id LEFT JOIN stations st ON st.id=o.station_id WHERE o.visit_id=? AND o.exited_at IS NULL`, v.id) || null,
      open_sessions: q("SELECT id,status,service_id FROM treatment_sessions WHERE visit_id=? AND status IN ('ACTIVE','PAUSED')", v.id),
    })));
  });
  app.get('/api/visits/:id/timeline', guard('patients.read'), (req, res) => res.json(ops.timeline(req.user, Number(req.params.id))));
  app.get('/api/queue', guard('queue.view'), (req, res) => res.json({ server_time: now(), entries: ops.queueList(req.user, req.query.department_id) }));
  app.post('/api/queue/call-next', guard(), (req, res) => res.json(ops.callNext(req.user, Number(req.body.department_id), req.body.clinician_id ? Number(req.body.clinician_id) : null)));
  app.patch('/api/queue/:id/priority', guard(), (req, res) => res.json(ops.setPriority(req.user, Number(req.params.id), req.body.priority, req.body.reason)));

  // ---- rooms ----
  app.post('/api/visits/:id/room', guard(), (req, res) => res.status(201).json(ops.assignRoom(req.user, Number(req.params.id), { roomId: req.body.room_id, stationId: req.body.station_id })));
  app.post('/api/visits/:id/room/enter', guard(), (req, res) => res.json(ops.enterRoom(req.user, Number(req.params.id))));
  app.post('/api/visits/:id/room/exit', guard(), (req, res) => res.json(ops.exitRoom(req.user, Number(req.params.id)) || { ok: true }));
  app.post('/api/visits/:id/room/transfer', guard(), (req, res) => res.status(201).json(ops.transferRoom(req.user, Number(req.params.id), { roomId: req.body.room_id, stationId: req.body.station_id, reason: req.body.reason })));
  app.put('/api/rooms/:id/status', guard(), (req, res) => res.json(ops.setRoomStatus(req.user, Number(req.params.id), req.body.status, req.body.reason)));
  app.get('/api/rooms/:id/history', guard('room.maintenance'), (req, res) =>
    res.json(q('SELECT h.*, u.name actor FROM room_status_history h LEFT JOIN users u ON u.id=h.actor_id WHERE room_id=? ORDER BY h.id DESC', req.params.id)));

  // ---- sessions ----
  app.get('/api/sessions/active', guard('patients.read'), (req, res) => res.json({ server_time: now(), sessions: ops.activeSessions(req.user) }));
  app.get('/api/visits/:id/treatment-options', guard('session.run'), (req, res) => res.json(ops.treatmentOptions(req.user, Number(req.params.id))));
  app.post('/api/visits/:id/sessions', guard(), (req, res) => res.status(201).json(ops.startSession(req.user, Number(req.params.id), { serviceId: req.body.service_id, clinicianId: req.body.clinician_id, idemKey: req.body.idem_key })));
  app.post('/api/sessions/:id/pause', guard(), (req, res) => res.json(ops.pauseSession(req.user, Number(req.params.id))));
  app.post('/api/sessions/:id/resume', guard(), (req, res) => res.json(ops.resumeSession(req.user, Number(req.params.id))));
  app.post('/api/sessions/:id/complete', guard(), (req, res) => res.json(ops.completeSession(req.user, Number(req.params.id))));

  // ---- corrections ----
  app.get('/api/corrections', guard('corrections.request'), (req, res) => {
    res.json(q(`SELECT c.*, ur.name requester, ud.name decider, p.mrn, p.name patient_name FROM corrections c JOIN users ur ON ur.id=c.requested_by LEFT JOIN users ud ON ud.id=c.decided_by
      JOIN visits v ON v.id=c.visit_id JOIN patients p ON p.id=v.patient_id ORDER BY c.id DESC LIMIT 100`).filter((c) => ops.visitVisible(req.user, c.visit_id)));
  });
  app.post('/api/corrections', guard(), (req, res) => res.status(201).json(ops.requestCorrection(req.user, { kind: req.body.kind, entityId: Number(req.body.entity_id), correctedTs: req.body.corrected_ts, reason: req.body.reason })));
  app.post('/api/corrections/:id/decision', guard(), (req, res) => res.json(ops.decideCorrection(req.user, Number(req.params.id), !!req.body.approve, req.body.note)));

  // ---- search (always department-scoped) ----
  app.get('/api/search', guard('patients.read'), (req, res) => {
    const f = Object.fromEntries(Object.entries(req.query).map(([k, v]) => [k, String(v)])), s = deptScope(req.user), w = [], a = [];
    if (f.patient) { w.push('(p.name LIKE ? OR p.name_ar LIKE ? OR CAST(p.id AS TEXT)=?)'); a.push(`%${f.patient}%`, `%${f.patient}%`, f.patient); }
    if (f.mrn) { w.push('p.mrn LIKE ?'); a.push(`%${f.mrn}%`); }
    if (f.appointment) { w.push('EXISTS (SELECT 1 FROM appointments x WHERE x.id=v.appointment_id AND x.ref LIKE ?)'); a.push(`%${f.appointment}%`); }
    if (f.department_id) { w.push('(EXISTS (SELECT 1 FROM queue_entries x WHERE x.visit_id=v.id AND x.department_id=?))'); a.push(f.department_id); }
    if (f.service_id) { w.push('EXISTS (SELECT 1 FROM treatment_sessions x WHERE x.visit_id=v.id AND x.service_id=?)'); a.push(f.service_id); }
    if (f.clinician_id) { w.push('EXISTS (SELECT 1 FROM treatment_sessions x WHERE x.visit_id=v.id AND x.clinician_id=?)'); a.push(f.clinician_id); }
    if (f.room_id) { w.push('EXISTS (SELECT 1 FROM occupancy x WHERE x.visit_id=v.id AND x.room_id=?)'); a.push(f.room_id); }
    if (f.session_status) { w.push('EXISTS (SELECT 1 FROM treatment_sessions x WHERE x.visit_id=v.id AND x.status=?)'); a.push(f.session_status); }
    if (f.date) { w.push('substr(v.arrived_at,1,10) BETWEEN date(?,\'-1 day\') AND date(?,\'+1 day\')'); a.push(f.date, f.date); }
    const tz = ops.setting('timezone');
    let rows = q(`SELECT v.id visit_id, v.status, v.arrived_at, v.departed_at, p.id patient_id, p.mrn, p.name patient_name, p.name_ar patient_name_ar
      FROM visits v JOIN patients p ON p.id=v.patient_id ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY v.arrived_at DESC LIMIT 200`, ...a);
    if (f.date) rows = rows.filter((r) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(r.arrived_at)) === f.date);
    rows = rows.filter((r) => s == null || ops.visitVisible(req.user, r.visit_id));
    audit(req.user, 'search', 'visit', null, { filters: Object.keys(f), results: rows.length });
    res.json(rows);
  });

  // ---- reports ----
  function reportData(user, from, to) {
    const tz = ops.setting('timezone');
    const day = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso));
    const inRange = (iso) => iso && (!from || day(iso) >= from) && (!to || day(iso) <= to);
    const s = deptScope(user);
    const visits = q('SELECT * FROM visits').filter((v) => inRange(v.arrived_at) && (s == null || ops.visitVisible(user, v.id)));
    const ids = new Set(visits.map((v) => v.id));
    const waits = visits.map((v) => {
      const e = one("SELECT MIN(ts) t FROM events WHERE visit_id=? AND type='ROOM_ENTERED'", v.id)?.t;
      return e ? (Date.parse(e) - Date.parse(v.arrived_at)) / 60000 : null;
    }).filter((x) => x != null);
    const sessions = q('SELECT ts.*, sv.name service FROM treatment_sessions ts JOIN services sv ON sv.id=ts.service_id').filter((x) => ids.has(x.visit_id));
    const bySvc = {};
    for (const x of sessions) { const m = ops.sumMs(ops.sessionIntervals(x)) / 60000; const b = (bySvc[x.service] ||= { service: x.service, sessions: 0, minutes: 0 }); b.sessions++; b.minutes += m; }
    const occ = q('SELECT o.*, r.code room FROM occupancy o JOIN rooms r ON r.id=o.room_id').filter((o) => ids.has(o.visit_id) && o.entered_at);
    const byRoom = {};
    for (const o of occ) { const end = o.exited_at_corrected || o.exited_at; const m = ((end ? Date.parse(end) : Date.now()) - Date.parse(o.entered_at)) / 60000; const b = (byRoom[o.room] ||= { room: o.room, occupied_minutes: 0, uses: 0 }); b.occupied_minutes += m; b.uses++; }
    const ev = q("SELECT type, visit_id FROM events WHERE type IN ('ROOM_TRANSFERRED')").filter((e) => ids.has(e.visit_id));
    const corr = q('SELECT status, visit_id FROM corrections').filter((c) => ids.has(c.visit_id));
    const maint = q("SELECT * FROM room_status_history WHERE to_status IN ('MAINTENANCE','OUT_OF_SERVICE')").filter((h) => inRange(h.ts));
    const r1 = (n) => Math.round(n * 10) / 10;
    return {
      from, to, timezone: tz,
      visits: visits.length, checked_out: visits.filter((v) => v.status === 'CHECKED_OUT').length,
      avg_wait_minutes: waits.length ? r1(waits.reduce((a, b) => a + b, 0) / waits.length) : null,
      sessions: sessions.length,
      by_service: Object.values(bySvc).map((b) => ({ ...b, minutes: r1(b.minutes), avg_minutes: r1(b.minutes / b.sessions) })),
      by_room: Object.values(byRoom).map((b) => ({ ...b, occupied_minutes: r1(b.occupied_minutes) })),
      transfers: ev.length,
      corrections: { total: corr.length, pending: corr.filter((c) => c.status === 'PENDING').length, approved: corr.filter((c) => c.status === 'APPROVED').length, rejected: corr.filter((c) => c.status === 'REJECTED').length },
      maintenance_events: maint.length,
    };
  }
  app.get('/api/reports', guard('reports.view'), (req, res) => { audit(req.user, 'reports.view', 'report', null, req.query); res.json(reportData(req.user, req.query.from, req.query.to)); });
  app.get('/api/reports/sessions.csv', guard('reports.view'), (req, res) => {
    const tz = ops.setting('timezone'); const day = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso));
    const rows = q(`SELECT ts.id, p.mrn, sv.name service, u.name clinician, ts.status, ts.started_at, COALESCE(ts.ended_at_corrected, ts.ended_at) ended_at, ts.visit_id
      FROM treatment_sessions ts JOIN patients p ON p.id=ts.patient_id JOIN services sv ON sv.id=ts.service_id JOIN users u ON u.id=ts.clinician_id ORDER BY ts.id`)
      .filter((r) => ops.visitVisible(req.user, r.visit_id) && (!req.query.from || day(r.started_at) >= req.query.from) && (!req.query.to || day(r.started_at) <= req.query.to));
    const esc = (v) => { let s = v == null ? '' : String(v); if (/^[=+\-@]/.test(s)) s = `'${s}`; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    audit(req.user, 'reports.export', 'report', null, { rows: rows.length });
    res.type('text/csv').send(['session_id,mrn,service,clinician,status,started_at,ended_at', ...rows.map((r) => [r.id, r.mrn, r.service, r.clinician, r.status, r.started_at, r.ended_at].map(esc).join(','))].join('\n'));
  });
  app.get('/api/audit', guard('audit.view'), (req, res) =>
    res.json(q(`SELECT a.id,a.ts,a.action,a.entity,a.entity_id,a.detail,u.name actor FROM audit_log a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT ?`, Math.min(Number(req.query.limit) || 100, 500))));

  // ---- health (admin only; never returns secrets or patient data) ----
  app.post('/api/client-sync-issue', guard(), (req, res) => {
    run('INSERT INTO system_errors(ts,source,code,message) VALUES (?,?,?,?)', now(), 'client-sync', String(req.body.code || 'UNKNOWN').slice(0, 40), null);
    res.json({ ok: true });
  });
  app.get('/api/health', guard('health.view'), (_req, res) => {
    let dbOk = true; try { one('SELECT 1'); } catch { dbOk = false; }
    const since = new Date(Date.now() - 24 * 3600e3).toISOString();
    const lastBackup = one('SELECT ts,ok,bytes,note FROM backup_log ORDER BY id DESC LIMIT 1');
    let files = 0; try { if (existsSync(backupDir)) files = readdirSync(backupDir).filter((f) => f.endsWith('.enc')).length; } catch { /* ignore */ }
    res.json({
      application: { status: 'up', uptime_s: Math.round(process.uptime()), node: process.version, server_time: now() },
      database: { connected: dbOk },
      failed_operations_24h: one("SELECT COUNT(*) c FROM system_errors WHERE ts>? AND source='server'", since).c,
      sync_problems_24h: one("SELECT COUNT(*) c FROM system_errors WHERE ts>? AND source='client-sync'", since).c,
      recent_errors: q('SELECT ts,source,code,message FROM system_errors ORDER BY id DESC LIMIT 20'),
      backup: { supported: true, encrypted_files: files, last: lastBackup || null, stale: !lastBackup || Date.now() - Date.parse(lastBackup.ts) > 26 * 3600e3 },
    });
  });

  // ---- static SPA ----
  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(staticDir, { index: false, setHeaders: (r) => r.set('Cache-Control', 'no-cache') }));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile('index.html', { root: staticDir }));
  }

  // ---- errors ----
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'NOT_FOUND')));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.extra || {}) } });
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Malformed JSON' } });
    const msg = String(err?.message || err).slice(0, 200);
    try { run('INSERT INTO system_errors(ts,source,code,message) VALUES (?,?,?,?)', now(), 'server', err?.code || 'EXCEPTION', msg); } catch { /* ignore */ }
    if (/UNIQUE constraint/.test(msg)) return res.status(409).json({ error: { code: 'CONFLICT', message: 'Conflicting record (already exists or in use)' } });
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Unexpected server error' } });
  });
  return { app, db, ops };
}
