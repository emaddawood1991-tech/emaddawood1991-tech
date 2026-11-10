// Account security (stage S2): password policy, change password, sessions, login activity, administrator account tools.
// Passwords are never stored or returned in plaintext; hashing functions are passed in from app.js.
import { PERMS } from './perms.js';
import { ROLE_TEMPLATES, listRoutes } from './roles.js';

const COMMON = new Set(['password', 'password1', 'password123', 'passw0rd', 'p@ssw0rd', 'p@ssword1', 'qwerty123', 'qwertyuiop', '1234567890', '123456789012', 'letmein123', 'welcome123', 'welcome1234',
  'admin123456', 'administrator', 'changeme123', 'iloveyou123', 'abc123456789', 'monkey12345', 'dragon12345', 'football123', 'baseball123', 'sunshine123', 'princess123', 'master12345',
  'demo-passw0rd!', 'demo-passw0rd', 'fmc-patient-flow', 'alfaisal123', 'alfaisal1234', 'idealcare123', 'password!23', 'password@123', 'qwerty@12345', 'abcd1234!@#$']);
const MAX_PW = 128;

/** Returns a human-readable problem with the password, or null when it is acceptable. */
export function passwordProblem(pw, who = {}, minLen = 10) {
  const s = String(pw ?? '');
  if (s.length < minLen) return `Use at least ${minLen} characters.`;
  if (s.length > MAX_PW) return `Use at most ${MAX_PW} characters.`;
  const lower = s.toLowerCase();
  if (COMMON.has(lower)) return 'This password is too common. Choose something only you would know.';
  if (/^(.)\1+$/.test(s) || /^(?:0123456789|1234567890|abcdefghij|qwertyuiop)+/i.test(s.slice(0, 10)) && s.length < 14) return 'This password is too simple (repeated or sequential characters).';
  const user = String(who.username || '').toLowerCase();
  if (user.length >= 3 && lower.includes(user)) return 'The password must not contain the username.';
  for (const tok of String(who.name || '').toLowerCase().split(/[^\p{L}\p{N}]+/u)) if (tok.length >= 4 && lower.includes(tok)) return 'The password must not contain your name.';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(s)).length;
  if (classes < 3 && s.length < 16) return 'Mix at least three of: lowercase, uppercase, digits, symbols — or use a passphrase of 16 or more characters.';
  return null;
}

export function makeAccounts({ db, ops, tx, HttpError, hashPassword, verifyPasswordAsync, sha, randomBytes }) {
  const { q, one, run, setting, audit, now } = ops;
  const minLen = () => Math.max(10, Number(setting('password_min_length')) || 10);
  const ua = (req) => String(req.headers['user-agent'] || '').replace(/[\u0000-\u001f]/g, '').slice(0, 160);

  function loginEvent(userId, event, req, detail = {}) {
    run('INSERT INTO login_events(ts,user_id,event,ip,user_agent,detail) VALUES (?,?,?,?,?,?)', now(), userId ?? null, event, req?.ip ?? null, req ? ua(req) : null, JSON.stringify(detail));
  }
  /** Policy check including the account's own name and username. */
  const problemFor = (userId, pw) => { const u = one('SELECT username,name FROM users WHERE id=?', userId); return passwordProblem(pw, u, minLen()); };

  /** Write a new password (already policy-checked). Ends every session except `keepToken`. */
  function writePassword(userId, newPw, { mustChange, actor, keepToken = null, event = 'PASSWORD_CHANGED' }) {
    const hash = hashPassword(newPw); const ts = now();
    tx(db, () => {
      run('UPDATE users SET pass_hash=?, must_change_password=?, password_changed_at=? WHERE id=?', hash, mustChange ? 1 : 0, ts, userId);
      run('INSERT INTO password_history(user_id,pass_hash,changed_at) VALUES (?,?,?)', userId, hash, ts);
      run('DELETE FROM password_history WHERE user_id=? AND id NOT IN (SELECT id FROM password_history WHERE user_id=? ORDER BY id DESC LIMIT 5)', userId, userId);
      if (keepToken) run('DELETE FROM auth_sessions WHERE user_id=? AND token_hash<>?', userId, keepToken); else run('DELETE FROM auth_sessions WHERE user_id=?', userId);
    });
    audit(actor, event === 'PASSWORD_CHANGED' ? 'account.password.change' : 'account.password.reset', 'user', userId, { sessions_revoked: true, must_change: !!mustChange });
  }
  const ensureSids = () => run("UPDATE auth_sessions SET sid=lower(hex(randomblob(8))) WHERE sid IS NULL");
  const sessionsOf = (userId, currentHash) => { ensureSids(); return q('SELECT sid,created_at,last_seen,ip,user_agent,token_hash FROM auth_sessions WHERE user_id=? ORDER BY last_seen DESC', userId).map(({ token_hash, ...s }) => ({ ...s, current: token_hash === currentHash })); };

  const pwFailures = new Map(); // per-user limit on "current password" guesses from a signed-in session
  function register(app, { guard, cookieOf, setSessionCookie, clearSessionCookie }) {
    app.get('/api/account', guard(), (req, res) => {
      const u = one('SELECT id,username,name,name_ar,role,department_id,last_login_at,password_changed_at,must_change_password FROM users WHERE id=?', req.user.id);
      const tok = cookieOf(req); const cur = tok ? sha(tok) : null;
      res.json({ profile: { ...u, department: u.department_id ? one('SELECT name,name_ar FROM departments WHERE id=?', u.department_id) : null }, policy: { min_length: minLen() },
        sessions: sessionsOf(req.user.id, cur), activity: q('SELECT ts,event,ip,user_agent FROM login_events WHERE user_id=? ORDER BY id DESC LIMIT 20', req.user.id) });
    });

    app.post('/api/account/password', guard(), async (req, res) => {
      const { current_password: cur, new_password: next } = req.body || {};
      const f = {}; const key = req.user.id; const tNow = Date.now();
      let a = pwFailures.get(key); if (!a || tNow - a.t >= 60e3) a = { n: 0, t: tNow };
      if (a.n >= 5) throw new HttpError(429, 'TOO_MANY_ATTEMPTS', 'Too many attempts. Try again in a minute.');
      const u = one('SELECT * FROM users WHERE id=?', req.user.id);
      a.n += 1; a.t = tNow; pwFailures.set(key, a); // counted before hashing so parallel guesses cannot slip through
      if (!(await verifyPasswordAsync(String(cur || ''), u.pass_hash))) { loginEvent(u.id, 'PASSWORD_CHANGE_FAILED', req); throw new HttpError(400, 'VALIDATION', 'The current password is not correct.', { fields: { current_password: 'The current password is not correct.' } }); }
      const prob = problemFor(u.id, next); if (prob) f.new_password = prob;
      else if (await verifyPasswordAsync(String(next), u.pass_hash)) f.new_password = 'Choose a password different from the current one.';
      else for (const h of q('SELECT pass_hash FROM password_history WHERE user_id=? ORDER BY id DESC LIMIT 5', u.id)) if (await verifyPasswordAsync(String(next), h.pass_hash)) { f.new_password = 'You used this password recently. Choose a new one.'; break; }
      if (Object.keys(f).length) throw new HttpError(400, 'VALIDATION', 'Please correct the highlighted fields.', { fields: f });
      pwFailures.delete(key);
      const oldTok = cookieOf(req); const newTok = randomBytes(32).toString('hex'); // new session token: the old one cannot be replayed
      writePassword(u.id, String(next), { mustChange: false, actor: req.user, keepToken: sha(oldTok) });
      run('UPDATE auth_sessions SET token_hash=? WHERE token_hash=?', sha(newTok), sha(oldTok));
      setSessionCookie(res, newTok);
      loginEvent(u.id, 'PASSWORD_CHANGED', req, { other_sessions_ended: true });
      res.json({ ok: true });
    });

    app.post('/api/account/sessions/revoke-others', guard(), (req, res) => {
      const cur = sha(cookieOf(req)); const n = run('DELETE FROM auth_sessions WHERE user_id=? AND token_hash<>?', req.user.id, cur).changes;
      loginEvent(req.user.id, 'SESSIONS_REVOKED', req, { count: Number(n), scope: 'others' }); audit(req.user, 'account.sessions.revoke_others', 'user', req.user.id, { count: Number(n) });
      res.json({ ok: true, revoked: Number(n) });
    });
    app.post('/api/account/sessions/:sid/revoke', guard(), (req, res) => {
      ensureSids(); const s = one('SELECT token_hash FROM auth_sessions WHERE sid=? AND user_id=?', String(req.params.sid), req.user.id);
      if (!s) throw new HttpError(404, 'NOT_FOUND', 'Session not found.');
      const isCurrent = s.token_hash === sha(cookieOf(req));
      run('DELETE FROM auth_sessions WHERE token_hash=?', s.token_hash);
      loginEvent(req.user.id, 'SESSIONS_REVOKED', req, { count: 1, scope: 'one' });
      if (isCurrent) clearSessionCookie(res);
      res.json({ ok: true, signed_out: isCurrent });
    });

    // ---- administrator tools (Settings → Security & Access) ----
    const admin = () => guard('config.manage');
    app.get('/api/security/accounts', admin(), (_req, res) => {
      res.json(q(`SELECT u.id,u.username,u.name,u.name_ar,u.role,u.department_id,u.active,u.last_login_at,u.password_changed_at,u.must_change_password,
        (SELECT COUNT(*) FROM auth_sessions s WHERE s.user_id=u.id) sessions,
        COALESCE((SELECT enabled FROM user_mfa m WHERE m.user_id=u.id),0) mfa_enabled FROM users u ORDER BY u.name`));
    });
    app.get('/api/security/login-activity', admin(), (req, res) => {
      const uid = req.query.user_id ? Number(req.query.user_id) : null; const ev = req.query.event ? String(req.query.event) : null;
      res.json(q(`SELECT e.id,e.ts,e.event,e.ip,e.user_agent,e.detail,u.username,u.name FROM login_events e LEFT JOIN users u ON u.id=e.user_id
        WHERE (? IS NULL OR e.user_id=?) AND (? IS NULL OR e.event=?) ORDER BY e.id DESC LIMIT ?`, uid, uid, ev, ev, Math.min(Number(req.query.limit) || 100, 500)).map((e) => ({ ...e, detail: JSON.parse(e.detail) })));
    });
    app.get('/api/security/permissions', admin(), (_req, res) => res.json({ roles: ['admin', 'supervisor', 'reception', 'clinician'], permissions: PERMS, templates: ROLE_TEMPLATES, endpoints: listRoutes(app),
      note: 'Clinical service authorization is separate: it is granted per clinician and service (Settings → Staff) and administrator status never grants it.' }));
    app.post('/api/security/users/:id/revoke-sessions', admin(), (req, res) => {
      const id = Number(req.params.id); if (!one('SELECT 1 x FROM users WHERE id=?', id)) throw new HttpError(404, 'NOT_FOUND', 'Account not found.');
      const n = Number(run('DELETE FROM auth_sessions WHERE user_id=?', id).changes);
      loginEvent(id, 'SESSIONS_REVOKED', req, { count: n, scope: 'admin', by: req.user.id }); audit(req.user, 'security.sessions.revoke', 'user', id, { count: n });
      res.json({ ok: true, revoked: n });
    });
    app.post('/api/security/users/:id/reset-password', admin(), (req, res) => {
      const id = Number(req.params.id); if (!one('SELECT 1 x FROM users WHERE id=?', id)) throw new HttpError(404, 'NOT_FOUND', 'Account not found.');
      const prob = problemFor(id, req.body?.temporary_password); if (prob) throw new HttpError(400, 'VALIDATION', prob, { fields: { temporary_password: prob } });
      writePassword(id, String(req.body.temporary_password), { mustChange: true, actor: req.user, event: 'PASSWORD_RESET' }); // temporary: the person must choose their own at next sign-in
      loginEvent(id, 'PASSWORD_RESET', req, { by: req.user.id });
      res.json({ ok: true });
    });
    app.post('/api/security/users/:id/username', admin(), (req, res) => {
      const id = Number(req.params.id); const cur = one('SELECT username FROM users WHERE id=?', id); if (!cur) throw new HttpError(404, 'NOT_FOUND', 'Account not found.');
      const nu = String(req.body?.username || '').trim();
      if (!/^[A-Za-z0-9._-]{3,40}$/.test(nu)) throw new HttpError(400, 'VALIDATION', 'Use 3–40 letters, digits, dots, dashes or underscores.', { fields: { username: 'Use 3–40 letters, digits, dots, dashes or underscores.' } });
      if (one('SELECT 1 x FROM users WHERE lower(username)=lower(?) AND id<>?', nu, id)) throw new HttpError(409, 'USERNAME_TAKEN', 'That username is already in use.', { fields: { username: 'That username is already in use.' } });
      run('UPDATE users SET username=? WHERE id=?', nu, id);
      loginEvent(id, 'USERNAME_CHANGED', req, { by: req.user.id }); audit(req.user, 'account.username.change', 'user', id, { from: cur.username, to: nu });
      res.json({ ok: true, username: nu });
    });
  }
  return { loginEvent, problemFor, writePassword, minLen, register };
}
