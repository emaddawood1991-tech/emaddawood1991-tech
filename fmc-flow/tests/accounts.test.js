// Account security (stage S2): password policy, change password, forced change, sessions, login activity, administrator tools.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';
import { openDb } from '../server/db.js';
import { seed, DEMO_PASSWORD } from '../server/seed.js';
import { passwordProblem } from '../server/accounts.js';
import { clock } from '../server/ops.js';

let t, admin, rec, pt1;
const STRONG = 'Violet-Harbor-42!';
const raw = async (username, password = DEMO_PASSWORD, extra = {}) => {
  const r = await fetch(`${t.base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'FMC-test-browser/1.0', ...extra }, body: JSON.stringify({ username, password }) });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0]; const body = await r.json().catch(() => null);
  const call = async (method, path, data) => { const x = await fetch(t.base + path, { method, headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc', cookie }, body: data ? JSON.stringify(data) : undefined }); let j = null; try { j = await x.json(); } catch { /* none */ } return { status: x.status, body: j, headers: x.headers }; };
  return { status: r.status, body, cookie, setCookie: r.headers.get('set-cookie'), get: (p) => call('GET', p), post: (p, d) => call('POST', p, d || {}), patch: (p, d) => call('PATCH', p, d || {}) };
};
let n = 0;
const makeUser = async (role = 'reception', password = 'Temporary-Pass-77!') => {
  const username = `acct.user${++n}`; const r = await admin.post('/api/config/staff', { username, name: `Account Test ${n}`, role, password }); assert.equal(r.status, 201, JSON.stringify(r.body)); return { username, id: r.body.id, password };
};
const lastEvents = (uid) => t.ops.q('SELECT event, ip, user_agent, detail FROM login_events WHERE user_id=? ORDER BY id', uid);

before(async () => { t = await boot(); [admin, rec, pt1] = await Promise.all(['admin', 'reception', 'pt.one'].map(t.login)); });
after(() => t.close());

test('S2-1 password policy: length, common passwords, repeats, username/name, character mix; passphrases are fine', () => {
  const who = { username: 'sara.ali', name: 'Sara Ali Hassan' };
  const bad = ['short1A!', 'aaaaaaaaaa', 'Demo-Passw0rd!', 'password123', 'xxsara.alixx9A!', 'Hassan-Rocks-2026', 'lowercaseonly1', 'ALLUPPER12'];
  for (const pw of bad) assert.ok(passwordProblem(pw, who, 10), `rejected: ${pw}`);
  for (const pw of ['Violet-Harbor-42!', 'correct horse battery staple', 'Tr4in-Lamp-Orchid']) assert.equal(passwordProblem(pw, who, 10), null, `accepted: ${pw}`);
  assert.ok(passwordProblem('Violet-Harbor-42!', who, 20), 'the configured minimum length applies');
});

test('S2-2 new accounts must choose their own password; until then only the change-password screen works', async () => {
  const weak = await admin.post('/api/config/staff', { username: 'weak.one', name: 'Weak One', role: 'reception', password: 'aaaaaaaaaa' });
  assert.equal(weak.status, 400); assert.equal(weak.body.error.code, 'WEAK_PASSWORD');
  const u = await makeUser(); const s = await raw(u.username, u.password);
  assert.equal(s.status, 200); assert.equal(s.body.user.must_change_password, 1);
  assert.equal((await s.get('/api/me')).status, 200);
  for (const p of ['/api/patients?q=Sample', '/api/queue', '/api/schedule/board', '/api/config']) { const r = await s.get(p); assert.equal(r.status, 403, p); assert.equal(r.body.error.code, 'PASSWORD_CHANGE_REQUIRED'); }
  const ok = await s.post('/api/account/password', { current_password: u.password, new_password: STRONG }); assert.equal(ok.status, 200);
  const s2 = await raw(u.username, STRONG); assert.equal(s2.body.user.must_change_password, 0);
  assert.equal((await s2.get('/api/patients?q=Sample')).status, 200, 'normal access after choosing a password');
  assert.equal((await raw(u.username, u.password)).status, 401, 'the temporary password no longer works');
});

test('S2-3 change password: current password required, policy enforced, reuse refused, other sessions ended, token rotated', async () => {
  const u = await makeUser(); const a = await raw(u.username, u.password); await a.post('/api/account/password', { current_password: u.password, new_password: STRONG });
  const s1 = await raw(u.username, STRONG); const s2 = await raw(u.username, STRONG); const s3 = await raw(u.username, STRONG);
  assert.equal((await s1.post('/api/account/password', { current_password: 'wrong-current-pw', new_password: 'Another-Fresh-Pass-9!' })).status, 400);
  const weak = await s1.post('/api/account/password', { current_password: STRONG, new_password: 'aaaaaaaaaa' }); assert.equal(weak.status, 400); assert.ok(weak.body.error.fields.new_password);
  assert.equal((await s1.post('/api/account/password', { current_password: STRONG, new_password: STRONG })).status, 400, 'must differ');
  const NEW = 'Maple-Canyon-88?';
  const ok = await s1.post('/api/account/password', { current_password: STRONG, new_password: NEW }); assert.equal(ok.status, 200);
  const newCookie = ok.headers.get('set-cookie').split(';')[0];
  assert.notEqual(newCookie, s1.cookie, 'the session token is replaced');
  assert.equal((await s1.get('/api/me')).status, 401, 'the old token cannot be replayed');
  assert.equal((await s2.get('/api/me')).status, 401); assert.equal((await s3.get('/api/me')).status, 401, 'every other session was ended');
  const me = await fetch(`${t.base}/api/me`, { headers: { cookie: newCookie } }); assert.equal(me.status, 200, 'the rotated session works');
  assert.equal((await raw(u.username, STRONG)).status, 401); assert.equal((await raw(u.username, NEW)).status, 200);
  const again = await raw(u.username, NEW); const reuse = await again.post('/api/account/password', { current_password: NEW, new_password: STRONG });
  assert.equal(reuse.status, 400); assert.match(reuse.body.error.fields.new_password, /recently/);
});

test('S2-4 guessing the current password is rate limited per account', async () => {
  const u = await makeUser(); const a = await raw(u.username, u.password); await a.post('/api/account/password', { current_password: u.password, new_password: STRONG });
  const s = await raw(u.username, STRONG);
  const codes = await Promise.all(Array.from({ length: 9 }, () => s.post('/api/account/password', { current_password: 'guess-guess-guess', new_password: 'Another-Fresh-Pass-9!' }).then((r) => r.status)));
  assert.equal(codes.filter((c) => c === 400).length, 5, codes.join(',')); assert.equal(codes.filter((c) => c === 429).length, 4);
});

test('S2-5 administrator reset is temporary, ends sessions and is policy-checked; only administrators can do it', async () => {
  const u = await makeUser(); const a = await raw(u.username, u.password); await a.post('/api/account/password', { current_password: u.password, new_password: STRONG });
  const live = await raw(u.username, STRONG);
  assert.equal((await rec.post(`/api/security/users/${u.id}/reset-password`, { temporary_password: 'Tmp-Reset-Pass-31!' })).status, 403);
  assert.equal((await admin.post(`/api/security/users/${u.id}/reset-password`, { temporary_password: 'aaaaaaaaaa' })).status, 400);
  assert.equal((await admin.post(`/api/security/users/${u.id}/reset-password`, { temporary_password: 'Tmp-Reset-Pass-31!' })).status, 200);
  assert.equal((await live.get('/api/me')).status, 401, 'existing sessions end');
  const again = await raw(u.username, 'Tmp-Reset-Pass-31!'); assert.equal(again.body.user.must_change_password, 1, 'the person must choose their own');
  assert.equal((await raw(u.username, STRONG)).status, 401);
  // the older settings route goes through the same checks
  const viaStaff = await admin.patch(`/api/config/staff/${u.id}`, { password: 'password123' }); assert.equal(viaStaff.status, 400);
});

test('S2-6 sessions: list with the current one marked, sign out one or all others, never someone else’s', async () => {
  const u = await makeUser(); const a = await raw(u.username, u.password); await a.post('/api/account/password', { current_password: u.password, new_password: STRONG });
  const s1 = await raw(u.username, STRONG); const s2 = await raw(u.username, STRONG);
  const info = (await s1.get('/api/account')).body;
  assert.ok(info.sessions.length >= 2); assert.equal(info.sessions.filter((x) => x.current).length, 1);
  assert.ok(info.sessions.every((x) => x.sid && x.created_at && x.last_seen && /FMC-test-browser/.test(x.user_agent)), 'time, address and device are shown');
  assert.ok(info.sessions.every((x) => x.token_hash === undefined), 'session secrets are never returned');
  const other = info.sessions.find((x) => !x.current);
  assert.equal((await pt1.post(`/api/account/sessions/${other.sid}/revoke`)).status, 404, 'cannot touch another user’s session');
  assert.equal((await s1.post(`/api/account/sessions/${other.sid}/revoke`)).status, 200); assert.equal((await s2.get('/api/me')).status, 401);
  const s3 = await raw(u.username, STRONG); const s4 = await raw(u.username, STRONG);
  const r = await s3.post('/api/account/sessions/revoke-others'); assert.equal(r.status, 200); assert.ok(r.body.revoked >= 2);
  assert.equal((await s3.get('/api/me')).status, 200); assert.equal((await s4.get('/api/me')).status, 401); assert.equal((await s1.get('/api/me')).status, 401);
  // administrator can end all of a user's sessions
  assert.equal((await admin.post(`/api/security/users/${u.id}/revoke-sessions`)).status, 200); assert.equal((await s3.get('/api/me')).status, 401);
  assert.equal((await pt1.post(`/api/security/users/${u.id}/revoke-sessions`)).status, 403);
});

test('S2-7 concurrent sessions are capped (oldest signed out) and the cap is a setting', async () => {
  const u = await makeUser(); const a = await raw(u.username, u.password); await a.post('/api/account/password', { current_password: u.password, new_password: STRONG });
  assert.equal((await admin.patch('/api/config/settings', { max_concurrent_sessions: 2 })).status, 200);
  const x = await raw(u.username, STRONG), y = await raw(u.username, STRONG), z = await raw(u.username, STRONG);
  assert.equal((await x.get('/api/me')).status, 401, 'the oldest was signed out'); assert.equal((await y.get('/api/me')).status, 200); assert.equal((await z.get('/api/me')).status, 200);
  assert.ok(lastEvents(u.id).some((e) => e.event === 'SESSIONS_REVOKED' && JSON.parse(e.detail).scope === 'concurrent_limit'));
  assert.equal((await admin.patch('/api/config/settings', { max_concurrent_sessions: 0 })).status, 200, '0 means unlimited');
  assert.equal((await admin.patch('/api/config/settings', { max_concurrent_sessions: 99 })).status, 400);
  await admin.patch('/api/config/settings', { max_concurrent_sessions: 3 });
});

test('S2-8 login activity records sign-ins, failures, sign-outs and password changes without secrets; administrators read all, users their own', async () => {
  const u = await makeUser(); const a = await raw(u.username, u.password); await a.post('/api/account/password', { current_password: u.password, new_password: STRONG });
  await raw(u.username, 'not-the-password-1'); const s = await raw(u.username, STRONG, { 'user-agent': 'FMC-device-2' }); await s.post('/api/logout');
  const ev = lastEvents(u.id).map((e) => e.event);
  for (const e of ['LOGIN_OK', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED']) assert.ok(ev.includes(e), e);
  const all = JSON.stringify(t.ops.q('SELECT * FROM login_events')) + JSON.stringify(t.ops.q('SELECT detail FROM audit_log'));
  for (const secret of [u.password, STRONG, 'not-the-password-1']) assert.ok(!all.includes(secret), 'no password text is stored');
  const adminView = await admin.get(`/api/security/login-activity?user_id=${u.id}`); assert.equal(adminView.status, 200); assert.ok(adminView.body.length >= 4 && adminView.body.every((e) => e.ip !== undefined));
  assert.equal((await admin.get('/api/security/login-activity?event=LOGIN_FAILED')).body.every((e) => e.event === 'LOGIN_FAILED'), true);
  assert.equal((await rec.get('/api/security/login-activity')).status, 403);
  const mine = await (await raw(u.username, STRONG)).get('/api/account'); assert.ok(mine.body.activity.length >= 3 && mine.body.profile.last_login_at);
  assert.throws(() => t.ops.run('DELETE FROM login_events'), 'append-only'); assert.throws(() => t.ops.run("UPDATE login_events SET event='X'"));
});

test('S2-9 username management is administrator-only, validated, unique and audited', async () => {
  const u = await makeUser();
  assert.equal((await rec.post(`/api/security/users/${u.id}/username`, { username: 'someone.else' })).status, 403);
  assert.equal((await admin.post(`/api/security/users/${u.id}/username`, { username: 'x y' })).status, 400);
  assert.equal((await admin.post(`/api/security/users/${u.id}/username`, { username: 'PT.ONE' })).status, 409, 'case-insensitive uniqueness');
  const ok = await admin.post(`/api/security/users/${u.id}/username`, { username: `renamed.${n}` }); assert.equal(ok.status, 200);
  assert.equal((await raw(`renamed.${n}`, u.password)).status, 200); assert.equal((await raw(u.username, u.password)).status, 401);
  assert.ok(t.ops.q("SELECT detail FROM audit_log WHERE action='account.username.change'").some((r) => r.detail.includes(`renamed.${n}`)));
});

test('S2-10 administrator views: account overview, roles and permissions matrix; other roles are refused', async () => {
  const acc = (await admin.get('/api/security/accounts')).body; assert.ok(acc.length >= 10 && acc[0].last_login_at !== undefined && acc.every((x) => x.pass_hash === undefined));
  const perms = (await admin.get('/api/security/permissions')).body; assert.ok(perms.permissions['config.manage'].includes('admin') && !perms.permissions['config.manage'].includes('clinician')); assert.match(perms.note, /never grants/);
  for (const p of ['/api/security/accounts', '/api/security/permissions', '/api/security/login-activity']) { assert.equal((await rec.get(p)).status, 403, p); assert.equal((await pt1.get(p)).status, 403, p); }
});

test('S2-11 seeding with SEED_FORCE_CHANGE=1 makes every seeded account choose its own password', () => {
  process.env.SEED_FORCE_CHANGE = '1'; const db = openDb(':memory:'); seed(db); delete process.env.SEED_FORCE_CHANGE;
  assert.equal(db.prepare('SELECT COUNT(*) c FROM users WHERE must_change_password=0').get().c, 0);
  const db2 = openDb(':memory:'); seed(db2); assert.equal(db2.prepare('SELECT COUNT(*) c FROM users WHERE must_change_password=1').get().c, 0, 'default demo seeding is unchanged');
});

test('S2-12 session cookie follows the absolute lifetime setting, and a session ends at that limit even while active', async () => {
  assert.equal((await admin.patch('/api/config/settings', { session_absolute_hours: 0 })).status, 400); assert.equal((await admin.patch('/api/config/settings', { session_absolute_hours: 100 })).status, 400);
  assert.equal((await admin.patch('/api/config/settings', { session_absolute_hours: 2 })).status, 200);
  const s = await raw('reception'); assert.match(s.setCookie, /Max-Age=7200/);
  clock.advance(60 * 60e3); assert.equal((await s.get('/api/me')).status, 200, 'still valid within the limit (and it keeps being used)');
  clock.advance(65 * 60e3); assert.equal((await s.get('/api/me')).status, 401, 'ended at the absolute limit although it was used recently');
});
