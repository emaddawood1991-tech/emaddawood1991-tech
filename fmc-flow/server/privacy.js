// Privacy and monitoring (stage S4): rate limits, patient-access reports, audit-chain verification, security alerts.
import { nowMs } from './ops.js';
import { verifyChain } from './auditchain.js';
import { localOf } from './schedule.js';

export function makePrivacy({ db, ops, HttpError }) {
  const { q, one, run, setting, audit, now } = ops;

  // ---------- rate limiting (per signed-in person, else per address) ----------
  const buckets = new Map();
  function limiter(name, settingKey, windowMs, fallback) {
    return (req, _res, next) => {
      const limit = Number(setting(settingKey)); const max = Number.isFinite(limit) && limit >= 0 ? limit : fallback;
      if (max === 0) return next();
      const key = `${name}|${req.user?.id ?? req.ip}`; const t = nowMs(); let b = buckets.get(key);
      if (!b || t - b.t >= windowMs) { if (buckets.size > 20000) buckets.clear(); b = { n: 0, t, logged: false }; buckets.set(key, b); }
      b.n += 1;
      if (b.n > max) {
        const secs = Math.max(1, Math.ceil((b.t + windowMs - t) / 1000));
        if (!b.logged) { b.logged = true; audit(req.user ?? null, 'rate.limited', 'api', null, { limit: name, per_ms: windowMs }); }
        _res.set('Retry-After', String(secs));
        return next(new HttpError(429, 'RATE_LIMITED', `Too many requests. Try again in ${secs} s.`));
      }
      next();
    };
  }

  // ---------- security alerts ----------
  const raise = (kind, userId, detail, severity = 'WARNING') => {
    const dup = one("SELECT 1 x FROM security_alerts WHERE kind=? AND COALESCE(user_id,0)=COALESCE(?,0) AND status='OPEN' AND ts>?", kind, userId ?? null, new Date(nowMs() - 60 * 60e3).toISOString());
    if (dup) return 0;
    run('INSERT INTO security_alerts(ts,kind,severity,user_id,detail) VALUES (?,?,?,?,?)', now(), kind, severity, userId ?? null, JSON.stringify(detail));
    return 1;
  };
  /** Only events newer than the last alert of this kind for this person count, so acknowledging an alert does not immediately re-raise it from the same events. */
  const since = (kind, userId, base) => { const last = one('SELECT MAX(ts) t FROM security_alerts WHERE kind=? AND COALESCE(user_id,0)=COALESCE(?,0)', kind, userId ?? null)?.t; return last && last > base ? last : base; };
  let lastLoginEvent = one('SELECT COALESCE(MAX(id),0) m FROM login_events').m;
  let lastAnchorAt = 0;
  function anchor() {
    const v = verifyChain(db); if (!v.head) return v;
    const last = one('SELECT head FROM audit_anchors ORDER BY id DESC LIMIT 1');
    if (v.ok && last?.head !== v.head) run('INSERT INTO audit_anchors(ts,row_count,head) VALUES (?,?,?)', now(), v.rows, v.head);
    return v;
  }
  /** Evaluates the monitoring rules. Safe to call as often as you like; alerts are de-duplicated for an hour. */
  function monitor() {
    let created = 0; const t = nowMs(); const since10 = new Date(t - 10 * 60e3).toISOString(); const sinceH = new Date(t - 60 * 60e3).toISOString();
    const failThr = Number(setting('alert_failed_logins')) || 5;
    for (const u of q("SELECT DISTINCT user_id FROM login_events WHERE event IN ('LOGIN_FAILED','LOGIN_BLOCKED') AND ts>=?", since10)) {
      const c = one("SELECT COUNT(*) c FROM login_events WHERE event IN ('LOGIN_FAILED','LOGIN_BLOCKED') AND COALESCE(user_id,0)=COALESCE(?,0) AND ts>?", u.user_id, since('REPEATED_FAILED_LOGINS', u.user_id, since10)).c;
      if (c >= failThr) created += raise('REPEATED_FAILED_LOGINS', u.user_id, { count: c, window_minutes: 10, account: u.user_id ? 'known' : 'unknown usernames' });
    }
    const rowsThr = Number(setting('alert_export_rows')) || 500; const byUser = new Map();
    for (const e of q("SELECT actor_id, detail FROM audit_log WHERE action='reports.export' AND ts>=? AND ts>COALESCE((SELECT MAX(ts) FROM security_alerts WHERE kind='MASS_EXPORT' AND COALESCE(user_id,0)=COALESCE(actor_id,0)),'')", sinceH)) { const d = JSON.parse(e.detail); const a = byUser.get(e.actor_id) ?? { n: 0, rows: 0 }; a.n += 1; a.rows += Number(d.rows) || 0; byUser.set(e.actor_id, a); }
    for (const [uid, a] of byUser) if (a.n >= 3 || a.rows >= rowsThr) created += raise('MASS_EXPORT', uid, { exports: a.n, rows: a.rows, window_minutes: 60 });
    const srchThr = Number(setting('alert_search_patients')) || 60;
    for (const a of q("SELECT DISTINCT actor_id FROM patient_access_log WHERE kind='SEARCH' AND ts>=?", since10)) {
      const c = one("SELECT COUNT(DISTINCT patient_id) c FROM patient_access_log WHERE kind='SEARCH' AND actor_id=? AND ts>?", a.actor_id, since('MANY_PATIENTS_BROWSED', a.actor_id, since10)).c;
      if (c >= srchThr) created += raise('MANY_PATIENTS_BROWSED', a.actor_id, { patients: c, window_minutes: 10 });
    }
    const [from, to] = String(setting('alert_office_hours') || '06:00-23:00').split('-');
    for (const e of q("SELECT e.id,e.ts,e.user_id,u.role FROM login_events e JOIN users u ON u.id=e.user_id WHERE e.event='LOGIN_OK' AND e.id>? ORDER BY e.id", lastLoginEvent)) {
      lastLoginEvent = e.id;
      if (!['admin', 'supervisor'].includes(e.role)) continue;
      const hhmm = localOf(e.ts, setting('timezone') || 'Asia/Dubai').time;
      if (hhmm < from || hhmm >= to) created += raise('OFF_HOURS_PRIVILEGED_LOGIN', e.user_id, { local_time: hhmm, allowed: `${from}-${to}` });
    }
    const v = verifyChain(db);
    if (!v.ok) created += raise('AUDIT_CHAIN_BROKEN', null, { problems: v.problems.slice(0, 5), total: v.problem_count }, 'CRITICAL');
    else if (t - lastAnchorAt > 10 * 60e3) { lastAnchorAt = t; anchor(); }
    return created;
  }
  const openAlerts = () => one("SELECT COUNT(*) c FROM security_alerts WHERE status='OPEN'").c;

  function register(app, { guard }) {
    const admin = () => guard('config.manage');
    app.get('/api/security/access-log', admin(), (req, res) => {
      const pid = req.query.patient_id ? Number(req.query.patient_id) : null; const uid = req.query.user_id ? Number(req.query.user_id) : null; const kind = req.query.kind ? String(req.query.kind) : null;
      res.json(q(`SELECT a.id,a.ts,a.kind,a.actor_id,u.name actor,u.username,a.patient_id,p.mrn,p.name patient_name FROM patient_access_log a LEFT JOIN users u ON u.id=a.actor_id JOIN patients p ON p.id=a.patient_id
        WHERE (? IS NULL OR a.patient_id=?) AND (? IS NULL OR a.actor_id=?) AND (? IS NULL OR a.kind=?) ORDER BY a.id DESC LIMIT ?`, pid, pid, uid, uid, kind, kind, Math.min(Number(req.query.limit) || 200, 1000)));
      audit(req.user, 'security.access_log.view', 'patient', pid, { by_user: !!uid });
    });
    app.get('/api/security/alerts', admin(), (req, res) => {
      monitor();
      const st = req.query.status === 'all' ? null : 'OPEN';
      res.json({ open: openAlerts(), alerts: q(`SELECT a.*, u.name user_name, u.username FROM security_alerts a LEFT JOIN users u ON u.id=a.user_id WHERE (? IS NULL OR a.status=?) ORDER BY a.id DESC LIMIT 200`, st, st).map((a) => ({ ...a, detail: JSON.parse(a.detail) })) });
    });
    app.get('/api/security/alerts/summary', admin(), (_req, res) => res.json({ open: openAlerts() }));
    app.post('/api/security/alerts/:id/ack', admin(), (req, res) => {
      const id = Number(req.params.id); if (!one('SELECT 1 x FROM security_alerts WHERE id=?', id)) throw new HttpError(404, 'NOT_FOUND', 'Alert not found.');
      run("UPDATE security_alerts SET status='ACKNOWLEDGED', ack_by=?, ack_at=? WHERE id=?", req.user.id, now(), id); audit(req.user, 'security.alert.ack', 'alert', id);
      res.json({ ok: true, open: openAlerts() });
    });
    app.get('/api/security/audit-chain', guard('audit.view'), (req, res) => { const v = anchor(); audit(req.user, 'security.audit_chain.verify', 'audit', null, { ok: v.ok }); res.json({ ...v, anchors: one('SELECT COUNT(*) c FROM audit_anchors').c }); });
  }
  return { limiter, monitor, anchor, openAlerts, register, raise };
}
