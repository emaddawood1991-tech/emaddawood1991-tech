import { tx } from './db.js';
import { can, deptScope } from './perms.js';

export class HttpError extends Error {
  constructor(status, code, message, extra) { super(message || code); this.status = status; this.code = code; this.extra = extra; }
}
const fail = (status, code, message, extra) => { throw new HttpError(status, code, message, extra); };

// Authoritative clock. `clock.offsetMs` exists only so automated tests can move time forward (never set in production).
export const clock = { offsetMs: 0, advance(ms) { this.offsetMs += ms; } };
export const nowMs = () => Date.now() + clock.offsetMs;
export const now = () => new Date(nowMs()).toISOString();
const dayOf = (iso, tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso));

export function makeOps(db) {
  const q = (sql, ...a) => db.prepare(sql).all(...a);
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const run = (sql, ...a) => db.prepare(sql).run(...a);
  const setting = (k) => one('SELECT value FROM settings WHERE key=?', k)?.value;

  function audit(actor, action, entity, entityId, detail = {}) {
    run('INSERT INTO audit_log(ts,actor_id,action,entity,entity_id,detail) VALUES (?,?,?,?,?,?)',
      now(), actor?.id ?? null, action, entity ?? null, entityId == null ? null : String(entityId), JSON.stringify(detail));
  }
  function event(visit, type, actor, extra = {}) {
    const { sessionId = null, occupancyId = null, data = {}, ts = now() } = extra;
    run('INSERT INTO events(visit_id,patient_id,type,ts,actor_id,session_id,occupancy_id,data) VALUES (?,?,?,?,?,?,?,?)',
      visit.id, visit.patient_id, type, ts, actor?.id ?? null, sessionId, occupancyId, JSON.stringify(data));
    return ts;
  }
  const need = (user, perm) => { if (!can(user, perm)) fail(403, 'FORBIDDEN', `Missing permission: ${perm}`); };
  const getVisit = (id) => one('SELECT * FROM visits WHERE id=?', id) || fail(404, 'VISIT_NOT_FOUND');
  const openVisit = (id) => {
    const v = getVisit(id);
    if (v.status !== 'OPEN') fail(409, 'VISIT_CLOSED', 'Visit is already checked out');
    return v;
  };

  /** Visit is visible if the user has no department scope or the visit touches their department. */
  function visitVisible(user, visitId) {
    const s = deptScope(user);
    if (s == null) return true;
    return !!one(`SELECT 1 FROM queue_entries WHERE visit_id=? AND department_id=?
      UNION SELECT 1 FROM appointments a JOIN visits v ON v.appointment_id=a.id WHERE v.id=? AND a.department_id=?
      UNION SELECT 1 FROM treatment_sessions ts JOIN services sv ON sv.id=ts.service_id WHERE ts.visit_id=? AND sv.department_id=?`,
      visitId, s, visitId, s, visitId, s);
  }
  const needVisible = (user, visitId) => { if (!visitVisible(user, visitId)) fail(403, 'OUT_OF_SCOPE', 'Visit is outside your department'); };

  // ---------- durations ----------
  const effEnd = (s) => s.ended_at_corrected || s.ended_at;
  /** Active (non-paused) intervals of a session, in ms epoch. Open sessions run to `asOf`. */
  function sessionIntervals(s, asOf = nowMs()) {
    const end = effEnd(s) ? Date.parse(effEnd(s)) : asOf;
    const pauses = q('SELECT * FROM session_pauses WHERE session_id=? ORDER BY paused_at', s.id);
    const out = [];
    let cur = Date.parse(s.started_at);
    for (const p of pauses) {
      const ps = Math.min(Date.parse(p.paused_at), end);
      if (ps > cur) out.push([cur, ps]);
      cur = p.resumed_at ? Date.parse(p.resumed_at) : end;
    }
    if (end > cur) out.push([cur, end]);
    return out;
  }
  const sumMs = (iv) => iv.reduce((a, [s, e]) => a + (e - s), 0);
  function unionMs(intervals) {
    const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
    let total = 0, curS = null, curE = null;
    for (const [s, e] of sorted) {
      if (curE == null || s > curE) { if (curE != null) total += curE - curS; curS = s; curE = e; }
      else curE = Math.max(curE, e);
    }
    if (curE != null) total += curE - curS;
    return total;
  }
  /** Timer facts derived only from stored timestamps: planned minutes, pauses, start. Never from a browser counter. */
  function timerOf(s, asOf = nowMs()) {
    const iv = sessionIntervals(s, asOf); const active = sumMs(iv);
    if (!s.planned_minutes) return { planned_ms: null, remaining_ms: null, overrun_ms: 0, timer_state: s.status === 'COMPLETED' ? 'DONE' : s.status === 'PAUSED' ? 'PAUSED' : 'RUNNING' };
    const planned = s.planned_minutes * 60000;
    if (s.status === 'COMPLETED') return { planned_ms: planned, remaining_ms: 0, overrun_ms: Math.max(0, active - planned), timer_state: 'DONE' };
    const remaining = Math.max(0, planned - active);
    const state = s.timer_elapsed_at || remaining === 0 ? 'ELAPSED' : s.status === 'PAUSED' ? 'PAUSED' : 'RUNNING';
    return { planned_ms: planned, remaining_ms: state === 'ELAPSED' ? 0 : remaining, overrun_ms: state === 'ELAPSED' ? Math.max(0, active - planned) : 0, timer_state: state };
  }
  const sessionView = (s) => {
    const asOf = nowMs(); const iv = sessionIntervals(s, asOf);
    return { ...s, ended_effective: effEnd(s), active_ms: sumMs(iv), ...timerOf(s, asOf), pauses: q('SELECT paused_at,resumed_at FROM session_pauses WHERE session_id=? ORDER BY id', s.id) };
  };

  /** Record (once) that a running timer reached its scheduled end. Does NOT complete the treatment or free the room. */
  function sweepTimers() {
    const t = now();
    const due = q("SELECT id FROM treatment_sessions WHERE status='ACTIVE' AND planned_minutes IS NOT NULL AND timer_elapsed_at IS NULL AND scheduled_end_at IS NOT NULL AND scheduled_end_at <= ?", t);
    for (const { id } of due) tx(db, () => {
      const s = one('SELECT * FROM treatment_sessions WHERE id=?', id);
      if (!s || s.status !== 'ACTIVE' || s.timer_elapsed_at || s.scheduled_end_at > now()) return;
      run('UPDATE treatment_sessions SET timer_elapsed_at=? WHERE id=?', s.scheduled_end_at, id);
      const v = getVisit(s.visit_id);
      event(v, 'TIMER_ELAPSED', null, { sessionId: id, ts: s.scheduled_end_at, data: { planned_minutes: s.planned_minutes, scheduled_end_at: s.scheduled_end_at, recorded_at: now() } });
      if (setting('timer_auto_close') === '1') closeSession(s.id, null, 'AUTO', s.scheduled_end_at);
    });
    return due.length;
  }
  /** Shared closing step. `endedAt` is the clinical end; confirmation time is recorded separately. */
  function closeSession(id, user, kind, endedAt) {
    const s = one('SELECT * FROM treatment_sessions WHERE id=?', id); const ts = now();
    run('UPDATE session_pauses SET resumed_at=? WHERE session_id=? AND resumed_at IS NULL', ts, id);
    run("UPDATE treatment_sessions SET status='COMPLETED', ended_at=?, completion_kind=?, confirmed_at=? WHERE id=?", endedAt, kind, kind === 'AUTO' ? null : ts, id);
    event(getVisit(s.visit_id), 'TREATMENT_COMPLETED', user, { sessionId: id, ts, data: { kind, ended_at: endedAt, scheduled_end_at: s.scheduled_end_at, planned_minutes: s.planned_minutes, verified: kind !== 'AUTO' } });
    if (!one("SELECT 1 x FROM treatment_sessions WHERE clinician_id=? AND status IN ('ACTIVE','PAUSED')", s.clinician_id))
      run("UPDATE staff_availability SET status='AVAILABLE', updated_at=?, updated_by=? WHERE user_id=? AND status='BUSY'", ts, user?.id ?? null, s.clinician_id);
    audit(user, kind === 'AUTO' ? 'session.auto_close' : 'session.complete', 'session', id, { kind });
  }

  /** Waiting and visit timing from stored timestamps (first room entry, first treatment start, last end/exit). */
  function visitTiming(v, asOf = nowMs()) {
    const ms = (x) => (x ? Date.parse(x) : null);
    const arrival = ms(v.arrived_at);
    const entry = ms(one('SELECT MIN(entered_at) t FROM occupancy WHERE visit_id=? AND entered_at IS NOT NULL', v.id)?.t);
    const sess = q('SELECT * FROM treatment_sessions WHERE visit_id=? ORDER BY started_at', v.id);
    const start = sess.length ? ms(sess[0].started_at) : null;
    const ends = sess.filter((x) => x.status === 'COMPLETED').map((x) => ms(effEnd(x)));
    const lastEnd = ends.length && ends.length === sess.length ? Math.max(...ends) : null;
    const exits = q('SELECT exited_at, exited_at_corrected FROM occupancy WHERE visit_id=?', v.id);
    const lastExit = exits.length && exits.every((o) => o.exited_at) ? Math.max(...exits.map((o) => ms(o.exited_at_corrected || o.exited_at))) : null;
    const departed = ms(v.departed_at_corrected || v.departed_at);
    const stop = departed ?? asOf; // a closed visit stops counting at departure
    return {
      arrival_at: v.arrived_at, room_entry_at: entry ? new Date(entry).toISOString() : null, treatment_start_at: start ? new Date(start).toISOString() : null,
      last_treatment_end_at: lastEnd ? new Date(lastEnd).toISOString() : null, room_exit_at: lastExit ? new Date(lastExit).toISOString() : null, departed_at: departed ? new Date(departed).toISOString() : null,
      waiting_before_room_ms: entry ? entry - arrival : Math.max(0, stop - arrival),
      waiting_in_room_ms: entry ? (start ? start - entry : Math.max(0, stop - entry)) : null,
      total_waiting_ms: start ? start - arrival : Math.max(0, stop - arrival),
      waiting_is_live: !start && !departed, in_room_wait_is_live: !!entry && !start && !departed,
      total_visit_ms: departed ? departed - arrival : null,
    };
  }
  function visitDurations(visitId) {
    const sessions = q('SELECT ts.*, sv.name service, sv.name_ar service_ar FROM treatment_sessions ts JOIN services sv ON sv.id=ts.service_id WHERE ts.visit_id=?', visitId);
    const all = sessions.flatMap((s) => sessionIntervals(s));
    return { sessions: sessions.map(sessionView), total_ms: unionMs(all), sum_ms: sumMs(all) };
  }

  // ---------- rooms ----------
  const roomOpenCount = (roomId) => one('SELECT COUNT(*) c FROM occupancy WHERE room_id=? AND exited_at IS NULL', roomId).c;
  function roomState(r) {
    const stations = q('SELECT * FROM stations WHERE room_id=? AND active=1 ORDER BY code', r.id)
      .map((s) => ({ ...s, occupied_by: one('SELECT o.id occupancy_id, o.visit_id, o.patient_id FROM occupancy o WHERE o.station_id=? AND o.exited_at IS NULL', s.id) || null }));
    const occupants = roomOpenCount(r.id);
    const cap = stations.length || r.capacity;
    const display = r.status !== 'AVAILABLE' ? r.status : occupants > 0 ? 'OCCUPIED' : 'AVAILABLE';
    const timers = q(`SELECT ts.* FROM treatment_sessions ts
      WHERE ts.room_id=? AND ts.status IN ('ACTIVE','PAUSED') AND EXISTS (SELECT 1 FROM occupancy o WHERE o.visit_id=ts.visit_id AND o.exited_at IS NULL AND o.room_id=ts.room_id)`, r.id)
      .map((x) => ({ session_id: x.id, station_id: x.station_id, ...timerOf(x), scheduled_end_at: x.scheduled_end_at }));
    return { ...r, stations, occupants, effective_capacity: cap, display_status: display, timers };
  }
  function checkAssignable(roomId, stationId, excludeOcc) {
    const room = one('SELECT * FROM rooms WHERE id=?', roomId) || fail(404, 'ROOM_NOT_FOUND');
    if (!room.active) fail(409, 'ROOM_INACTIVE', 'Room is not active');
    if (room.status !== 'AVAILABLE') fail(409, 'ROOM_UNAVAILABLE', `Room is ${room.status}`);
    const stations = q('SELECT * FROM stations WHERE room_id=? AND active=1', roomId);
    if (stations.length) {
      if (!stationId) fail(400, 'STATION_REQUIRED', 'This room needs a station/bed');
      const st = stations.find((s) => s.id === Number(stationId)) || fail(400, 'STATION_INVALID', 'Station does not belong to this room or is inactive');
      const busy = one('SELECT 1 x FROM occupancy WHERE station_id=? AND exited_at IS NULL AND id IS NOT ?', st.id, excludeOcc ?? null);
      if (busy) fail(409, 'STATION_BUSY', `${st.code} is already in use`);
      return { room, station: st };
    }
    if (roomOpenCount(roomId) >= room.capacity) fail(409, 'ROOM_FULL', 'Room is at capacity');
    return { room, station: null };
  }
  const locLabel = (roomId, stationId) => {
    const r = one('SELECT code FROM rooms WHERE id=?', roomId)?.code;
    const s = stationId ? one('SELECT code FROM stations WHERE id=?', stationId)?.code : null;
    return s ? `${r}/${s}` : r;
  };

  function assignRoom(user, visitId, { roomId, stationId }) {
    need(user, 'room.assign');
    return tx(db, () => {
      const v = openVisit(visitId); needVisible(user, v.id);
      if (one('SELECT 1 x FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v.id)) fail(409, 'ALREADY_IN_ROOM', 'Patient already has an open room assignment');
      const { room, station } = checkAssignable(roomId, stationId);
      const ts = now();
      const r = run('INSERT INTO occupancy(visit_id,patient_id,room_id,station_id,assigned_at,assigned_by) VALUES (?,?,?,?,?,?)',
        v.id, v.patient_id, room.id, station?.id ?? null, ts, user.id);
      const occId = Number(r.lastInsertRowid);
      event(v, 'ROOM_ASSIGNED', user, { occupancyId: occId, ts, data: { room: room.code, station: station?.code ?? null } });
      run("UPDATE queue_entries SET status='IN_ROOM' WHERE visit_id=? AND status IN ('WAITING','CALLED')", v.id);
      audit(user, 'room.assign', 'occupancy', occId, { visit: v.id, room: room.code });
      return one('SELECT * FROM occupancy WHERE id=?', occId);
    });
  }
  function enterRoom(user, visitId) {
    need(user, 'room.assign');
    return tx(db, () => {
      const v = openVisit(visitId); needVisible(user, v.id);
      const o = one('SELECT * FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v.id) || fail(409, 'NO_ASSIGNMENT', 'No room assigned');
      if (o.entered_at) return o; // idempotent
      const ts = now();
      run('UPDATE occupancy SET entered_at=? WHERE id=?', ts, o.id);
      event(v, 'ROOM_ENTERED', user, { occupancyId: o.id, ts, data: { room: locLabel(o.room_id, o.station_id) } });
      return one('SELECT * FROM occupancy WHERE id=?', o.id);
    });
  }
  function closeOpenSessionsCheck(v) {
    if (one("SELECT 1 x FROM treatment_sessions WHERE visit_id=? AND status IN ('ACTIVE','PAUSED')", v.id))
      fail(409, 'SESSION_OPEN', 'Complete active treatment sessions first');
  }
  function afterExit(roomId) {
    const room = one('SELECT * FROM rooms WHERE id=?', roomId);
    if (room.cleaning_after_use && room.status === 'AVAILABLE' && roomOpenCount(roomId) === 0) {
      run("UPDATE rooms SET status='CLEANING', status_reason='Auto: cleaning after use' WHERE id=?", roomId);
      run("INSERT INTO room_status_history(room_id,from_status,to_status,reason,actor_id,ts) VALUES (?,?,?,?,?,?)",
        roomId, 'AVAILABLE', 'CLEANING', 'Auto: cleaning after use', null, now());
    }
  }
  function exitRoom(user, visitId) {
    need(user, 'room.assign');
    return tx(db, () => {
      const v = getVisit(visitId); needVisible(user, v.id);
      const o = one('SELECT * FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v.id);
      if (!o) return null; // idempotent
      closeOpenSessionsCheck(v);
      const ts = now();
      run("UPDATE occupancy SET exited_at=?, exit_reason='EXIT' WHERE id=?", ts, o.id);
      event(v, 'ROOM_EXITED', user, { occupancyId: o.id, ts, data: { room: locLabel(o.room_id, o.station_id) } });
      run("UPDATE queue_entries SET status='DONE', closed_at=? WHERE visit_id=? AND status='IN_ROOM'", ts, v.id);
      afterExit(o.room_id);
      audit(user, 'room.exit', 'occupancy', o.id, { visit: v.id });
      return { ...o, exited_at: ts };
    });
  }
  function transferRoom(user, visitId, { roomId, stationId, reason }) {
    need(user, 'room.assign');
    return tx(db, () => {
      const v = openVisit(visitId); needVisible(user, v.id);
      const cur = one('SELECT * FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v.id) || fail(409, 'NO_ASSIGNMENT', 'Patient is not in a room');
      if (!cur.entered_at) fail(409, 'NOT_ENTERED', 'Confirm room entry before transferring');
      if (setting('transfer_reason_required') === '1' && !String(reason || '').trim()) fail(400, 'REASON_REQUIRED', 'Transfer reason is required');
      if (cur.room_id === Number(roomId) && (cur.station_id ?? null) === (stationId ? Number(stationId) : null)) fail(400, 'SAME_LOCATION', 'Destination equals current location');
      const { room, station } = checkAssignable(roomId, stationId, cur.id);
      const ts = now();
      run("UPDATE occupancy SET exited_at=?, exit_reason='TRANSFER' WHERE id=?", ts, cur.id);
      const r = run('INSERT INTO occupancy(visit_id,patient_id,room_id,station_id,assigned_at,assigned_by,entered_at,transferred_from) VALUES (?,?,?,?,?,?,?,?)',
        v.id, v.patient_id, room.id, station?.id ?? null, ts, user.id, ts, cur.id);
      const newId = Number(r.lastInsertRowid);
      const from = locLabel(cur.room_id, cur.station_id), to = locLabel(room.id, station?.id);
      event(v, 'ROOM_TRANSFERRED', user, { occupancyId: newId, ts, data: { from, to, reason: reason || null,
        open_sessions: q("SELECT id FROM treatment_sessions WHERE visit_id=? AND status IN ('ACTIVE','PAUSED')", v.id).map((x) => x.id) } });
      afterExit(cur.room_id);
      audit(user, 'room.transfer', 'occupancy', newId, { visit: v.id, from, to, reason: reason || null });
      return one('SELECT * FROM occupancy WHERE id=?', newId);
    });
  }

  function setRoomStatus(user, roomId, status, reason) {
    const room = one('SELECT * FROM rooms WHERE id=?', roomId) || fail(404, 'ROOM_NOT_FOUND');
    if (!['AVAILABLE', 'CLEANING', 'MAINTENANCE', 'OUT_OF_SERVICE'].includes(status)) fail(400, 'BAD_STATUS');
    if (status === 'MAINTENANCE' || status === 'OUT_OF_SERVICE' || room.status === 'MAINTENANCE' || room.status === 'OUT_OF_SERVICE') need(user, 'room.maintenance');
    else need(user, 'room.cleaning');
    if ((status === 'MAINTENANCE' || status === 'OUT_OF_SERVICE') && !String(reason || '').trim()) fail(400, 'REASON_REQUIRED', 'A reason is required');
    if (status !== 'AVAILABLE' && roomOpenCount(roomId) > 0) fail(409, 'ROOM_OCCUPIED', 'Room still has patients; transfer or exit them first');
    if (room.status === status) return room;
    return tx(db, () => {
      run('UPDATE rooms SET status=?, status_reason=? WHERE id=?', status, status === 'AVAILABLE' ? null : reason || null, roomId);
      run('INSERT INTO room_status_history(room_id,from_status,to_status,reason,actor_id,ts) VALUES (?,?,?,?,?,?)',
        roomId, room.status, status, reason || null, user.id, now());
      audit(user, 'room.status', 'room', roomId, { from: room.status, to: status, reason: reason || null });
      return one('SELECT * FROM rooms WHERE id=?', roomId);
    });
  }

  // ---------- visits & queue ----------
  function checkIn(user, { patientId, appointmentId, departmentId, serviceId, clinicianId }) {
    need(user, 'visit.manage');
    return tx(db, () => {
      const p = one('SELECT * FROM patients WHERE id=?', patientId) || fail(404, 'PATIENT_NOT_FOUND');
      let appt = appointmentId ? one('SELECT * FROM appointments WHERE id=?', appointmentId) : null;
      if (appointmentId && !appt) fail(404, 'APPOINTMENT_NOT_FOUND');
      if (appt && appt.patient_id !== p.id) fail(400, 'APPOINTMENT_MISMATCH');
      const deptId = Number(departmentId || appt?.department_id);
      if (!deptId || !one('SELECT 1 x FROM departments WHERE id=? AND active=1', deptId)) fail(400, 'DEPARTMENT_REQUIRED', 'Valid department is required');
      let v = one("SELECT * FROM visits WHERE patient_id=? AND status='OPEN'", p.id);
      const ts = now();
      if (v && one("SELECT 1 x FROM queue_entries WHERE visit_id=? AND department_id=? AND status IN ('WAITING','CALLED','IN_ROOM')", v.id, deptId))
        fail(409, 'ALREADY_QUEUED', 'Patient is already in this department queue');
      if (!v) {
        const r = run('INSERT INTO visits(patient_id,appointment_id,arrived_at) VALUES (?,?,?)', p.id, appt?.id ?? null, ts);
        v = one('SELECT * FROM visits WHERE id=?', Number(r.lastInsertRowid));
        if (appt) {
          event(v, 'APPOINTMENT', user, { ts: appt.scheduled_at, data: { ref: appt.ref, scheduled_at: appt.scheduled_at, kind: 'scheduled_time' } });
          run("UPDATE appointments SET status='ARRIVED' WHERE id=?", appt.id);
        }
        event(v, 'ARRIVED', user, { ts });
      }
      const svcId = serviceId ? Number(serviceId) : appt?.service_id || null;
      if (svcId) {
        const sv = one('SELECT * FROM services WHERE id=?', svcId);
        if (!sv || !sv.active) fail(400, 'VALIDATION', 'That service is not active.', { fields: { service_id: 'Choose an active service.' } });
        if (sv.department_id !== deptId) fail(400, 'VALIDATION', 'The service does not belong to the selected department.', { fields: { service_id: 'Choose a service from the selected department.' } });
      } else if (setting('require_service_at_checkin') === '1') fail(400, 'VALIDATION', 'A service is required at check-in.', { fields: { service_id: 'Service is required.' } });
      const clinId = clinicianId || appt?.clinician_id || null;
      if (clinId && !one("SELECT 1 x FROM users WHERE id=? AND role='clinician' AND active=1 AND department_id=?", clinId, deptId))
        fail(400, 'VALIDATION', 'The clinician is not active in the selected department.', { fields: { clinician_id: 'Choose a clinician from the selected department.' } });
      const dept = one('SELECT * FROM departments WHERE id=?', deptId);
      const day = dayOf(ts, setting('timezone'));
      const dayKey = dept.queue_reset_daily ? day : 'ALL';
      const c = one('SELECT last FROM queue_counters WHERE department_id=? AND day=?', deptId, dayKey);
      const number = c ? c.last + 1 : dept.queue_start;
      run('INSERT INTO queue_counters(department_id,day,last) VALUES (?,?,?) ON CONFLICT(department_id,day) DO UPDATE SET last=excluded.last', deptId, dayKey, number);
      const display = `${dept.queue_prefix}${String(number).padStart(3, '0')}`;
      const cl = clinId;
      const qr = run('INSERT INTO queue_entries(visit_id,department_id,number,display,clinician_id,service_id,created_at) VALUES (?,?,?,?,?,?,?)',
        v.id, deptId, number, display, cl, svcId, ts);
      event(v, 'QUEUE_ENTERED', user, { ts, data: { queue: display, department: dept.name } });
      audit(user, 'visit.checkin', 'visit', v.id, { patient: p.id, queue: display });
      return { visit: v, queue: one('SELECT * FROM queue_entries WHERE id=?', Number(qr.lastInsertRowid)) };
    });
  }
  function checkOut(user, visitId) {
    need(user, 'visit.manage');
    return tx(db, () => {
      const v = getVisit(visitId);
      if (v.status === 'CHECKED_OUT') return v; // idempotent
      closeOpenSessionsCheck(v);
      if (one('SELECT 1 x FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v.id)) fail(409, 'STILL_IN_ROOM', 'Patient is still in a room; exit the room first');
      const ts = now();
      run("UPDATE visits SET status='CHECKED_OUT', departed_at=? WHERE id=?", ts, v.id);
      run("UPDATE queue_entries SET status='DONE', closed_at=? WHERE visit_id=? AND status IN ('WAITING','CALLED','IN_ROOM')", ts, v.id);
      event(v, 'CLINIC_DEPARTED', user, { ts });
      audit(user, 'visit.checkout', 'visit', v.id);
      return one('SELECT * FROM visits WHERE id=?', v.id);
    });
  }
  function callNext(user, departmentId, clinicianId) {
    need(user, 'queue.call');
    const s = deptScope(user);
    if (s != null && Number(departmentId) !== s) fail(403, 'OUT_OF_SCOPE');
    return tx(db, () => {
      // Priority is manually set; within the same priority, order is by arrival. Arrival time alone never sets priority.
      const row = one(`SELECT * FROM queue_entries WHERE department_id=? AND status='WAITING'
        AND (? IS NULL OR clinician_id IS NULL OR clinician_id=?)
        ORDER BY priority DESC, created_at ASC, id ASC LIMIT 1`, departmentId, clinicianId ?? null, clinicianId ?? null);
      if (!row) return null;
      const ts = now();
      run("UPDATE queue_entries SET status='CALLED', called_at=? WHERE id=?", ts, row.id);
      event(getVisit(row.visit_id), 'QUEUE_CALLED', user, { ts, data: { queue: row.display } });
      audit(user, 'queue.call', 'queue_entry', row.id);
      return one('SELECT * FROM queue_entries WHERE id=?', row.id);
    });
  }
  function setPriority(user, queueId, priority, reason) {
    need(user, 'queue.priority');
    if (![0, 1, 2].includes(Number(priority))) fail(400, 'BAD_PRIORITY');
    if (Number(priority) > 0 && !String(reason || '').trim()) fail(400, 'REASON_REQUIRED', 'A clinical/operational reason is required to prioritise');
    const e = one('SELECT * FROM queue_entries WHERE id=?', queueId) || fail(404, 'QUEUE_NOT_FOUND');
    run('UPDATE queue_entries SET priority=?, priority_reason=? WHERE id=?', Number(priority), Number(priority) ? reason : null, queueId);
    audit(user, 'queue.priority', 'queue_entry', queueId, { from: e.priority, to: Number(priority), reason: reason || null });
    return one('SELECT * FROM queue_entries WHERE id=?', queueId);
  }
  function queueList(user, departmentId) {
    const s = deptScope(user);
    const dep = s ?? (departmentId ? Number(departmentId) : null);
    return q(`SELECT qe.*, p.mrn, p.name patient_name, p.name_ar patient_name_ar, d.name department, u.name clinician, sv.name service
      FROM queue_entries qe JOIN visits v ON v.id=qe.visit_id JOIN patients p ON p.id=v.patient_id
      JOIN departments d ON d.id=qe.department_id LEFT JOIN users u ON u.id=qe.clinician_id LEFT JOIN services sv ON sv.id=qe.service_id
      WHERE qe.status IN ('WAITING','CALLED') AND (? IS NULL OR qe.department_id=?)
      ORDER BY qe.priority DESC, qe.created_at, qe.id`, dep, dep);
  }

  // ---------- sessions ----------
  function authorizedFor(userId, serviceId) {
    return !!one('SELECT 1 x FROM staff_services WHERE user_id=? AND service_id=?', userId, serviceId);
  }
  /** Departments the visit is currently being treated in (open queue entries, else any entry, else the appointment). */
  function visitDepartments(visitId) {
    const rows = (sql) => q(sql, visitId).map((r) => r.id);
    const open = rows("SELECT DISTINCT department_id id FROM queue_entries WHERE visit_id=? AND status IN ('WAITING','CALLED','IN_ROOM')");
    if (open.length) return open;
    const any = rows('SELECT DISTINCT department_id id FROM queue_entries WHERE visit_id=?');
    if (any.length) return any;
    return rows('SELECT a.department_id id FROM appointments a JOIN visits v ON v.appointment_id=a.id WHERE v.id=?');
  }
  const deptName = (id) => one('SELECT name FROM departments WHERE id=?', id)?.name || 'the department';

  /** Everything the Start Treatment window needs: the visit's department(s), their active services, and who is authorized for each. */
  function treatmentOptions(user, visitId) {
    need(user, 'session.run');
    const v = openVisit(visitId); needVisible(user, v.id);
    const occ = one('SELECT o.*, r.code room_code, st.code station_code FROM occupancy o JOIN rooms r ON r.id=o.room_id LEFT JOIN stations st ON st.id=o.station_id WHERE o.visit_id=? AND o.exited_at IS NULL', v.id);
    const ready = !!(occ && occ.entered_at);
    const departments = visitDepartments(v.id).map((id) => {
      const d = one('SELECT id,name,name_ar FROM departments WHERE id=?', id);
      const services = q('SELECT id,name,name_ar,default_minutes,min_minutes,max_minutes,allow_override FROM services WHERE department_id=? AND active=1 ORDER BY name', id).map((sv) => {
        const authorized = q(`SELECT u.id,u.name,u.name_ar,u.role,COALESCE(a.status,'OFF_DUTY') availability FROM staff_services ss JOIN users u ON u.id=ss.user_id
          LEFT JOIN staff_availability a ON a.user_id=u.id WHERE ss.service_id=? AND u.active=1 ORDER BY u.name`, sv.id);
        return { ...sv, authorized, can_start_as_me: authorized.some((c) => c.id === user.id) };
      });
      return { ...d, services };
    });
    return {
      visit_id: v.id, ready,
      patient: one('SELECT id,mrn,name,name_ar FROM patients WHERE id=?', v.patient_id),
      location: occ ? locLabel(occ.room_id, occ.station_id) : null,
      not_ready_reason: !occ ? 'NO_ROOM' : !occ.entered_at ? 'NOT_ENTERED' : null,
      departments,
      viewer: { id: user.id, role: user.role, can_start_for_others: can(user, 'availability.others') },
    };
  }

  function startSession(user, visitId, { serviceId, clinicianId, idemKey, plannedMinutes }) {
    need(user, 'session.run');
    return tx(db, () => {
      if (idemKey) { const ex = one('SELECT * FROM treatment_sessions WHERE idem_key=?', idemKey); if (ex) return sessionView(ex); }
      const v = openVisit(visitId); needVisible(user, v.id);
      if (!serviceId) fail(400, 'SERVICE_REQUIRED', 'Choose the service to start.');
      const svc = one('SELECT * FROM services WHERE id=?', serviceId) || fail(400, 'SERVICE_INVALID', 'That service does not exist.');
      if (!svc.active) fail(400, 'SERVICE_INVALID', `“${svc.name}” is no longer active. Choose an active service.`);
      const depts = visitDepartments(v.id);
      if (depts.length && !depts.includes(svc.department_id))
        fail(409, 'SERVICE_NOT_IN_VISIT_DEPARTMENT', `“${svc.name}” belongs to ${deptName(svc.department_id)}, but this patient is checked in to ${depts.map(deptName).join(' / ')}. Choose a service from ${depts.map(deptName).join(' / ')}.`);
      const clin = Number(clinicianId || user.id);
      const onBehalf = clin !== user.id;
      if (onBehalf && !can(user, 'availability.others')) fail(403, 'FORBIDDEN', 'Only supervisors and administrators can start treatment for another clinician. Sign in as the clinician instead.');
      const who = one('SELECT name,role,active FROM users WHERE id=?', clin);
      if (!who || !who.active) fail(400, 'CLINICIAN_INVALID', 'That clinician is not active.');
      if (!authorizedFor(clin, svc.id)) { // availability is irrelevant here; only an explicit authorization counts
        const anyone = one('SELECT 1 x FROM staff_services ss JOIN users u ON u.id=ss.user_id WHERE ss.service_id=? AND u.active=1', svc.id);
        if (!anyone) fail(403, 'NO_AUTHORIZED_CLINICIAN', `No authorized clinician is available for “${svc.name}”. Please assign an authorized clinician in Settings → Staff.`);
        const msg = !onBehalf
          ? (who.role === 'clinician' ? `You are not authorized to provide “${svc.name}”. Ask an administrator to grant it in Settings → Staff, or choose a service you are authorized for.`
            : `Your ${who.role === 'admin' ? 'administrator' : who.role} role does not include clinical authorization for “${svc.name}”. Choose an authorized clinician to start it for, or sign in as that clinician.`)
          : `${who.name} is not authorized to provide “${svc.name}”. Choose an authorized clinician, or grant it in Settings → Staff.`;
        fail(403, 'NOT_AUTHORIZED_FOR_SERVICE', msg);
      }
      const occ = one('SELECT * FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v.id);
      if (!occ) fail(409, 'NOT_IN_ROOM', 'Assign a room to the patient and confirm room entry before starting treatment.');
      if (!occ.entered_at) fail(409, 'NOT_IN_ROOM', 'Confirm that the patient has entered the room before starting treatment.');
      if (one("SELECT 1 x FROM treatment_sessions WHERE visit_id=? AND service_id=? AND clinician_id=? AND status IN ('ACTIVE','PAUSED')", v.id, svc.id, clin))
        fail(409, 'SESSION_EXISTS', `${onBehalf ? who.name : 'You'} already ${onBehalf ? 'has' : 'have'} an open “${svc.name}” session for this visit. Complete it first.`);
      // Planned duration: any whole number of minutes inside the service's configured range.
      const planned = plannedMinutes == null || plannedMinutes === '' ? svc.default_minutes : Number(plannedMinutes);
      if (!Number.isInteger(planned)) fail(400, 'VALIDATION', 'Treatment duration must be a whole number of minutes.', { fields: { planned_minutes: 'Enter whole minutes, for example 20, 40, 50, 55 or 60.' } });
      if (planned < svc.min_minutes || planned > svc.max_minutes) fail(400, 'VALIDATION', `Duration for “${svc.name}” must be between ${svc.min_minutes} and ${svc.max_minutes} minutes.`, { fields: { planned_minutes: `Allowed range: ${svc.min_minutes}–${svc.max_minutes} minutes.` } });
      if (!svc.allow_override && planned !== svc.default_minutes) fail(400, 'VALIDATION', `The duration for “${svc.name}” is fixed at ${svc.default_minutes} minutes by clinic policy. An administrator can allow overrides in Settings → Services.`, { fields: { planned_minutes: `Fixed at ${svc.default_minutes} minutes.` } });
      const ts = now();
      const endAt = new Date(Date.parse(ts) + planned * 60000).toISOString();
      const r = run('INSERT INTO treatment_sessions(idem_key,visit_id,patient_id,service_id,clinician_id,room_id,station_id,started_at,planned_minutes,scheduled_end_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        idemKey || null, v.id, v.patient_id, svc.id, clin, occ.room_id, occ.station_id, ts, planned, endAt);
      const id = Number(r.lastInsertRowid);
      event(v, 'TREATMENT_STARTED', user, { sessionId: id, occupancyId: occ.id, ts, data: { service: svc.name, clinician_id: clin, clinician: who.name, on_behalf: onBehalf, location: locLabel(occ.room_id, occ.station_id), planned_minutes: planned, scheduled_end_at: endAt } });
      run("UPDATE staff_availability SET status='BUSY', updated_at=?, updated_by=? WHERE user_id=? AND status='AVAILABLE'", ts, user.id, clin);
      audit(user, 'session.start', 'session', id, { visit: v.id, service: svc.id, clinician: clin, on_behalf: onBehalf, planned_minutes: planned });
      return sessionView(one('SELECT * FROM treatment_sessions WHERE id=?', id));
    });
  }
  function ownSession(user, id) {
    const s = one('SELECT * FROM treatment_sessions WHERE id=?', id) || fail(404, 'SESSION_NOT_FOUND');
    need(user, 'session.run');
    needVisible(user, s.visit_id);
    if (s.clinician_id !== user.id && !can(user, 'availability.others')) fail(403, 'FORBIDDEN', 'Not your session');
    return s;
  }
  function pauseSession(user, id) {
    sweepTimers();
    return tx(db, () => {
      const s = ownSession(user, id);
      if (s.status === 'PAUSED') return sessionView(s);
      if (s.status !== 'ACTIVE') fail(409, 'SESSION_NOT_ACTIVE');
      if (s.timer_elapsed_at) fail(409, 'TIMER_ELAPSED', 'The scheduled treatment time has already elapsed. Confirm completion, or end the treatment, instead of pausing.');
      const ts = now();
      run("UPDATE treatment_sessions SET status='PAUSED' WHERE id=?", id);
      run('INSERT INTO session_pauses(session_id,paused_at) VALUES (?,?)', id, ts);
      event(getVisit(s.visit_id), 'TREATMENT_PAUSED', user, { sessionId: id, ts, data: { remaining_ms: timerOf(one('SELECT * FROM treatment_sessions WHERE id=?', id), Date.parse(ts)).remaining_ms } });
      return sessionView(one('SELECT * FROM treatment_sessions WHERE id=?', id));
    });
  }
  function resumeSession(user, id) {
    return tx(db, () => {
      const s = ownSession(user, id);
      if (s.status === 'ACTIVE') return sessionView(s);
      if (s.status !== 'PAUSED') fail(409, 'SESSION_NOT_PAUSED');
      const ts = now();
      // The planned duration is ACTIVE treatment time, so the end moves out by the length of the pause.
      let endAt = s.scheduled_end_at;
      if (s.planned_minutes) endAt = new Date(Date.parse(ts) + Math.max(0, s.planned_minutes * 60000 - sumMs(sessionIntervals(s, Date.parse(ts))))).toISOString();
      run("UPDATE treatment_sessions SET status='ACTIVE', scheduled_end_at=? WHERE id=?", endAt, id);
      run('UPDATE session_pauses SET resumed_at=? WHERE session_id=? AND resumed_at IS NULL', ts, id);
      event(getVisit(s.visit_id), 'TREATMENT_RESUMED', user, { sessionId: id, ts, data: { scheduled_end_at: endAt } });
      return sessionView(one('SELECT * FROM treatment_sessions WHERE id=?', id));
    });
  }
  /** Confirm completion. mode: 'now' (default; the treatment ran until this confirmation) or 'scheduled' (clinician confirms it ended at the scheduled time). */
  function completeSession(user, id, { mode } = {}) {
    sweepTimers();
    return tx(db, () => {
      const s = ownSession(user, id);
      if (s.status === 'COMPLETED') return sessionView(s);
      const ts = now();
      let kind = null; let endedAt = ts;
      if (s.planned_minutes) {
        if (s.timer_elapsed_at) { if (mode === 'scheduled') { kind = 'FULL'; endedAt = s.scheduled_end_at; } else kind = 'OVERRUN'; }
        else kind = 'EARLY';
      }
      if (mode && !['now', 'scheduled'].includes(mode)) fail(400, 'VALIDATION', 'Unknown completion mode.');
      closeSession(id, user, kind, endedAt);
      if (!kind) run('UPDATE treatment_sessions SET confirmed_at=? WHERE id=?', ts, id);
      return sessionView(one('SELECT * FROM treatment_sessions WHERE id=?', id));
    });
  }
  function activeSessions(user) {
    sweepTimers();
    const s = deptScope(user);
    return q(`SELECT ts.*, p.mrn, p.name patient_name, p.name_ar patient_name_ar, sv.name service, sv.name_ar service_ar, u.name clinician
      FROM treatment_sessions ts JOIN patients p ON p.id=ts.patient_id JOIN services sv ON sv.id=ts.service_id JOIN users u ON u.id=ts.clinician_id
      WHERE ts.status IN ('ACTIVE','PAUSED') AND (? IS NULL OR sv.department_id=?) ORDER BY ts.started_at`, s, s)
      .map((r) => ({ ...sessionView(r), room: locLabel(r.room_id, r.station_id) }));
  }

  // ---------- timeline ----------
  function timeline(user, visitId) {
    need(user, 'patients.read');
    const v = getVisit(visitId); needVisible(user, v.id);
    audit(user, 'timeline.view', 'visit', v.id);
    const events = q(`SELECT e.*, u.name actor FROM events e LEFT JOIN users u ON u.id=e.actor_id WHERE e.visit_id=? ORDER BY e.id`, v.id)
      .map((e) => ({ ...e, data: JSON.parse(e.data) }));
    const corrections = q(`SELECT c.*, ur.name requester, ud.name decider FROM corrections c JOIN users ur ON ur.id=c.requested_by LEFT JOIN users ud ON ud.id=c.decided_by WHERE c.visit_id=? ORDER BY c.id`, v.id);
    const patient = one('SELECT id,mrn,name,name_ar FROM patients WHERE id=?', v.patient_id);
    sweepTimers();
    return { visit: v, patient, events, corrections, durations: visitDurations(v.id), timing: visitTiming(v),
      occupancy: q('SELECT o.*, r.code room_code, st.code station_code FROM occupancy o JOIN rooms r ON r.id=o.room_id LEFT JOIN stations st ON st.id=o.station_id WHERE o.visit_id=? ORDER BY o.id', v.id) };
  }

  // ---------- corrections ----------
  const kindTable = { SESSION_END: ['treatment_sessions', 'started_at', 'ended_at', 'ended_at_corrected'], ROOM_EXIT: ['occupancy', 'entered_at', 'exited_at', 'exited_at_corrected'], CLINIC_DEPARTURE: ['visits', 'arrived_at', 'departed_at', 'departed_at_corrected'] };
  function requestCorrection(user, { kind, entityId, correctedTs, reason }) {
    need(user, 'corrections.request');
    if (!kindTable[kind]) fail(400, 'BAD_KIND');
    if (!String(reason || '').trim()) fail(400, 'REASON_REQUIRED', 'A reason is required');
    const [tbl, startCol, endCol] = kindTable[kind];
    return tx(db, () => {
      let ent = one(`SELECT * FROM ${tbl} WHERE id=?`, entityId) || fail(404, 'ENTITY_NOT_FOUND');
      const visitId = tbl === 'visits' ? ent.id : ent.visit_id;
      needVisible(user, visitId);
      const v = getVisit(visitId);
      // Forgotten check-out: close the open record now (server time = original), then correct it.
      if (!ent[endCol]) {
        const ts = now();
        if (kind === 'SESSION_END') {
          run('UPDATE session_pauses SET resumed_at=? WHERE session_id=? AND resumed_at IS NULL', ts, ent.id);
          run("UPDATE treatment_sessions SET status='COMPLETED', ended_at=? WHERE id=?", ts, ent.id);
          event(v, 'TREATMENT_COMPLETED', user, { sessionId: ent.id, ts, data: { late_close: true } });
        } else if (kind === 'ROOM_EXIT') {
          closeOpenSessionsCheck(v);
          run("UPDATE occupancy SET exited_at=?, exit_reason='EXIT' WHERE id=?", ts, ent.id);
          event(v, 'ROOM_EXITED', user, { occupancyId: ent.id, ts, data: { late_close: true } });
          run("UPDATE queue_entries SET status='DONE', closed_at=? WHERE visit_id=? AND status='IN_ROOM'", ts, v.id);
          afterExit(ent.room_id);
        } else {
          closeOpenSessionsCheck(v);
          if (one('SELECT 1 x FROM occupancy WHERE visit_id=? AND exited_at IS NULL', v.id)) fail(409, 'STILL_IN_ROOM', 'Close the room occupancy first');
          run("UPDATE visits SET status='CHECKED_OUT', departed_at=? WHERE id=?", ts, ent.id);
          run("UPDATE queue_entries SET status='DONE', closed_at=? WHERE visit_id=? AND status IN ('WAITING','CALLED','IN_ROOM')", ts, ent.id);
          event(v, 'CLINIC_DEPARTED', user, { ts, data: { late_close: true } });
        }
        ent = one(`SELECT * FROM ${tbl} WHERE id=?`, entityId);
      }
      const original = ent[endCol];
      const startMs = Date.parse(ent[startCol]);
      const cMs = Date.parse(correctedTs);
      if (Number.isNaN(cMs)) fail(400, 'BAD_TIMESTAMP');
      if (cMs < startMs) fail(400, 'BEFORE_START', 'Corrected time cannot be before the start');
      if (cMs > nowMs()) fail(400, 'IN_FUTURE', 'Corrected time cannot be in the future');
      if (one("SELECT 1 x FROM corrections WHERE kind=? AND entity_id=? AND status='PENDING'", kind, entityId)) fail(409, 'CORRECTION_PENDING', 'A correction is already pending');
      const ts = now();
      const r = run("INSERT INTO corrections(kind,entity_id,visit_id,original_ts,corrected_ts,reason,requested_by,requested_at,status) VALUES (?,?,?,?,?,?,?,?,'PENDING')",
        kind, entityId, visitId, original, new Date(cMs).toISOString(), reason.trim(), user.id, ts);
      const id = Number(r.lastInsertRowid);
      event(v, 'CORRECTION_REQUESTED', user, { ts, data: { correction_id: id, kind, original, corrected: new Date(cMs).toISOString(), reason: reason.trim() } });
      audit(user, 'correction.request', 'correction', id, { kind, entityId });
      if (setting('correction_requires_approval') !== '1') applyCorrection(id, user, 'Auto-approved by policy');
      return one('SELECT * FROM corrections WHERE id=?', id);
    });
  }
  function applyCorrection(id, user, note) {
    const c = one('SELECT * FROM corrections WHERE id=?', id);
    const [tbl, , , corrCol] = kindTable[c.kind];
    const ts = now();
    run(`UPDATE ${tbl} SET ${corrCol}=? WHERE id=?`, c.corrected_ts, c.entity_id);
    run("UPDATE corrections SET status='APPROVED', decided_by=?, decided_at=?, decision_note=? WHERE id=?", user.id, ts, note || null, id);
    event(getVisit(c.visit_id), 'CORRECTION_APPLIED', user, { ts, data: { correction_id: id, kind: c.kind, original: c.original_ts, corrected: c.corrected_ts } });
  }
  function decideCorrection(user, id, approve, note) {
    need(user, 'corrections.approve');
    return tx(db, () => {
      const c = one('SELECT * FROM corrections WHERE id=?', id) || fail(404, 'CORRECTION_NOT_FOUND');
      needVisible(user, c.visit_id);
      if (c.status !== 'PENDING') fail(409, 'ALREADY_DECIDED');
      if (c.requested_by === user.id) fail(403, 'SELF_APPROVAL', 'A different staff member must approve your correction');
      if (approve) applyCorrection(id, user, note);
      else {
        run("UPDATE corrections SET status='REJECTED', decided_by=?, decided_at=?, decision_note=? WHERE id=?", user.id, now(), note || null, id);
        event(getVisit(c.visit_id), 'CORRECTION_REJECTED', user, { data: { correction_id: id, note: note || null } });
      }
      audit(user, approve ? 'correction.approve' : 'correction.reject', 'correction', id, { note: note || null });
      return one('SELECT * FROM corrections WHERE id=?', id);
    });
  }

  return {
    q, one, run, setting, audit, event, need, now, fail,
    sessionIntervals, unionMs, sumMs, visitDurations, sessionView, roomState, visitVisible, needVisible,
    assignRoom, enterRoom, exitRoom, transferRoom, setRoomStatus,
    checkIn, checkOut, callNext, setPriority, queueList,
    sweepTimers, visitTiming, timerOf, treatmentOptions, visitDepartments, startSession, pauseSession, resumeSession, completeSession, activeSessions, authorizedFor,
    timeline, requestCorrection, decideCorrection, locLabel,
  };
}
