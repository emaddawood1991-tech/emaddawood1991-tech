// Daily Schedule: timetable groups/rows/columns, appointments with conflict checks, breaks, waiting list, cancellations and call lists.
// Reuses the existing patients, appointments, users and audit log. It never starts treatment timers and never changes check-in logic.
import { tx } from './db.js';
import { HttpError } from './ops.js';
import { can, deptScope } from './perms.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const MAX_OCCURRENCES = 52;
export const TASK_KINDS = ['FOLLOW_UP', 'APPROVAL', 'REJECTION', 'FOR_DOCTOR', 'EVALUATION'];
export const BLOCK_KINDS = ['BREAK', 'LEAVE', 'MEETING', 'MAINTENANCE', 'OTHER'];
const bad = (fields, message = 'Please correct the highlighted fields.') => { throw new HttpError(400, 'VALIDATION', message, { fields }); };

// ---------- time zone helpers (clinic time zone, Asia/Dubai by default) ----------
const fmtCache = new Map();
const dtf = (tz) => { if (!fmtCache.has(tz)) fmtCache.set(tz, new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })); return fmtCache.get(tz); };
const parts = (ms, tz) => Object.fromEntries(dtf(tz).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
/** 'YYYY-MM-DD' + 'HH:MM' in the clinic time zone → UTC ISO string. */
export function zonedToIso(date, time, tz) {
  const [y, m, d] = date.split('-').map(Number); const [hh, mm] = time.split(':').map(Number);
  const want = Date.UTC(y, m - 1, d, hh, mm); let guess = want;
  for (let i = 0; i < 2; i++) { const p = parts(guess, tz); guess -= Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - want; }
  return new Date(guess).toISOString();
}
export const localOf = (iso, tz) => { const p = parts(Date.parse(iso), tz); return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour % 24 === 0 ? '00' : p.hour}:${p.minute}` }; };
const addDays = (date, n) => { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const plusMin = (iso, min) => new Date(Date.parse(iso) + min * 60000).toISOString();

/** Insert default groups/columns/rows from existing active staff for departments that have no group yet. Never deletes anything. */
export function setupDefaults(db, { start = '09:00', end = '17:00', interval = 30, departmentId = null } = {}) {
  if (!TIME_RE.test(start) || !TIME_RE.test(end) || start >= end) throw new HttpError(400, 'VALIDATION', 'Choose a start time earlier than the end time.', { fields: { start: 'Use HH:MM, earlier than the end time.' } });
  if (!Number.isInteger(interval) || interval < 5 || interval > 240) throw new HttpError(400, 'VALIDATION', 'Interval must be 5–240 minutes.', { fields: { interval: '5–240 minutes.' } });
  const get = (sql, ...a) => db.prepare(sql).get(...a); const all = (sql, ...a) => db.prepare(sql).all(...a); const run = (sql, ...a) => db.prepare(sql).run(...a);
  const created = [];
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  for (const d of all('SELECT * FROM departments WHERE active=1 ORDER BY name')) {
    if (departmentId && d.id !== Number(departmentId)) continue;
    if (get('SELECT 1 x FROM schedule_groups WHERE department_id=?', d.id)) continue;
    const gid = Number(run('INSERT INTO schedule_groups(name,name_ar,department_id,interval_minutes,sort_order) VALUES (?,?,?,?,?)', d.name, d.name_ar || '', d.id, interval, d.id).lastInsertRowid);
    for (let m = toMin(start); m < toMin(end); m += interval) run('INSERT INTO schedule_columns(group_id,time) VALUES (?,?)', gid, hhmm(m));
    for (const u of all("SELECT id FROM users WHERE active=1 AND role='clinician' AND department_id=? ORDER BY name", d.id)) run('INSERT INTO schedule_rows(group_id,user_id,department_id,sort_order) VALUES (?,?,?,?)', gid, u.id, d.id, u.id);
    created.push({ group_id: gid, department_id: d.id });
  }
  return created;
}

const DEFAULT_CATEGORIES = [['Basic', 'أساسي', '#8fe38f'], ['Thiqa', 'ثقة', '#c7b8f0'], ['Cash', 'نقدي', '#ffc46b'], ['Home Care', 'رعاية منزلية', '#b6cfb0'], ['Fixed Appointment', 'موعد ثابت', '#f3a6b6'], ['Free Session', 'جلسة مجانية', '#7fe0f0'], ['POD', 'POD', '#ffe27a'], ['Evaluation', 'تقييم', '#c9d6e8']];
/** Operational categories (editable in Settings). Durations are deliberately left empty: the administrator configures them. */
export function ensureCategories(db) {
  if (db.prepare('SELECT 1 x FROM appointment_categories').get()) return;
  const ins = db.prepare('INSERT OR IGNORE INTO appointment_categories(name,name_ar,color,sort_order) VALUES (?,?,?,?)');
  DEFAULT_CATEGORIES.forEach(([n, ar, c], i) => ins.run(n, ar, c, i));
}

export function makeSchedule(db, ops) {
  const { q, one, run, setting, audit, need, now } = ops;
  const tz = () => setting('timezone') || 'Asia/Dubai';
  const today = () => localOf(now(), tz()).date;
  const scope = (user) => deptScope(user);
  const deptOk = (user, depId) => { const s = scope(user); return s == null || depId == null || depId === s; };
  const canOverride = (user) => user.role === 'admin' || (user.role === 'supervisor' && Number(user.schedule_override) === 1);
  const needDept = (user, depId) => { if (!deptOk(user, depId)) throw new HttpError(403, 'OUT_OF_SCOPE', 'That department is outside your access.'); };
  const history = (apptId, user, action, detail = {}) => run('INSERT INTO appointment_history(appointment_id,ts,actor_id,action,detail) VALUES (?,?,?,?,?)', apptId, now(), user?.id ?? null, action, JSON.stringify(detail));
  const validDate = (v, field = 'date') => { if (!DATE_RE.test(String(v || '')) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) bad({ [field]: 'Choose a valid date.' }); return v; };
  const validTime = (v, field = 'time') => { if (!TIME_RE.test(String(v || ''))) bad({ [field]: 'Use a time like 09:30.' }); return v; };

  // ---------- configuration validation (used by the generic admin CRUD in app.js) ----------
  function checkConfig(table, body, creating, cur = {}) {
    const m = { ...cur, ...body }; const f = {};
    if (table === 'appointment_categories') {
      if (!String(m.name || '').trim()) f.name = 'Name is required.';
      if (!COLOR_RE.test(String(m.color || ''))) f.color = 'Choose a colour (#RRGGBB).';
      if (m.default_minutes != null && m.default_minutes !== '' && (!Number.isInteger(Number(m.default_minutes)) || Number(m.default_minutes) < 5 || Number(m.default_minutes) > 480)) f.default_minutes = '5–480 whole minutes, or leave empty.';
      if (body.default_minutes === '') body.default_minutes = null;
    } else if (table === 'schedule_groups') {
      if (!String(m.name || '').trim()) f.name = 'Name is required.';
      if (m.interval_minutes != null && (!Number.isInteger(Number(m.interval_minutes)) || Number(m.interval_minutes) < 5 || Number(m.interval_minutes) > 240)) f.interval_minutes = '5–240 minutes.';
      if (body.department_id === '') body.department_id = null;
    } else if (table === 'schedule_columns') {
      if (!one('SELECT 1 x FROM schedule_groups WHERE id=?', m.group_id)) f.group_id = 'Choose a schedule group.';
      if (!TIME_RE.test(String(m.time || ''))) f.time = 'Use a time like 09:30.';
      if (String(m.label || '').length > 24) f.label = 'At most 24 characters.';
    } else if (table === 'schedule_rows') {
      if (!one('SELECT 1 x FROM schedule_groups WHERE id=?', m.group_id)) f.group_id = 'Choose a schedule group.';
      if (body.user_id === '') body.user_id = null;
      if (m.user_id != null && !one('SELECT 1 x FROM users WHERE id=? AND active=1', m.user_id)) f.user_id = 'Choose an active staff member.';
      if (m.user_id == null && !String(m.label || '').trim()) f.label = 'Give the row a name, or choose a staff member.';
      if (!Number.isInteger(Number(m.capacity ?? 1)) || Number(m.capacity ?? 1) < 1 || Number(m.capacity ?? 1) > 50) f.capacity = '1–50.';
    }
    if (Object.keys(f).length) bad(f);
  }

  // ---------- conflicts ----------
  function rowOf(id) { return id ? one('SELECT * FROM schedule_rows WHERE id=?', id) : null; }
  /** Overlapping bookings are blocked for the same patient, clinician or exclusive row; a row with capacity > 1 (shared hall) allows that many at once. */
  function conflictsFor({ patientId, clinicianId, row, start, end, excludeId = 0 }) {
    const out = [];
    const lo = new Date(Date.parse(start) - 864e5).toISOString(); const hi = new Date(Date.parse(end) + 864e5).toISOString();
    const near = q(`SELECT a.id,a.ref,a.patient_id,a.clinician_id,a.row_id,a.scheduled_at,a.ends_at,a.duration_minutes FROM appointments a WHERE a.status IN ('SCHEDULED','ARRIVED') AND a.id<>? AND a.scheduled_at>=? AND a.scheduled_at<=?`, excludeId, lo, hi);
    const span = (a) => { const s = Date.parse(a.scheduled_at); return [s, a.ends_at ? Date.parse(a.ends_at) : s + (a.duration_minutes || 30) * 60000]; };
    const S = Date.parse(start); const E = Date.parse(end);
    const over = near.filter((a) => { const [s, e] = span(a); return s < E && e > S; });
    const samePatient = over.find((a) => a.patient_id === patientId);
    if (samePatient) out.push({ type: 'PATIENT', ref: samePatient.ref, message: `This patient already has appointment ${samePatient.ref} at that time.` });
    const cap = row ? Number(row.capacity) || 1 : 1;
    const sharing = over.filter((a) => (clinicianId && a.clinician_id === clinicianId) || (row && a.row_id === row.id));
    if (sharing.length >= cap) out.push({ type: cap > 1 ? 'CAPACITY' : 'CLINICIAN', ref: sharing[0].ref, message: cap > 1 ? `This row is full at that time (${cap} at once).` : `The clinician/resource is already booked at that time (${sharing[0].ref}).` });
    const blocks = q(`SELECT * FROM schedule_blocks WHERE active=1 AND start_at<? AND end_at>?`, end, start)
      .filter((b) => (b.row_id && row && b.row_id === row.id) || (b.user_id && clinicianId && b.user_id === clinicianId) || (!b.row_id && !b.user_id && row && b.group_id === row.group_id));
    for (const b of blocks) out.push({ type: 'BLOCK', block_id: b.id, kind: b.kind, message: `Blocked period (${b.kind.toLowerCase()})${b.note ? `: ${b.note}` : ''}.` });
    return out;
  }

  // ---------- board ----------
  const apptSelect = `SELECT a.*, p.mrn, p.name patient_name, p.name_ar patient_name_ar, p.phone, sv.name service, sv.name_ar service_ar, u.name clinician, u.name_ar clinician_ar,
    c.name category, c.name_ar category_ar, c.color category_color, d.name department FROM appointments a JOIN patients p ON p.id=a.patient_id
    LEFT JOIN services sv ON sv.id=a.service_id LEFT JOIN users u ON u.id=a.clinician_id LEFT JOIN appointment_categories c ON c.id=a.category_id JOIN departments d ON d.id=a.department_id`;
  function decorate(a) {
    const z = tz(); const end = a.ends_at || plusMin(a.scheduled_at, a.duration_minutes || Number(setting('schedule_default_minutes')) || 30);
    return { ...a, ends_at: end, duration_minutes: a.duration_minutes || Math.round((Date.parse(end) - Date.parse(a.scheduled_at)) / 60000), start_local: localOf(a.scheduled_at, z).time, end_local: localOf(end, z).time, date: localOf(a.scheduled_at, z).date };
  }
  function board(user, f = {}) {
    need(user, 'schedule.view');
    const date = f.date ? validDate(f.date) : today(); const z = tz();
    const lo = zonedToIso(date, '00:00', z); const hi = zonedToIso(addDays(date, 1), '00:00', z);
    const inc = f.include_hidden === '1' && can(user, 'config.manage');
    const depF = f.department_id ? Number(f.department_id) : null; const cliF = f.clinician_id ? Number(f.clinician_id) : null; const catF = f.category_id ? Number(f.category_id) : null;
    const groups = q('SELECT * FROM schedule_groups WHERE (?=1 OR active=1) ORDER BY sort_order,id', inc ? 1 : 0).filter((g) => deptOk(user, g.department_id) && (!depF || g.department_id == null || g.department_id === depF));
    const sc = scope(user);
    let appts = q(`${apptSelect} WHERE a.scheduled_at>=? AND a.scheduled_at<? AND a.status<>'CANCELLED' AND (? IS NULL OR a.department_id=?) AND (? IS NULL OR a.category_id=?) ORDER BY a.scheduled_at`, lo, hi, sc, sc, catF, catF).map(decorate);
    const blocks = q('SELECT * FROM schedule_blocks WHERE active=1 AND start_at<? AND end_at>?', hi, lo).map((b) => ({ ...b, start_local: localOf(b.start_at, z).time, end_local: localOf(b.end_at, z).time }));
    const placed = new Set(); const rowByUser = new Map();
    const out = groups.map((g) => {
      const columns = q('SELECT * FROM schedule_columns WHERE group_id=? AND (?=1 OR active=1) ORDER BY time', g.id, inc ? 1 : 0);
      let rows = q(`SELECT r.*, u.name staff_name, u.name_ar staff_name_ar FROM schedule_rows r LEFT JOIN users u ON u.id=r.user_id WHERE r.group_id=? AND (?=1 OR (r.active=1 AND (r.user_id IS NULL OR u.active=1))) ORDER BY r.sort_order, r.id`, g.id, inc ? 1 : 0);
      if (cliF) rows = rows.filter((r) => r.user_id === cliF);
      rows = rows.map((r) => {
        if (r.user_id && !rowByUser.has(r.user_id)) rowByUser.set(r.user_id, r.id);
        return r;
      });
      return { ...g, columns, rows };
    });
    for (const g of out) for (const r of g.rows) {
      const mine = appts.filter((a) => (a.row_id ? a.row_id === r.id : r.user_id && a.clinician_id === r.user_id && rowByUser.get(r.user_id) === r.id));
      mine.forEach((a) => placed.add(a.id));
      r.appointments = mine;
      r.blocks = blocks.filter((b) => (b.row_id === r.id) || (b.user_id && b.user_id === r.user_id) || (!b.row_id && !b.user_id && b.group_id === g.id));
    }
    const unplaced = appts.filter((a) => !placed.has(a.id) && (!cliF || a.clinician_id === cliF));
    return { server_time: now(), timezone: z, date, categories: q('SELECT * FROM appointment_categories ORDER BY sort_order,name'), groups: out, unplaced,
      me: { can_manage: can(user, 'schedule.manage'), can_block: can(user, 'schedule.block'), can_override: canOverride(user), can_configure: can(user, 'config.manage'), role: user.role },
      default_minutes: Number(setting('schedule_default_minutes')) || 30 };
  }

  // ---------- appointments ----------
  function occurrenceDates(date, rec) {
    if (!rec || !rec.freq || rec.freq === 'none') return [date];
    const step = rec.freq === 'daily' ? 1 : rec.freq === 'weekly' ? 7 : null;
    if (!step) bad({ recurrence: 'Choose daily or weekly.' });
    const count = rec.count != null && rec.count !== '' ? Number(rec.count) : null; const until = rec.until || null;
    if (!count && !until) bad({ recurrence: 'Give an end date or a number of occurrences.' });
    if (count != null && (!Number.isInteger(count) || count < 1)) bad({ recurrence: 'The number of occurrences must be a whole number of at least 1.' });
    if (until) validDate(until, 'recurrence');
    if (count != null && count > MAX_OCCURRENCES) bad({ recurrence: `At most ${MAX_OCCURRENCES} occurrences.` });
    const out = [];
    for (let d = date; out.length < MAX_OCCURRENCES + 1; d = addDays(d, step)) {
      if (until && d > until) break; if (count != null && out.length >= count) break; out.push(d);
    }
    if (out.length > MAX_OCCURRENCES) bad({ recurrence: `At most ${MAX_OCCURRENCES} occurrences. Shorten the end date.` });
    return out;
  }
  function resolve(user, b, cur = null) {
    const patientId = Number(b.patient_id ?? cur?.patient_id);
    const patient = one('SELECT id,mrn,name FROM patients WHERE id=?', patientId) || bad({ patient_id: 'Choose a patient (search by MRN, name or phone).' });
    const row = rowOf(b.row_id ?? cur?.row_id ?? null);
    const departmentId = Number(b.department_id ?? cur?.department_id ?? row?.department_id ?? 0);
    const dep = one('SELECT id,active FROM departments WHERE id=?', departmentId); if (!dep) bad({ department_id: 'Choose a department.' });
    needDept(user, dep.id);
    const clinicianId = (b.clinician_id ?? cur?.clinician_id ?? row?.user_id ?? null) || null;
    if (clinicianId && !one('SELECT 1 x FROM users WHERE id=? AND active=1', clinicianId)) bad({ clinician_id: 'Choose an active clinician.' });
    const serviceId = (b.service_id ?? cur?.service_id ?? null) || null;
    const svc = serviceId ? one('SELECT * FROM services WHERE id=?', serviceId) : null;
    if (serviceId && (!svc || svc.department_id !== dep.id)) bad({ service_id: 'That service does not belong to the chosen department.' });
    const categoryId = (b.category_id ?? cur?.category_id ?? null) || null;
    const cat = categoryId ? one('SELECT * FROM appointment_categories WHERE id=? AND active=1', categoryId) : null;
    if (categoryId && !cat) bad({ category_id: 'Choose an active appointment category.' });
    let dur = b.duration_minutes ?? cur?.duration_minutes ?? null;
    if (dur == null || dur === '') dur = cat?.default_minutes ?? svc?.default_minutes ?? (Number(setting('schedule_default_minutes')) || 30);
    dur = Number(dur);
    if (!Number.isInteger(dur) || dur < 5 || dur > 480) bad({ duration_minutes: 'Duration must be 5–480 whole minutes.' });
    return { patient, row, dep, clinicianId, serviceId, categoryId, duration: dur, notes: String(b.notes ?? cur?.notes ?? '').trim().slice(0, 1000) };
  }
  function overrideCheck(user, conflicts, override) {
    if (!conflicts.length) return null;
    const hard = conflicts.filter((c) => c.type !== 'BLOCK');
    if (hard.length) throw new HttpError(409, 'CONFLICT', hard[0].message, { conflicts, overridable: false });
    if (!canOverride(user)) throw new HttpError(409, 'CONFLICT', `${conflicts[0].message} Only an administrator or an authorized supervisor can book into a blocked period.`, { conflicts, overridable: false });
    const reason = String(override?.reason || '').trim();
    if (!reason) throw new HttpError(409, 'CONFLICT', `${conflicts[0].message} Enter a reason to override it.`, { conflicts, overridable: true });
    return reason;
  }
  const refFor = () => `APT-${String(one('SELECT COALESCE(MAX(id),0)+1 n FROM appointments').n).padStart(6, '0')}`;

  function createAppointments(user, b = {}) {
    need(user, 'schedule.manage');
    return tx(db, () => {
      const date = validDate(b.date); const time = validTime(b.time);
      const r = resolve(user, b);
      const dates = occurrenceDates(date, b.recurrence);
      const z = tz(); const made = []; const skipped = []; const failures = [];
      for (const d of dates) {
        const start = zonedToIso(d, time, z); const end = plusMin(start, r.duration);
        const conflicts = conflictsFor({ patientId: r.patient.id, clinicianId: r.clinicianId, row: r.row, start, end });
        let overrideReason = null;
        if (conflicts.length) {
          try { overrideReason = overrideCheck(user, conflicts, b.override); }
          catch (e) { if (b.skip_conflicts && e instanceof HttpError) { skipped.push({ date: d, reason: e.message }); continue; } failures.push({ date: d, message: e.message, conflicts: e.extra?.conflicts, overridable: e.extra?.overridable }); continue; }
        }
        made.push({ d, start, end, overrideReason });
      }
      if (failures.length) { const f0 = failures[0]; throw new HttpError(409, 'CONFLICT', dates.length > 1 ? `${f0.message} (${f0.date}${failures.length > 1 ? ` and ${failures.length - 1} more date(s)` : ''}). Nothing was booked.` : f0.message, { conflicts: f0.conflicts, overridable: !!f0.overridable, dates: failures.map((x) => x.date) }); }
      if (!made.length) throw new HttpError(409, 'CONFLICT', 'Every requested date conflicts with an existing booking. Nothing was booked.', { dates: skipped.map((x) => x.date) });
      const ids = [];
      for (const m of made) {
        const rs = run(`INSERT INTO appointments(ref,patient_id,department_id,service_id,clinician_id,scheduled_at,created_at,duration_minutes,ends_at,category_id,notes,row_id,created_by,rebooks_id)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, refFor(), r.patient.id, r.dep.id, r.serviceId, r.clinicianId, m.start, now(), r.duration, m.end, r.categoryId, r.notes, r.row?.id ?? null, user.id, b.rebooks_id ? Number(b.rebooks_id) : null);
        const id = Number(rs.lastInsertRowid); ids.push(id);
        history(id, user, 'CREATED', { date: m.d, time, duration_minutes: r.duration, category_id: r.categoryId, row_id: r.row?.id ?? null, ...(m.overrideReason ? { override_reason: m.overrideReason } : {}), ...(b.copy_of ? { copy_of: b.copy_of } : {}) });
        if (m.overrideReason) audit(user, 'schedule.block_override', 'appointment', id, { reason: m.overrideReason });
      }
      if (ids.length > 1) run(`UPDATE appointments SET recurrence_id=? WHERE id IN (${ids.join(',')})`, `R${ids[0]}`);
      if (b.waiting_id) run("UPDATE waiting_list SET status='BOOKED', appointment_id=?, updated_at=? WHERE id=? AND status='WAITING'", ids[0], now(), Number(b.waiting_id));
      audit(user, 'schedule.appointment.create', 'appointment', ids[0], { count: ids.length, patient: r.patient.id, recurring: ids.length > 1, skipped: skipped.length });
      return { appointments: ids.map((id) => decorate(one(`${apptSelect} WHERE a.id=?`, id))), skipped };
    });
  }
  const getAppt = (user, id) => {
    const a = one(`${apptSelect} WHERE a.id=?`, id) || (() => { throw new HttpError(404, 'NOT_FOUND', 'Appointment not found.'); })();
    needDept(user, a.department_id); return a;
  };
  function updateAppointment(user, id, b = {}) {
    need(user, 'schedule.manage');
    return tx(db, () => {
      const cur = getAppt(user, id);
      if (cur.status !== 'SCHEDULED') throw new HttpError(409, 'NOT_EDITABLE', `A ${cur.status.toLowerCase()} appointment cannot be changed.`);
      const z = tz(); const was = localOf(cur.scheduled_at, z);
      const date = b.date !== undefined ? validDate(b.date) : was.date; const time = b.time !== undefined ? validTime(b.time) : was.time;
      const r = resolve(user, { ...b, patient_id: cur.patient_id }, cur);
      const start = zonedToIso(date, time, z); const end = plusMin(start, r.duration);
      const moved = start !== cur.scheduled_at || (b.row_id !== undefined && (b.row_id || null) !== (cur.row_id || null)) || (b.clinician_id !== undefined && (b.clinician_id || null) !== (cur.clinician_id || null));
      const lenChanged = end !== (cur.ends_at || plusMin(cur.scheduled_at, cur.duration_minutes || 30));
      let overrideReason = null;
      if (moved || lenChanged) {
        const conflicts = conflictsFor({ patientId: cur.patient_id, clinicianId: r.clinicianId, row: r.row, start, end, excludeId: id });
        overrideReason = overrideCheck(user, conflicts, b.override);
      }
      run('UPDATE appointments SET department_id=?,service_id=?,clinician_id=?,scheduled_at=?,ends_at=?,duration_minutes=?,category_id=?,notes=?,row_id=?,updated_at=? WHERE id=?',
        r.dep.id, r.serviceId, r.clinicianId, start, end, r.duration, r.categoryId, r.notes, r.row?.id ?? null, now(), id);
      const detail = { from: { date: was.date, time: was.time, row_id: cur.row_id, clinician_id: cur.clinician_id }, to: { date, time, row_id: r.row?.id ?? null, clinician_id: r.clinicianId }, ...(overrideReason ? { override_reason: overrideReason } : {}) };
      const changed = ['category_id', 'notes', 'duration_minutes', 'service_id'].filter((k) => String(cur[k] ?? '') !== String({ category_id: r.categoryId, notes: r.notes, duration_minutes: r.duration, service_id: r.serviceId }[k] ?? ''));
      history(id, user, moved ? 'RESCHEDULED' : 'EDITED', moved ? { ...detail, changed } : { changed });
      if (overrideReason) audit(user, 'schedule.block_override', 'appointment', id, { reason: overrideReason });
      audit(user, moved ? 'schedule.appointment.reschedule' : 'schedule.appointment.edit', 'appointment', id, { changed });
      return decorate(one(`${apptSelect} WHERE a.id=?`, id));
    });
  }
  function cancelAppointment(user, id, b = {}) {
    need(user, 'schedule.manage');
    const reason = String(b.reason || '').trim();
    if (!reason) bad({ reason: 'Enter the cancellation reason.' });
    return tx(db, () => {
      const cur = getAppt(user, id);
      if (cur.status !== 'SCHEDULED') throw new HttpError(409, 'NOT_EDITABLE', `A ${cur.status.toLowerCase()} appointment cannot be cancelled.`);
      run("UPDATE appointments SET status='CANCELLED', cancel_reason=?, cancelled_at=?, cancelled_by=?, updated_at=? WHERE id=?", reason.slice(0, 500), now(), user.id, now(), id);
      history(id, user, 'CANCELLED', { reason });
      audit(user, 'schedule.appointment.cancel', 'appointment', id, {});
      return decorate(one(`${apptSelect} WHERE a.id=?`, id));
    });
  }
  /** Marks the patient arrived through the EXISTING check-in workflow (visit + queue); nothing about check-in is changed here. */
  function arrive(user, id) {
    need(user, 'visit.manage');
    const cur = getAppt(user, id);
    if (cur.status !== 'SCHEDULED') throw new HttpError(409, 'NOT_EDITABLE', `This appointment is ${cur.status.toLowerCase()}.`);
    if (localOf(cur.scheduled_at, tz()).date !== today()) throw new HttpError(409, 'NOT_TODAY', 'A patient can be marked arrived only on the day of the appointment.');
    const res = ops.checkIn(user, { patientId: cur.patient_id, appointmentId: cur.id, departmentId: cur.department_id, serviceId: cur.service_id || undefined, clinicianId: cur.clinician_id || undefined });
    history(id, user, 'ARRIVED', { visit_id: res.visit?.id ?? null });
    return { appointment: decorate(one(`${apptSelect} WHERE a.id=?`, id)), visit: res.visit, queue: res.queue };
  }
  function appointmentHistory(user, id) {
    need(user, 'schedule.view'); getAppt(user, id);
    return q('SELECT h.*, u.name actor FROM appointment_history h LEFT JOIN users u ON u.id=h.actor_id WHERE h.appointment_id=? ORDER BY h.id', id).map((h) => ({ ...h, detail: JSON.parse(h.detail) }));
  }

  // ---------- breaks / unavailable time ----------
  function createBlocks(user, b = {}) {
    need(user, 'schedule.block');
    return tx(db, () => {
      const date = validDate(b.date); const st = validTime(b.start_time, 'start_time'); const en = validTime(b.end_time, 'end_time');
      if (st >= en) bad({ end_time: 'The end must be after the start.' });
      const kind = String(b.kind || 'BREAK'); if (!BLOCK_KINDS.includes(kind)) bad({ kind: 'Choose a valid type.' });
      const row = rowOf(b.row_id); const groupId = row ? row.group_id : Number(b.group_id);
      if (!row && !one('SELECT 1 x FROM schedule_groups WHERE id=?', groupId)) bad({ group_id: 'Choose a schedule group or a row.' });
      const g = one('SELECT * FROM schedule_groups WHERE id=?', groupId); needDept(user, g.department_id);
      const dates = occurrenceDates(date, b.recurrence); const z = tz(); const ids = []; let affected = 0;
      for (const d of dates) {
        const s = zonedToIso(d, st, z); const e = zonedToIso(d, en, z);
        const id = Number(run('INSERT INTO schedule_blocks(group_id,row_id,user_id,start_at,end_at,kind,note,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)', groupId, row?.id ?? null, row?.user_id ?? null, s, e, kind, String(b.note || '').slice(0, 200), user.id, now()).lastInsertRowid);
        ids.push(id);
        affected += q(`SELECT a.id FROM appointments a WHERE a.status IN ('SCHEDULED','ARRIVED') AND a.scheduled_at<? AND COALESCE(a.ends_at,a.scheduled_at)>? AND (${row ? '(a.row_id=? OR a.clinician_id=?)' : 'a.department_id=?'})`, e, s, ...(row ? [row.id, row.user_id ?? -1] : [g.department_id ?? -1])).length;
      }
      if (ids.length > 1) run(`UPDATE schedule_blocks SET series_id=? WHERE id IN (${ids.join(',')})`, `B${ids[0]}`);
      audit(user, 'schedule.block.create', 'block', ids[0], { count: ids.length, kind });
      return { ids, existing_appointments_in_period: affected };
    });
  }
  function removeBlock(user, id, scopeAll = false) {
    need(user, 'schedule.block');
    const b = one('SELECT * FROM schedule_blocks WHERE id=?', id) || (() => { throw new HttpError(404, 'NOT_FOUND', 'Block not found.'); })();
    const ids = scopeAll && b.series_id ? q('SELECT id FROM schedule_blocks WHERE series_id=? AND active=1', b.series_id).map((x) => x.id) : [id];
    for (const x of ids) run('UPDATE schedule_blocks SET active=0, removed_by=?, removed_at=? WHERE id=?', user.id, now(), x); // kept for history
    audit(user, 'schedule.block.remove', 'block', id, { count: ids.length });
    return { ok: true, removed: ids.length };
  }

  // ---------- waiting list ----------
  const waitSelect = `SELECT w.*, p.mrn, p.name patient_name, p.name_ar patient_name_ar, p.phone, d.name department, u.name clinician FROM waiting_list w JOIN patients p ON p.id=w.patient_id JOIN departments d ON d.id=w.department_id LEFT JOIN users u ON u.id=w.clinician_id`;
  const CONTACT = ['NOT_CONTACTED', 'CONTACTED', 'NO_ANSWER', 'WILL_CALL_BACK', 'CONFIRMED'];
  function listWaiting(user, f = {}) {
    need(user, 'schedule.view'); const sc = scope(user); const st = f.status || 'WAITING';
    return q(`${waitSelect} WHERE w.status=? AND (? IS NULL OR w.department_id=?) ORDER BY COALESCE(w.preferred_date,'9999'), w.id`, st, sc, sc);
  }
  function addWaiting(user, b = {}) {
    need(user, 'schedule.manage');
    if (!one('SELECT 1 x FROM patients WHERE id=?', b.patient_id)) bad({ patient_id: 'Choose a patient.' });
    const dep = one('SELECT id FROM departments WHERE id=? AND active=1', b.department_id) || bad({ department_id: 'Choose a department.' }); needDept(user, dep.id);
    if (b.preferred_date) validDate(b.preferred_date, 'preferred_date'); if (b.preferred_time) validTime(b.preferred_time, 'preferred_time');
    const cs = b.contact_status || 'NOT_CONTACTED'; if (!CONTACT.includes(cs)) bad({ contact_status: 'Unknown contact status.' });
    const id = Number(run('INSERT INTO waiting_list(patient_id,department_id,clinician_id,preferred_date,preferred_time,contact_status,notes,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      b.patient_id, dep.id, b.clinician_id || null, b.preferred_date || null, b.preferred_time || null, cs, String(b.notes || '').slice(0, 500), user.id, now()).lastInsertRowid);
    audit(user, 'schedule.waiting.add', 'waiting', id, {});
    return one(`${waitSelect} WHERE w.id=?`, id);
  }
  function updateWaiting(user, id, b = {}) {
    need(user, 'schedule.manage');
    const cur = one('SELECT * FROM waiting_list WHERE id=?', id) || (() => { throw new HttpError(404, 'NOT_FOUND', 'Entry not found.'); })(); needDept(user, cur.department_id);
    if (cur.status === 'BOOKED') throw new HttpError(409, 'ALREADY_BOOKED', 'This entry is already booked into an appointment.');
    const m = { contact_status: b.contact_status ?? cur.contact_status, notes: b.notes ?? cur.notes, preferred_date: b.preferred_date === undefined ? cur.preferred_date : (b.preferred_date || null), preferred_time: b.preferred_time === undefined ? cur.preferred_time : (b.preferred_time || null), status: b.status ?? cur.status, clinician_id: b.clinician_id === undefined ? cur.clinician_id : (b.clinician_id || null) };
    if (!CONTACT.includes(m.contact_status)) bad({ contact_status: 'Unknown contact status.' });
    if (!['WAITING', 'REMOVED'].includes(m.status) && cur.status !== m.status) bad({ status: 'Use the booking action to mark an entry booked.' });
    if (m.preferred_date) validDate(m.preferred_date, 'preferred_date'); if (m.preferred_time) validTime(m.preferred_time, 'preferred_time');
    run('UPDATE waiting_list SET contact_status=?,notes=?,preferred_date=?,preferred_time=?,status=?,clinician_id=?,updated_at=? WHERE id=?', m.contact_status, String(m.notes).slice(0, 500), m.preferred_date, m.preferred_time, m.status, m.clinician_id, now(), id);
    audit(user, 'schedule.waiting.update', 'waiting', id, { status: m.status, contact: m.contact_status });
    return one(`${waitSelect} WHERE w.id=?`, id);
  }

  // ---------- cancellations ----------
  function listCancellations(user, f = {}) {
    need(user, 'schedule.view'); const sc = scope(user); const z = tz();
    const from = f.from ? validDate(f.from, 'from') : addDays(today(), -30); const to = f.to ? validDate(f.to, 'to') : addDays(today(), 60);
    return q(`${apptSelect} WHERE a.status='CANCELLED' AND (? IS NULL OR a.department_id=?) ORDER BY a.cancelled_at DESC LIMIT 300`, sc, sc).map((a) => {
      const d = decorate(a); const rb = one('SELECT id,ref,scheduled_at FROM appointments WHERE rebooks_id=? AND status<>\'CANCELLED\' ORDER BY id DESC', a.id);
      const by = a.cancelled_by ? one('SELECT name FROM users WHERE id=?', a.cancelled_by)?.name : null;
      return { ...d, cancelled_by_name: by, reschedule_status: rb ? 'REBOOKED' : 'PENDING', rebooked_ref: rb?.ref ?? null, rebooked_at: rb?.scheduled_at ?? null };
    }).filter((a) => a.date >= from && a.date <= to);
  }

  // ---------- call / task lists ----------
  const taskSelect = `SELECT t.*, p.mrn, p.name patient_name, p.name_ar patient_name_ar, u.name assignee, cb.name created_by_name FROM schedule_tasks t LEFT JOIN patients p ON p.id=t.patient_id LEFT JOIN users u ON u.id=t.assigned_to LEFT JOIN users cb ON cb.id=t.created_by`;
  function listTasks(user, f = {}) {
    need(user, 'schedule.view'); const sc = scope(user);
    const kind = f.kind && TASK_KINDS.includes(f.kind) ? f.kind : null; const open = f.status === 'all' ? 0 : 1;
    return q(`${taskSelect} WHERE (? IS NULL OR t.kind=?) AND (?=0 OR t.status IN ('OPEN','IN_PROGRESS')) AND (? IS NULL OR t.department_id IS NULL OR t.department_id=?) ORDER BY COALESCE(t.due_date,'9999'), t.id DESC LIMIT 300`, kind, kind, open, sc, sc);
  }
  function addTask(user, b = {}) {
    need(user, 'schedule.manage');
    if (!TASK_KINDS.includes(b.kind)) bad({ kind: 'Choose the list.' });
    if (b.patient_id && !one('SELECT 1 x FROM patients WHERE id=?', b.patient_id)) bad({ patient_id: 'Unknown patient.' });
    if (!b.patient_id && !String(b.title || '').trim()) bad({ title: 'Choose a patient or enter a title.' });
    if (b.due_date) validDate(b.due_date, 'due_date');
    if (b.department_id) needDept(user, Number(b.department_id));
    if (b.assigned_to && !one('SELECT 1 x FROM users WHERE id=? AND active=1', b.assigned_to)) bad({ assigned_to: 'Choose an active staff member.' });
    const id = Number(run('INSERT INTO schedule_tasks(kind,patient_id,department_id,appointment_id,title,notes,assigned_to,due_date,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      b.kind, b.patient_id || null, b.department_id || scope(user), b.appointment_id || null, String(b.title || '').slice(0, 120), String(b.notes || '').slice(0, 500), b.assigned_to || null, b.due_date || null, user.id, now()).lastInsertRowid);
    audit(user, 'schedule.task.create', 'task', id, { kind: b.kind });
    return one(`${taskSelect} WHERE t.id=?`, id);
  }
  function updateTask(user, id, b = {}) {
    need(user, 'schedule.manage');
    const cur = one('SELECT * FROM schedule_tasks WHERE id=?', id) || (() => { throw new HttpError(404, 'NOT_FOUND', 'Task not found.'); })();
    if (cur.department_id) needDept(user, cur.department_id);
    const st = b.status ?? cur.status; if (!['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'].includes(st)) bad({ status: 'Unknown status.' });
    if (b.due_date) validDate(b.due_date, 'due_date');
    if (b.assigned_to && !one('SELECT 1 x FROM users WHERE id=? AND active=1', b.assigned_to)) bad({ assigned_to: 'Choose an active staff member.' });
    const done = st === 'DONE' && cur.status !== 'DONE';
    run('UPDATE schedule_tasks SET status=?,notes=?,assigned_to=?,due_date=?,updated_at=?,completed_by=?,completed_at=? WHERE id=?', st, String(b.notes ?? cur.notes).slice(0, 500),
      b.assigned_to === undefined ? cur.assigned_to : (b.assigned_to || null), b.due_date === undefined ? cur.due_date : (b.due_date || null), now(), done ? user.id : cur.completed_by, done ? now() : (st === 'DONE' ? cur.completed_at : null), id);
    audit(user, 'schedule.task.update', 'task', id, { status: st });
    return one(`${taskSelect} WHERE t.id=?`, id);
  }

  // ---------- layout helpers (administrator) ----------
  function reorderRows(user, ids) {
    need(user, 'config.manage');
    if (!Array.isArray(ids) || !ids.length || ids.some((i) => !Number.isInteger(i))) bad({ ids: 'Send the ordered list of row ids.' });
    tx(db, () => ids.forEach((id, i) => run('UPDATE schedule_rows SET sort_order=? WHERE id=?', (i + 1) * 10, id)));
    audit(user, 'schedule.rows.reorder', 'schedule_rows', null, { ids });
    return { ok: true };
  }
  function removeRow(user, id) {
    need(user, 'config.manage');
    const r = rowOf(id) || (() => { throw new HttpError(404, 'NOT_FOUND', 'Row not found.'); })();
    if (one('SELECT 1 x FROM appointments WHERE row_id=?', id) || one('SELECT 1 x FROM schedule_blocks WHERE row_id=?', id))
      throw new HttpError(409, 'ROW_IN_USE', 'This row has appointments or blocks, so it cannot be removed. Hide it instead; nothing is lost.');
    run('DELETE FROM schedule_rows WHERE id=?', id); audit(user, 'schedule.row.remove', 'schedule_row', id, { label: r.label });
    return { ok: true };
  }
  function removeColumn(user, id) {
    need(user, 'config.manage');
    const c = one('SELECT * FROM schedule_columns WHERE id=?', id) || (() => { throw new HttpError(404, 'NOT_FOUND', 'Column not found.'); })();
    run('DELETE FROM schedule_columns WHERE id=?', id); audit(user, 'schedule.column.remove', 'schedule_column', id, { time: c.time }); // appointments are keyed by time, so none are affected
    return { ok: true };
  }
  function setup(user, b = {}) {
    need(user, 'config.manage');
    const made = tx(db, () => setupDefaults(db, { start: b.start || '09:00', end: b.end || '17:00', interval: Number(b.interval || 30), departmentId: b.department_id || null }));
    audit(user, 'schedule.setup', 'schedule', null, { groups: made.length });
    return { created: made };
  }
  /** Add rows for active clinicians of the group's department that are not in the group yet (staff records are never changed). */
  function syncStaff(user, groupId) {
    need(user, 'config.manage');
    const g = one('SELECT * FROM schedule_groups WHERE id=?', groupId) || (() => { throw new HttpError(404, 'NOT_FOUND', 'Group not found.'); })();
    const staff = q("SELECT id FROM users WHERE active=1 AND role='clinician' AND (? IS NULL OR department_id=?) ORDER BY name", g.department_id, g.department_id)
      .filter((u) => !one('SELECT 1 x FROM schedule_rows WHERE group_id=? AND user_id=?', g.id, u.id));
    for (const u of staff) run('INSERT INTO schedule_rows(group_id,user_id,department_id,sort_order) VALUES (?,?,?,?)', g.id, u.id, g.department_id, u.id);
    audit(user, 'schedule.sync_staff', 'schedule_group', g.id, { added: staff.length });
    return { added: staff.length };
  }
  function addColumns(user, b = {}) {
    need(user, 'config.manage');
    const g = one('SELECT * FROM schedule_groups WHERE id=?', b.group_id) || bad({ group_id: 'Choose a schedule group.' });
    const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3)); const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const times = [];
    if (b.time) times.push(validTime(b.time));
    else { const st = validTime(b.start, 'start'); const en = validTime(b.end, 'end'); const iv = Number(b.interval || g.interval_minutes);
      if (st >= en || !Number.isInteger(iv) || iv < 5) bad({ end: 'The end must be after the start, with an interval of at least 5 minutes.' });
      for (let m = toMin(st); m < toMin(en); m += iv) times.push(hhmm(m)); }
    let added = 0; for (const t of times) { if (!one('SELECT 1 x FROM schedule_columns WHERE group_id=? AND time=?', g.id, t)) { run('INSERT INTO schedule_columns(group_id,time,label) VALUES (?,?,?)', g.id, t, String(b.label || '').slice(0, 24)); added++; } }
    audit(user, 'schedule.columns.add', 'schedule_group', g.id, { added });
    return { added, skipped_existing: times.length - added };
  }

  return { board, createAppointments, updateAppointment, cancelAppointment, arrive, appointmentHistory, createBlocks, removeBlock, listWaiting, addWaiting, updateWaiting,
    listCancellations, listTasks, addTask, updateTask, reorderRows, removeRow, removeColumn, setup, syncStaff, addColumns, checkConfig, canOverride };
}
