import express from 'express';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { openDb, tx } from './db.js';
import { makeOps, HttpError, now, nowMs, clock } from './ops.js';
import { makeRegistration } from './registration.js';
import { makeSchedule } from './schedule.js';
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
  services: ['department_id', 'name', 'name_ar', 'default_minutes', 'min_minutes', 'max_minutes', 'allow_override', 'active'],
  cpt_codes: ['code', 'description', 'department_id', 'default_minutes', 'active'],
  appointment_categories: ['name', 'name_ar', 'color', 'default_minutes', 'active', 'sort_order'],
  schedule_groups: ['name', 'name_ar', 'department_id', 'interval_minutes', 'active', 'sort_order'],
  schedule_columns: ['group_id', 'time', 'label', 'active'],
  schedule_rows: ['group_id', 'user_id', 'label', 'label_ar', 'department_id', 'capacity', 'active', 'sort_order'],
};
const SCHEDULE_TABLES = ['appointment_categories', 'schedule_groups', 'schedule_columns', 'schedule_rows'];

function checkCpt(b, creating) {
  if (creating || b.code !== undefined) { const c = String(b.code ?? '').trim(); if (!/^[A-Za-z0-9]{4,10}$/.test(c)) throw new HttpError(400, 'VALIDATION', 'A procedure code is 4–10 letters or digits.', { fields: { code: 'Use 4–10 letters or digits, for example the code exactly as FMC bills it.' } }); b.code = c.toUpperCase(); }
  if (creating || b.default_minutes !== undefined) { const m = Number(b.default_minutes); if (!Number.isInteger(m) || m < 1 || m > 600) throw new HttpError(400, 'VALIDATION', 'Default duration must be whole minutes from 1 to 600.', { fields: { default_minutes: '1–600 whole minutes.' } }); }
}
function checkDurationRange(b) {
  const n = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
  const [d, lo, hi] = [n(b.default_minutes), n(b.min_minutes), n(b.max_minutes)];
  for (const [k, v] of [['Default', d], ['Minimum', lo], ['Maximum', hi]]) if (v !== null && (!Number.isInteger(v) || v < 1 || v > 600)) throw new HttpError(400, 'VALIDATION', `${k} duration must be a whole number of minutes between 1 and 600.`);
  if (lo !== null && hi !== null && lo > hi) throw new HttpError(400, 'VALIDATION', 'The minimum duration cannot be longer than the maximum.');
  if (d !== null && lo !== null && d < lo) throw new HttpError(400, 'VALIDATION', 'The default duration is below the minimum.');
  if (d !== null && hi !== null && d > hi) throw new HttpError(400, 'VALIDATION', 'The default duration is above the maximum.');
}

export function createApp({ db = openDb(), backupDir = new URL('../data/backups/', import.meta.url).pathname, staticDir } = {}) {
  const ops = makeOps(db);
  const { q, one, run, audit, fail } = ops;
  const reg = makeRegistration(db, ops);
  const sched = makeSchedule(db, ops);
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
      if (s && nowMs() - Date.parse(s.last_seen) < maxIdle) {
        const u = one('SELECT id,username,name,name_ar,role,department_id,active,schedule_override FROM users WHERE id=?', s.user_id);
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
  app.use('/api', (_req, res, next) => { res.set('X-Server-Time', now()); next(); }); // every response carries the server clock so clients stay in step
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
      cpt_codes: q('SELECT * FROM cpt_codes ORDER BY code'),
      appointment_categories: q('SELECT * FROM appointment_categories ORDER BY sort_order, name'),
      scope_department: s,
      settings: Object.fromEntries(q('SELECT * FROM settings').map((r) => [r.key, r.value])),
    });
  });
  app.get('/api/staff', guard(), (_req, res) => {
    res.json(q(`SELECT u.id,u.username,u.name,u.name_ar,u.role,u.department_id,u.active,u.schedule_override, COALESCE(a.status,'OFF_DUTY') availability, a.updated_at availability_updated,
      (SELECT group_concat(service_id) FROM staff_services WHERE user_id=u.id) service_ids FROM users u LEFT JOIN staff_availability a ON a.user_id=u.id ORDER BY u.name`)
      .map((r) => ({ ...r, service_ids: r.service_ids ? r.service_ids.split(',').map(Number) : [] })));
  });

  // ---- config CRUD (admin) ----
  for (const [table, cols] of Object.entries(CONFIG)) {
    app.post(`/api/config/${table}`, guard('config.manage'), (req, res) => {
      const vals = cols.filter((c) => req.body[c] !== undefined);
      if (!vals.length) throw new HttpError(400, 'EMPTY');
      if (table === 'services') checkDurationRange(req.body);
      if (table === 'cpt_codes') checkCpt(req.body, true);
      if (SCHEDULE_TABLES.includes(table)) sched.checkConfig(table, req.body, true);
      let r;
      try { r = run(`INSERT INTO ${table}(${vals.join(',')}) VALUES (${vals.map(() => '?').join(',')})`, ...vals.map((c) => req.body[c])); }
      catch (e) { throw new HttpError(400, 'INVALID', String(e.message).replace(/^.*constraint failed: /, '')); }
      audit(req.user, `config.${table}.create`, table, r.lastInsertRowid, req.body);
      res.status(201).json(one(`SELECT * FROM ${table} WHERE id=?`, Number(r.lastInsertRowid)));
    });
    app.patch(`/api/config/${table}/:id`, guard('config.manage'), (req, res) => {
      const vals = cols.filter((c) => req.body[c] !== undefined);
      if (!vals.length) throw new HttpError(400, 'EMPTY');
      if (table === 'cpt_codes') checkCpt(req.body, false);
      if (SCHEDULE_TABLES.includes(table)) sched.checkConfig(table, req.body, false, one(`SELECT * FROM ${table} WHERE id=?`, req.params.id) || {});
      if (table === 'services') { const cur = one('SELECT default_minutes,min_minutes,max_minutes FROM services WHERE id=?', req.params.id) || {}; checkDurationRange({ ...cur, ...req.body }); }
      if (table === 'rooms' && req.body.active === 0 && ops.one('SELECT 1 x FROM occupancy WHERE room_id=? AND exited_at IS NULL', req.params.id)) throw new HttpError(409, 'ROOM_OCCUPIED');
      try { run(`UPDATE ${table} SET ${vals.map((c) => `${c}=?`).join(',')} WHERE id=?`, ...vals.map((c) => req.body[c]), req.params.id); }
      catch (e) { throw new HttpError(400, 'INVALID', String(e.message).replace(/^.*constraint failed: /, '')); }
      audit(req.user, `config.${table}.update`, table, req.params.id, req.body);
      res.json(one(`SELECT * FROM ${table} WHERE id=?`, req.params.id));
    });
  }
  app.patch('/api/config/settings', guard('config.manage'), (req, res) => {
    const numeric = { doc_min_chars: [1, 200], resource_gap_minutes: [0, 60] };
    const flags = ['correction_requires_approval', 'transfer_reason_required', 'registration_require_name_ar', 'registration_require_phone', 'require_service_at_checkin', 'timer_auto_close'];
    const allowed = ['timezone', 'session_idle_hours', 'gender_options', 'diagnosis_pattern', ...Object.keys(numeric), ...flags];
    const body = req.body || {};
    for (const [k, v] of Object.entries(body)) {
      if (!allowed.includes(k)) continue;
      if (flags.includes(k) && !['0', '1'].includes(String(v))) throw new HttpError(400, 'INVALID', `${k} must be 0 or 1`);
      if (numeric[k]) { const n = Number(v); if (!Number.isInteger(n) || n < numeric[k][0] || n > numeric[k][1]) throw new HttpError(400, 'INVALID', `${k} must be a whole number from ${numeric[k][0]} to ${numeric[k][1]}`); }
      if (k === 'diagnosis_pattern') { const pat = String(v ?? ''); if (pat.length > 200) throw new HttpError(400, 'INVALID', 'Diagnosis pattern is limited to 200 characters.'); try { new RegExp(pat); } catch { throw new HttpError(400, 'INVALID', 'Diagnosis pattern is not a valid regular expression.'); } }
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
      for (const c of ['name', 'name_ar', 'role', 'department_id', 'active', 'schedule_override']) if (req.body[c] !== undefined) run(`UPDATE users SET ${c}=? WHERE id=?`, req.body[c], id);
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
  // ---- Daily Schedule ----
  const nid = (v) => Number(v);
  app.get('/api/schedule/board', guard('schedule.view'), (req, res) => res.json(sched.board(req.user, req.query)));
  app.post('/api/schedule/appointments', guard('schedule.manage'), (req, res) => res.status(201).json(sched.createAppointments(req.user, req.body || {})));
  app.patch('/api/schedule/appointments/:id', guard('schedule.manage'), (req, res) => res.json(sched.updateAppointment(req.user, nid(req.params.id), req.body || {})));
  app.post('/api/schedule/appointments/:id/cancel', guard('schedule.manage'), (req, res) => res.json(sched.cancelAppointment(req.user, nid(req.params.id), req.body || {})));
  app.post('/api/schedule/appointments/:id/arrive', guard('visit.manage'), (req, res) => res.json(sched.arrive(req.user, nid(req.params.id))));
  app.get('/api/schedule/appointments/:id/history', guard('schedule.view'), (req, res) => res.json(sched.appointmentHistory(req.user, nid(req.params.id))));
  app.post('/api/schedule/blocks', guard('schedule.block'), (req, res) => res.status(201).json(sched.createBlocks(req.user, req.body || {})));
  app.post('/api/schedule/blocks/:id/remove', guard('schedule.block'), (req, res) => res.json(sched.removeBlock(req.user, nid(req.params.id), !!req.body?.whole_series)));
  app.get('/api/schedule/waiting', guard('schedule.view'), (req, res) => res.json(sched.listWaiting(req.user, req.query)));
  app.post('/api/schedule/waiting', guard('schedule.manage'), (req, res) => res.status(201).json(sched.addWaiting(req.user, req.body || {})));
  app.patch('/api/schedule/waiting/:id', guard('schedule.manage'), (req, res) => res.json(sched.updateWaiting(req.user, nid(req.params.id), req.body || {})));
  app.get('/api/schedule/cancellations', guard('schedule.view'), (req, res) => res.json(sched.listCancellations(req.user, req.query)));
  app.get('/api/schedule/tasks', guard('schedule.view'), (req, res) => res.json(sched.listTasks(req.user, req.query)));
  app.post('/api/schedule/tasks', guard('schedule.manage'), (req, res) => res.status(201).json(sched.addTask(req.user, req.body || {})));
  app.patch('/api/schedule/tasks/:id', guard('schedule.manage'), (req, res) => res.json(sched.updateTask(req.user, nid(req.params.id), req.body || {})));
  app.post('/api/schedule/setup', guard('config.manage'), (req, res) => res.status(201).json(sched.setup(req.user, req.body || {})));
  app.post('/api/schedule/groups/:id/sync-staff', guard('config.manage'), (req, res) => res.json(sched.syncStaff(req.user, nid(req.params.id))));
  app.post('/api/schedule/columns/bulk', guard('config.manage'), (req, res) => res.status(201).json(sched.addColumns(req.user, req.body || {})));
  app.post('/api/schedule/rows/reorder', guard('config.manage'), (req, res) => res.json(sched.reorderRows(req.user, req.body?.ids)));
  app.post('/api/schedule/rows/:id/remove', guard('config.manage'), (req, res) => res.json(sched.removeRow(req.user, nid(req.params.id))));
  app.post('/api/schedule/columns/:id/remove', guard('config.manage'), (req, res) => res.json(sched.removeColumn(req.user, nid(req.params.id))));

  app.get('/api/visits/open', guard('patients.read'), (req, res) => {
    ops.sweepTimers();
    const s = deptScope(req.user);
    const rows = q(`SELECT v.*, p.name patient_name, p.name_ar patient_name_ar, p.mrn FROM visits v JOIN patients p ON p.id=v.patient_id WHERE v.status='OPEN' ORDER BY v.arrived_at`)
      .filter((v) => s == null || ops.visitVisible(req.user, v.id));
    res.json(rows.map((v) => ({
      ...v,
      queue: one("SELECT display,status,department_id FROM queue_entries WHERE visit_id=? AND status IN ('WAITING','CALLED','IN_ROOM') ORDER BY id DESC LIMIT 1", v.id) || null,
      occupancy: one(`SELECT o.id,o.room_id,o.station_id,o.entered_at,r.code room_code,st.code station_code FROM occupancy o JOIN rooms r ON r.id=o.room_id LEFT JOIN stations st ON st.id=o.station_id WHERE o.visit_id=? AND o.exited_at IS NULL`, v.id) || null,
      open_sessions: q("SELECT id,status,service_id FROM treatment_sessions WHERE visit_id=? AND status IN ('ACTIVE','PAUSED')", v.id),
      timing: ops.visitTiming(v),
      schedule_status: ops.visitScheduleStatus(v.id),
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
  app.post('/api/visits/:id/sessions', guard(), (req, res) => res.status(201).json(ops.startSession(req.user, Number(req.params.id), { serviceId: req.body.service_id, clinicianId: req.body.clinician_id, idemKey: req.body.idem_key, plannedMinutes: req.body.planned_minutes, cptCodeId: req.body.cpt_code_id })));
  app.get('/api/sessions/:id/documentation', guard('patients.read'), (req, res) => res.json(ops.getDocumentation(req.user, Number(req.params.id))));
  app.put('/api/sessions/:id/documentation', guard('session.run'), (req, res) => res.json(ops.saveDocumentation(req.user, Number(req.params.id), req.body || {})));
  app.get('/api/schedule', guard('patients.read'), (req, res) => res.json({ server_time: now(), sessions: ops.scheduleList(req.user, req.query) }));
  app.post('/api/sessions/:id/pause', guard(), (req, res) => res.json(ops.pauseSession(req.user, Number(req.params.id))));
  app.post('/api/sessions/:id/resume', guard(), (req, res) => res.json(ops.resumeSession(req.user, Number(req.params.id))));
  app.post('/api/sessions/:id/complete', guard(), (req, res) => res.json(ops.completeSession(req.user, Number(req.params.id), { mode: req.body.mode })));

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
  /** Visits and sessions matching the filters, limited to what the user may see. Timestamps are stored server times. */
  function reportScope(user, f = {}) {
    const tz = ops.setting('timezone');
    const day = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso));
    const inRange = (iso) => iso && (!f.from || day(iso) >= f.from) && (!f.to || day(iso) <= f.to);
    const sc = deptScope(user); const num = (x) => (x === undefined || x === '' ? null : Number(x));
    const [dep, svc, cli, room] = [num(f.department_id), num(f.service_id), num(f.clinician_id), num(f.room_id)];
    const term = String(f.patient || '').trim().toLowerCase();
    const visits = q('SELECT v.*, p.mrn, p.name patient_name FROM visits v JOIN patients p ON p.id=v.patient_id ORDER BY v.arrived_at DESC').filter((v) => {
      if (!inRange(v.arrived_at) || (sc != null && !ops.visitVisible(user, v.id))) return false;
      if (term && !`${v.patient_name} ${v.mrn}`.toLowerCase().includes(term)) return false;
      if (dep != null && !one('SELECT 1 x FROM queue_entries WHERE visit_id=? AND department_id=? UNION SELECT 1 FROM treatment_sessions ts JOIN services sv ON sv.id=ts.service_id WHERE ts.visit_id=? AND sv.department_id=?', v.id, dep, v.id, dep)) return false;
      if (svc != null && !one('SELECT 1 x FROM treatment_sessions WHERE visit_id=? AND service_id=?', v.id, svc)) return false;
      if (cli != null && !one('SELECT 1 x FROM treatment_sessions WHERE visit_id=? AND clinician_id=?', v.id, cli)) return false;
      if (room != null && !one('SELECT 1 x FROM occupancy WHERE visit_id=? AND room_id=?', v.id, room)) return false;
      return true;
    });
    const ids = new Set(visits.map((v) => v.id));
    const sessions = q('SELECT ts.*, sv.name service, sv.department_id, u.name clinician, r.code room FROM treatment_sessions ts JOIN services sv ON sv.id=ts.service_id JOIN users u ON u.id=ts.clinician_id LEFT JOIN rooms r ON r.id=ts.room_id')
      .filter((x) => ids.has(x.visit_id) && (svc == null || x.service_id === svc) && (cli == null || x.clinician_id === cli) && (room == null || x.room_id === room) && (dep == null || x.department_id === dep));
    return { tz, visits, ids, sessions, inRange, room, dep };
  }
  function reportData(user, f = {}) {
    ops.sweepTimers();
    const { tz, visits, ids, sessions, inRange, room } = reportScope(user, f);
    const r1 = (n) => Math.round(n * 10) / 10; const min = (ms) => ms / 60000;
    const avg = (a) => (a.length ? r1(a.reduce((x, y) => x + y, 0) / a.length) : null);
    const timings = visits.map((v) => ({ v, t: ops.visitTiming(v) }));
    const before = timings.filter((x) => x.t.room_entry_at).map((x) => min(Date.parse(x.t.room_entry_at) - Date.parse(x.t.arrival_at)));
    const inRoom = timings.filter((x) => x.t.room_entry_at && x.t.treatment_start_at).map((x) => min(Date.parse(x.t.treatment_start_at) - Date.parse(x.t.room_entry_at)));
    const total = timings.filter((x) => x.t.treatment_start_at).map((x) => min(Date.parse(x.t.treatment_start_at) - Date.parse(x.t.arrival_at)));
    const visitLen = timings.filter((x) => x.t.total_visit_ms != null).map((x) => min(x.t.total_visit_ms));
    const done = sessions.filter((x) => x.status === 'COMPLETED').map((x) => ({ x, active: min(ops.sumMs(ops.sessionIntervals(x))) }));
    const planned = sessions.filter((x) => x.planned_minutes).map((x) => x.planned_minutes);
    const kind = (k) => done.filter((d) => d.x.completion_kind === k);
    const bySvc = {};
    for (const x of sessions) { const m = min(ops.sumMs(ops.sessionIntervals(x))); const b = (bySvc[x.service] ||= { service: x.service, sessions: 0, minutes: 0, planned_minutes: 0 }); b.sessions++; b.minutes += m; b.planned_minutes += x.planned_minutes || 0; }
    const occ = q('SELECT o.*, r.code room FROM occupancy o JOIN rooms r ON r.id=o.room_id').filter((o) => ids.has(o.visit_id) && o.entered_at && (room == null || o.room_id === room));
    const byRoom = {}; const occMins = [];
    for (const o of occ) { const end = o.exited_at_corrected || o.exited_at; const m = min((end ? Date.parse(end) : nowMs()) - Date.parse(o.entered_at)); occMins.push(m); const b = (byRoom[o.room] ||= { room: o.room, occupied_minutes: 0, uses: 0 }); b.occupied_minutes += m; b.uses++; }
    const ev = q("SELECT type, visit_id FROM events WHERE type IN ('ROOM_TRANSFERRED')").filter((e) => ids.has(e.visit_id));
    const corr = q('SELECT status, visit_id FROM corrections').filter((c) => ids.has(c.visit_id));
    const maint = q("SELECT * FROM room_status_history WHERE to_status IN ('MAINTENANCE','OUT_OF_SERVICE')").filter((h) => inRange(h.ts));
    return {
      from: f.from, to: f.to, timezone: tz, filters: Object.fromEntries(Object.entries(f).filter(([, v]) => v)),
      visits: visits.length, checked_out: visits.filter((v) => v.status === 'CHECKED_OUT').length,
      avg_wait_minutes: avg(before),
      waiting: { before_room_avg_min: avg(before), in_room_avg_min: avg(inRoom), total_avg_min: avg(total), visit_total_avg_min: avg(visitLen), samples: { before: before.length, in_room: inRoom.length, total: total.length, visit: visitLen.length } },
      treatment: {
        planned_avg_min: avg(planned), actual_confirmed_avg_min: avg(done.filter((d) => d.x.completion_kind !== 'AUTO').map((d) => d.active)),
        full: kind('FULL').length, overruns: kind('OVERRUN').length, early: kind('EARLY').length, auto_closed_unverified: kind('AUTO').length, running_or_paused: sessions.filter((x) => x.status !== 'COMPLETED').length,
        overrun_avg_min: avg(kind('OVERRUN').map((d) => Math.max(0, d.active - d.x.planned_minutes))), early_avg_min: avg(kind('EARLY').map((d) => Math.max(0, d.x.planned_minutes - d.active))),
      },
      room_occupancy_avg_min: avg(occMins),
      sessions: sessions.length,
      by_service: Object.values(bySvc).map((b) => ({ ...b, minutes: r1(b.minutes), avg_minutes: r1(b.minutes / b.sessions), planned_avg_minutes: b.planned_minutes ? r1(b.planned_minutes / b.sessions) : null })),
      by_room: Object.values(byRoom).map((b) => ({ ...b, occupied_minutes: r1(b.occupied_minutes) })),
      visit_rows: timings.slice(0, 200).map(({ v, t }) => ({ visit_id: v.id, mrn: v.mrn, patient: v.patient_name, status: v.status, arrival_at: t.arrival_at, room_entry_at: t.room_entry_at, treatment_start_at: t.treatment_start_at, last_treatment_end_at: t.last_treatment_end_at, room_exit_at: t.room_exit_at, departed_at: t.departed_at,
        waiting_before_room_min: t.room_entry_at ? r1(min(Date.parse(t.room_entry_at) - Date.parse(t.arrival_at))) : null, waiting_in_room_min: t.room_entry_at && t.treatment_start_at ? r1(min(Date.parse(t.treatment_start_at) - Date.parse(t.room_entry_at))) : null,
        total_waiting_min: t.treatment_start_at ? r1(min(Date.parse(t.treatment_start_at) - Date.parse(t.arrival_at))) : null, total_visit_min: t.total_visit_ms != null ? r1(min(t.total_visit_ms)) : null })),
      transfers: ev.length,
      corrections: { total: corr.length, pending: corr.filter((c) => c.status === 'PENDING').length, approved: corr.filter((c) => c.status === 'APPROVED').length, rejected: corr.filter((c) => c.status === 'REJECTED').length },
      maintenance_events: maint.length,
    };
  }
  app.get('/api/reports', guard('reports.view'), (req, res) => { audit(req.user, 'reports.view', 'report', null, req.query); res.json(reportData(req.user, req.query)); });
  app.get('/api/reports/sessions.csv', guard('reports.view'), (req, res) => {
    ops.sweepTimers();
    const { sessions, visits } = reportScope(req.user, req.query);
    const tv = new Map(visits.map((v) => [v.id, { v, t: ops.visitTiming(v) }]));
    const min = (a, b) => (a && b ? Math.round(((Date.parse(b) - Date.parse(a)) / 60000) * 10) / 10 : '');
    const esc = (v) => { let s = v == null ? '' : String(v); if (/^[=+\-@]/.test(s)) s = `'${s}`; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    audit(req.user, 'reports.export', 'report', null, { rows: sessions.length, filters: Object.keys(req.query) });
    const head = 'session_id,mrn,service,clinician,room,status,planned_minutes,started_at,scheduled_end_at,timer_elapsed_at,clinical_end_at,confirmed_at,completion_kind,active_minutes,arrival_at,room_entry_at,waiting_before_room_min,waiting_in_room_min,total_waiting_min';
    const lines = sessions.map((x) => { const { v, t } = tv.get(x.visit_id); const end = x.ended_at_corrected || x.ended_at;
      return [x.id, v.mrn, x.service, x.clinician, x.room, x.status, x.planned_minutes, x.started_at, x.scheduled_end_at, x.timer_elapsed_at, end, x.confirmed_at, x.completion_kind, Math.round((ops.sumMs(ops.sessionIntervals(x)) / 60000) * 10) / 10, t.arrival_at, t.room_entry_at, min(t.arrival_at, t.room_entry_at), min(t.room_entry_at, x.started_at), min(t.arrival_at, x.started_at)].map(esc).join(','); });
    res.type('text/csv').send([head, ...lines].join('\n'));
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

  // ---- test clock: exists ONLY when FMC_TEST_CLOCK=1 (automated tests); never enable in production ----
  if (process.env.FMC_TEST_CLOCK === '1') {
    app.post('/api/__test/advance-clock', guard('config.manage'), (req, res) => { clock.advance(Math.max(0, Number(req.body.minutes) || 0) * 60000); ops.sweepTimers(); res.json({ server_time: now() }); });
  }

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
