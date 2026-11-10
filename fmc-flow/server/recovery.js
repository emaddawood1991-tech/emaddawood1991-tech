// Account recovery and emergency access (stage S7).
//  1. Recovery REQUESTS: a person who cannot sign in asks for help from the sign-in page. No e-mail or SMS service is involved (that would be an
//     external integration needing written approval): an administrator verifies identity out of band and issues a temporary password.
//  2. BREAK-GLASS: a department-scoped clinician may, when the administrator has switched it on, open ONE patient outside their department for a
//     short time, READ-ONLY, with a written reason. Every grant raises an alert, is logged, and must be reviewed by an administrator.
import { deptScope } from './perms.js';
import { nowMs } from './ops.js';

export function makeRecovery({ db, ops, privacy, mfa, accounts, HttpError }) {
  const { q, one, run, setting, audit, now, logAccess } = ops;
  const MIN_REASON = 15;
  const enabled = () => String(setting('break_glass_enabled')) === '1';
  const minutes = () => { const n = Number(setting('break_glass_minutes')); return Number.isInteger(n) && n >= 15 && n <= 240 ? n : 60; };
  const active = (userId) => q('SELECT * FROM break_glass_grants WHERE user_id=? AND ended_at IS NULL AND expires_at>? ORDER BY id DESC', userId, now());

  /** Read access to a visit through an active grant for its patient (used by the timeline and documentation readers only). */
  function grantFor(user, visitId) {
    if (!enabled()) return null;
    return one(`SELECT g.* FROM break_glass_grants g JOIN visits v ON v.patient_id=g.patient_id
      WHERE g.user_id=? AND v.id=? AND g.ended_at IS NULL AND g.expires_at>? ORDER BY g.id DESC LIMIT 1`, user.id, visitId, now()) || null;
  }

  function visitsOf(patientId) {
    return q('SELECT id,arrived_at,status FROM visits WHERE patient_id=? ORDER BY id DESC LIMIT 20', patientId).map((v) => ({ ...v,
      sessions: q('SELECT s.id,s.status,sv.name service FROM treatment_sessions s JOIN services sv ON sv.id=s.service_id WHERE s.visit_id=? ORDER BY s.id', v.id) }));
  }

  function register(app, { guard }) {
    const adminOnly = (perm) => guard(perm);
    // ---- 1. recovery requests ----
    app.post('/api/recovery-request', privacy.limiter('recovery', 'rate_recovery_per_hour', 3600e3, 5), (req, res) => {
      if (req.headers['x-requested-with'] !== 'fmc') throw new HttpError(403, 'CSRF', 'Missing request header');
      const username = String(req.body?.username || '').trim().slice(0, 60);
      const generic = { ok: true, message: 'If this account exists, an administrator has been notified and will contact you.' }; // same answer whether or not the account exists
      if (!username) return res.status(202).json(generic);
      const u = one('SELECT id FROM users WHERE username=? AND active=1', username);
      const dup = one("SELECT 1 x FROM recovery_requests WHERE username=? AND status='PENDING' AND ts>?", username, new Date(nowMs() - 3600e3).toISOString());
      if (!dup) {
        run('INSERT INTO recovery_requests(ts,username,user_id,ip) VALUES (?,?,?,?)', now(), username, u?.id ?? null, req.ip ?? null);
        if (u) accounts.loginEvent(u.id, 'RECOVERY_REQUESTED', req, {});
        privacy.raise('RECOVERY_REQUEST', u?.id ?? null, { account: u ? 'known' : 'unknown username' });
      }
      res.status(202).json(generic);
    });
    app.get('/api/security/recovery-requests', adminOnly('config.manage'), (_req, res) => res.json({
      pending: one("SELECT COUNT(*) c FROM recovery_requests WHERE status='PENDING'").c,
      requests: q(`SELECT r.*, u.name, u.name_ar, u.role, h.name handled_by_name FROM recovery_requests r LEFT JOIN users u ON u.id=r.user_id LEFT JOIN users h ON h.id=r.handled_by ORDER BY r.id DESC LIMIT 100`),
    }));
    app.post('/api/security/recovery-requests/:id/resolve', adminOnly('config.manage'), (req, res) => {
      const id = Number(req.params.id); const r = one('SELECT * FROM recovery_requests WHERE id=?', id);
      if (!r) throw new HttpError(404, 'NOT_FOUND', 'Request not found.');
      if (r.status !== 'PENDING') throw new HttpError(409, 'ALREADY_HANDLED', 'This request was already handled.');
      const action = req.body?.action; const note = String(req.body?.note || '').slice(0, 300);
      if (action === 'dismiss') {
        run("UPDATE recovery_requests SET status='DISMISSED', handled_by=?, handled_at=?, note=? WHERE id=?", req.user.id, now(), note, id);
        audit(req.user, 'recovery.dismiss', 'recovery_request', id); return res.json({ ok: true });
      }
      if (action !== 'reset') throw new HttpError(400, 'VALIDATION', 'Choose reset or dismiss.');
      if (!r.user_id) throw new HttpError(400, 'VALIDATION', 'No active account matches this request.');
      const pw = req.body?.temporary_password; const prob = accounts.problemFor(r.user_id, pw);
      if (prob) throw new HttpError(400, 'VALIDATION', prob, { fields: { temporary_password: prob } });
      accounts.writePassword(r.user_id, String(pw), { mustChange: true, actor: req.user, event: 'PASSWORD_RESET' }); // temporary: must be replaced at next sign-in
      run('DELETE FROM auth_sessions WHERE user_id=?', r.user_id);
      if (req.body?.reset_mfa) { mfa.reset(r.user_id); accounts.loginEvent(r.user_id, 'MFA_RESET', req, { by: req.user.id }); }
      accounts.loginEvent(r.user_id, 'PASSWORD_RESET', req, { by: req.user.id, via: 'recovery_request' });
      run("UPDATE recovery_requests SET status='DONE', handled_by=?, handled_at=?, note=? WHERE id=?", req.user.id, now(), note, id);
      audit(req.user, 'recovery.reset', 'recovery_request', id, { user: r.user_id, mfa_reset: !!req.body?.reset_mfa });
      res.json({ ok: true });
    });

    // ---- 2. break-glass ----
    app.get('/api/break-glass/mine', guard('breakglass.use'), (req, res) => res.json({ enabled: enabled(), minutes: minutes(), scoped: deptScope(req.user) != null,
      grants: q('SELECT g.id,g.patient_id,g.reason,g.granted_at,g.expires_at,g.ended_at,p.mrn FROM break_glass_grants g JOIN patients p ON p.id=g.patient_id WHERE g.user_id=? ORDER BY g.id DESC LIMIT 20', req.user.id)
        .map((g) => ({ ...g, active: !g.ended_at && g.expires_at > now() })) }));
    app.post('/api/break-glass', guard('breakglass.use'), (req, res) => {
      if (!enabled()) throw new HttpError(403, 'BREAK_GLASS_DISABLED', 'Emergency access is switched off. An administrator can enable it in Security & Access.');
      if (deptScope(req.user) == null) throw new HttpError(400, 'NOT_NEEDED', 'You already have access to every department.');
      const reason = String(req.body?.reason || '').trim();
      if (reason.length < MIN_REASON) throw new HttpError(400, 'VALIDATION', `Write the reason for emergency access (at least ${MIN_REASON} characters).`, { fields: { reason: `At least ${MIN_REASON} characters.` } });
      if (reason.length > 500) throw new HttpError(400, 'VALIDATION', 'Reason is limited to 500 characters.', { fields: { reason: 'Up to 500 characters.' } });
      const key = String(req.body?.mrn || '').trim();
      const p = (req.body?.patient_id && one('SELECT id,mrn FROM patients WHERE id=?', Number(req.body.patient_id))) || (key && one('SELECT id,mrn FROM patients WHERE mrn=?', key));
      if (!p) throw new HttpError(404, 'NOT_FOUND', 'No patient with that exact EMR number.', { fields: { mrn: 'No patient with that exact EMR number.' } });
      if (active(req.user.id).length >= 3) throw new HttpError(409, 'TOO_MANY', 'You already have three active emergency accesses. End one first.');
      let g = active(req.user.id).find((x) => x.patient_id === p.id);
      if (!g) {
        const exp = new Date(nowMs() + minutes() * 60e3).toISOString();
        const gid = Number(run('INSERT INTO break_glass_grants(user_id,patient_id,reason,granted_at,expires_at) VALUES (?,?,?,?,?)', req.user.id, p.id, reason, now(), exp).lastInsertRowid);
        run('INSERT INTO security_alerts(ts,kind,severity,user_id,detail) VALUES (?,?,?,?,?)', now(), 'BREAK_GLASS_USED', 'CRITICAL', req.user.id, JSON.stringify({ grant: gid, patient_mrn: p.mrn, minutes: minutes() }));
        audit(req.user, 'breakglass.grant', 'patient', p.id, { grant: gid, reason });
        logAccess(req.user, [p.id], 'BREAK_GLASS', { dedupe: false, detail: { grant: gid } });
        g = one('SELECT * FROM break_glass_grants WHERE id=?', gid);
      }
      res.status(201).json({ grant: g, visits: visitsOf(p.id) });
    });
    app.post('/api/break-glass/:id/end', guard('breakglass.use'), (req, res) => {
      const g = one('SELECT * FROM break_glass_grants WHERE id=? AND user_id=?', Number(req.params.id), req.user.id);
      if (!g) throw new HttpError(404, 'NOT_FOUND', 'Emergency access not found.');
      if (!g.ended_at) { run('UPDATE break_glass_grants SET ended_at=? WHERE id=?', now(), g.id); audit(req.user, 'breakglass.end', 'patient', g.patient_id, { grant: g.id }); }
      res.json({ ok: true });
    });
    app.get('/api/break-glass/:id/visits', guard('breakglass.use'), (req, res) => {
      const g = one('SELECT * FROM break_glass_grants WHERE id=? AND user_id=? AND ended_at IS NULL AND expires_at>?', Number(req.params.id), req.user.id, now());
      if (!g || !enabled()) throw new HttpError(403, 'FORBIDDEN', 'This emergency access is not active.');
      res.json({ visits: visitsOf(g.patient_id) });
    });
    app.get('/api/security/break-glass', adminOnly('breakglass.review'), (_req, res) => res.json({ enabled: enabled(), minutes: minutes(),
      unreviewed: one('SELECT COUNT(*) c FROM break_glass_grants WHERE reviewed_at IS NULL').c,
      grants: q(`SELECT g.*, u.name user_name, u.username, p.mrn, p.name patient_name, r.name reviewer FROM break_glass_grants g JOIN users u ON u.id=g.user_id JOIN patients p ON p.id=g.patient_id LEFT JOIN users r ON r.id=g.reviewed_by ORDER BY g.id DESC LIMIT 100`) }));
    app.post('/api/security/break-glass/:id/review', adminOnly('breakglass.review'), (req, res) => {
      const g = one('SELECT * FROM break_glass_grants WHERE id=?', Number(req.params.id)); if (!g) throw new HttpError(404, 'NOT_FOUND', 'Emergency access not found.');
      if (g.reviewed_at) throw new HttpError(409, 'ALREADY_REVIEWED', 'Already reviewed.');
      const outcome = req.body?.outcome; const note = String(req.body?.note || '').trim();
      if (!['JUSTIFIED', 'NOT_JUSTIFIED'].includes(outcome)) throw new HttpError(400, 'VALIDATION', 'Choose justified or not justified.');
      if (note.length < 3) throw new HttpError(400, 'VALIDATION', 'Add a short review note.', { fields: { note: 'Required.' } });
      run('UPDATE break_glass_grants SET reviewed_by=?, reviewed_at=?, review_note=?, outcome=? WHERE id=?', req.user.id, now(), note.slice(0, 300), outcome, g.id);
      audit(req.user, 'breakglass.review', 'patient', g.patient_id, { grant: g.id, outcome });
      res.json({ ok: true });
    });
  }
  return { register, grantFor, enabled };
}
