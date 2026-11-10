// Multi-factor authentication (stage S3): TOTP enrolment, two-step sign-in, recovery codes, required roles, administrator reset.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as OTPAuth from 'otpauth';
import { boot } from './helpers.js';
import { clock, nowMs } from '../server/ops.js';

let t, admin, rec;
const STRONG = 'Violet-Harbor-42!';
const totp = (secret, offset = 0) => new OTPAuth.TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) }).generate({ timestamp: nowMs() + offset });
const mk = (cookie) => { const call = async (method, path, data) => { const x = await fetch(t.base + path, { method, headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc', ...(cookie ? { cookie } : {}) }, body: data ? JSON.stringify(data) : undefined }); let j = null; try { j = await x.json(); } catch { /* none */ } return { status: x.status, body: j, headers: x.headers }; }; return { cookie, get: (p) => call('GET', p), post: (p, d) => call('POST', p, d || {}), patch: (p, d) => call('PATCH', p, d || {}) }; };
const post = async (path, body, cookie) => mk(cookie).post(path, body);
const login = async (username, password = STRONG) => { const r = await fetch(`${t.base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) }); const cookie = (r.headers.get('set-cookie') || '').split(';')[0]; const body = await r.json().catch(() => null); return { status: r.status, body, cookie, ...mk(cookie) }; };
let n = 0;
/** An account that has already chosen its own password. */
async function person(role = 'reception') {
  const username = `mfa.user${++n}`; const r = await admin.post('/api/config/staff', { username, name: `Mfa Test ${n}`, role, password: 'Temporary-Pass-77!' }); assert.equal(r.status, 201);
  const f = await login(username, 'Temporary-Pass-77!'); assert.equal((await f.post('/api/account/password', { current_password: 'Temporary-Pass-77!', new_password: STRONG })).status, 200);
  return { username, id: r.body.id };
}
/** Enrol an authenticator for a person; returns the secret and recovery codes. */
async function enrol(u) {
  const s = await login(u.username); const st = await s.post('/api/mfa/setup'); assert.equal(st.status, 200, JSON.stringify(st.body));
  clock.advance(31000); // a fresh time step for the confirmation code
  const ok = await s.post('/api/mfa/confirm', { code: totp(st.body.secret) }); assert.equal(ok.status, 200, JSON.stringify(ok.body));
  clock.advance(31000);
  return { secret: st.body.secret, codes: ok.body.recovery_codes };
}
const challenge = async (u) => { const r = await login(u.username); assert.equal(r.status, 200); assert.equal(r.body.mfa_required, true); return r.body.mfa_token; };

before(async () => { t = await boot(); [admin, rec] = await Promise.all(['admin', 'reception'].map(t.login)); });
after(() => t.close());

test('S3-1 enrolment: secret is shown once for the app, stored encrypted; recovery codes are shown once and stored only as hashes', async () => {
  const u = await person(); const s = await login(u.username);
  assert.equal((await s.get('/api/mfa/status')).body.enabled, false);
  const st = await s.post('/api/mfa/setup'); assert.equal(st.status, 200);
  assert.match(st.body.uri, /^otpauth:\/\/totp\/.+secret=/); assert.match(st.body.qr_svg, /<svg/); assert.match(st.body.secret, /^[A-Z2-7]{32}$/);
  const row = t.ops.one('SELECT * FROM user_mfa WHERE user_id=?', u.id);
  assert.equal(row.enabled, 0); assert.ok(!row.secret_enc.includes(st.body.secret), 'the secret is not stored in plaintext'); assert.equal(row.secret_enc.split('.').length, 3, 'iv.tag.ciphertext');
  const bad = await s.post('/api/mfa/confirm', { code: '000000' }); assert.equal(bad.status, 400);
  assert.equal((await s.get('/api/mfa/status')).body.enabled, false, 'not on until a correct code is entered');
  const ok = await s.post('/api/mfa/confirm', { code: totp(st.body.secret) }); assert.equal(ok.status, 200);
  assert.equal(ok.body.recovery_codes.length, 10); assert.ok(ok.body.recovery_codes.every((c) => /^[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(c)));
  const all = JSON.stringify(t.ops.q('SELECT * FROM mfa_recovery_codes')); for (const c of ok.body.recovery_codes) assert.ok(!all.includes(c) && !all.includes(c.replace('-', '')), 'only hashes are stored');
  const status = (await s.get('/api/mfa/status')).body; assert.equal(status.enabled, true); assert.equal(status.recovery_codes_remaining, 10);
  assert.equal((await s.post('/api/mfa/setup')).status, 409, 'cannot restart while on');
});

test('S3-2 two-step sign-in: the password alone gives no session; a wrong code fails; a correct code signs in; a code works only once', async () => {
  const u = await person(); const { secret } = await enrol(u);
  const r = await fetch(`${t.base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: u.username, password: STRONG }) });
  assert.equal(r.headers.get('set-cookie'), null, 'no session cookie after the password step'); const b = await r.json(); assert.equal(b.mfa_required, true); assert.equal(b.user, undefined);
  assert.equal((await mk('fmc_sid=guess').get('/api/me')).status, 401);
  assert.equal((await post('/api/login/mfa', { mfa_token: 'x'.repeat(48), code: '123456' })).status, 401, 'unknown challenge');
  assert.equal((await post('/api/login/mfa', { mfa_token: b.mfa_token, code: '000000' })).status, 401);
  const code = totp(secret); const ok = await fetch(`${t.base}/api/login/mfa`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mfa_token: b.mfa_token, code }) });
  assert.equal(ok.status, 200); const cookie = ok.headers.get('set-cookie').split(';')[0]; assert.equal((await mk(cookie).get('/api/me')).status, 200);
  const again = await challenge(u); assert.equal((await post('/api/login/mfa', { mfa_token: again, code })).status, 401, 'the same code cannot be replayed');
  clock.advance(31000); assert.equal((await post('/api/login/mfa', { mfa_token: again, code: totp(secret) })).status, 200, 'the next code works');
  assert.equal((await post('/api/login/mfa', { mfa_token: b.mfa_token, code: totp(secret) })).status, 401, 'a used challenge is gone');
  const events = t.ops.q('SELECT event, detail FROM login_events WHERE user_id=?', u.id).map((e) => e.event); assert.ok(events.includes('MFA_ENABLED') && events.includes('LOGIN_FAILED') && events.includes('LOGIN_OK'));
  assert.ok(!JSON.stringify(t.ops.q('SELECT * FROM login_events')).includes(code), 'codes are never logged');
});

test('S3-3 recovery codes work once each, are counted, and can be regenerated only with a current code', async () => {
  const u = await person(); const { secret, codes } = await enrol(u);
  const ch = await challenge(u); const used = await post('/api/login/mfa', { mfa_token: ch, recovery_code: codes[0].toLowerCase().replace('-', ' ') });
  assert.equal(used.status, 200, 'case and separators do not matter'); const s = mk(used.headers.get('set-cookie').split(';')[0]);
  assert.equal((await s.get('/api/mfa/status')).body.recovery_codes_remaining, 9);
  assert.equal((await post('/api/login/mfa', { mfa_token: await challenge(u), recovery_code: codes[0] })).status, 401, 'a recovery code is single-use');
  assert.ok(t.ops.q('SELECT event FROM login_events WHERE user_id=?', u.id).some((e) => e.event === 'MFA_RECOVERY_USED'));
  assert.equal((await s.post('/api/mfa/recovery-codes', { code: '000000' })).status, 400);
  clock.advance(31000); const fresh = await s.post('/api/mfa/recovery-codes', { code: totp(secret) }); assert.equal(fresh.status, 200); assert.equal(fresh.body.recovery_codes.length, 10);
  assert.equal((await post('/api/login/mfa', { mfa_token: await challenge(u), recovery_code: codes[1] })).status, 401, 'old codes stop working');
  assert.equal((await post('/api/login/mfa', { mfa_token: await challenge(u), recovery_code: fresh.body.recovery_codes[0] })).status, 200);
});

test('S3-4 guessing codes is limited: a challenge allows 5 tries, the account locks for 15 minutes, challenges expire after 5 minutes', async () => {
  const u = await person(); const { secret } = await enrol(u);
  let ch = await challenge(u); const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await post('/api/login/mfa', { mfa_token: ch, code: '111111' })).status);
  assert.deepEqual(codes, [401, 401, 401, 401, 401]);
  assert.equal((await post('/api/login/mfa', { mfa_token: ch, code: totp(secret) })).status, 401, 'the challenge was used up');
  ch = await challenge(u); const locked = await post('/api/login/mfa', { mfa_token: ch, code: totp(secret) });
  assert.equal(locked.status, 429, 'five wrong codes lock the account, even for the right code'); assert.ok(t.ops.q('SELECT event FROM login_events WHERE user_id=?', u.id).some((e) => e.event === 'LOGIN_BLOCKED'));
  clock.advance(16 * 60e3); ch = await challenge(u); assert.equal((await post('/api/login/mfa', { mfa_token: ch, code: totp(secret) })).status, 200, 'after 15 minutes it works again');
  const old = await challenge(u); clock.advance(6 * 60e3); const exp = await post('/api/login/mfa', { mfa_token: old, code: totp(secret) }); assert.equal(exp.status, 401); assert.equal(exp.body.error.code, 'MFA_CHALLENGE_EXPIRED');
});

test('S3-5 roles can be required: they can sign in but only reach enrolment until they set it up; required roles cannot turn it off', async () => {
  assert.equal((await admin.patch('/api/config/settings', { mfa_required_roles: 'wizard' })).status, 400);
  assert.equal((await rec.patch('/api/config/settings', { mfa_required_roles: 'reception' })).status, 403);
  assert.equal((await admin.patch('/api/config/settings', { mfa_required_roles: 'reception, supervisor' })).status, 200);
  assert.equal(t.ops.setting('mfa_required_roles'), 'reception,supervisor');
  const u = await person('reception'); const s = await login(u.username); assert.equal(s.status, 200); assert.equal(s.body.user.mfa_setup_required, 1);
  assert.equal((await s.get('/api/me')).body.user.mfa_setup_required, 1);
  for (const p of ['/api/patients?q=Sample', '/api/schedule/board', '/api/queue']) { const r = await s.get(p); assert.equal(r.status, 403, p); assert.equal(r.body.error.code, 'MFA_SETUP_REQUIRED'); }
  const st = await s.post('/api/mfa/setup'); assert.equal(st.status, 200); clock.advance(31000);
  assert.equal((await s.post('/api/mfa/confirm', { code: totp(st.body.secret) })).status, 200);
  assert.equal((await s.get('/api/patients?q=Sample')).status, 200, 'normal access after enrolment');
  clock.advance(31000); const dis = await s.post('/api/mfa/disable', { password: STRONG, code: totp(st.body.secret) }); assert.equal(dis.status, 403); assert.equal(dis.body.error.code, 'MFA_REQUIRED');
  assert.equal((await admin.patch('/api/config/settings', { mfa_required_roles: '' })).status, 200);
});

test('S3-6 a person whose role does not require MFA can turn it on and off (password and code needed)', async () => {
  const u = await person('clinician'); const { secret } = await enrol(u); const s = await login(u.username).then(async (r) => mk((await post('/api/login/mfa', { mfa_token: r.body.mfa_token, code: totp(secret) })).headers.get('set-cookie').split(';')[0]));
  assert.equal((await s.post('/api/mfa/disable', { password: 'wrong-wrong-1234', code: totp(secret, 30000) })).status, 400);
  clock.advance(31000); const off = await s.post('/api/mfa/disable', { password: STRONG, code: totp(secret) }); assert.equal(off.status, 200);
  assert.equal((await login(u.username)).body.mfa_required, undefined, 'signs in with the password alone again'); assert.equal(t.ops.one('SELECT COUNT(*) c FROM user_mfa WHERE user_id=?', u.id).c, 0);
});

test('S3-7 administrator can reset a lost authenticator: sessions end, the person re-enrols; other roles cannot', async () => {
  const u = await person(); await enrol(u); const live = await login(u.username).then((r) => r); // password step only
  const ch = live.body.mfa_token; assert.ok(ch);
  assert.equal((await rec.post(`/api/security/users/${u.id}/reset-mfa`)).status, 403);
  assert.equal((await admin.post(`/api/security/users/${u.id}/reset-mfa`)).status, 200);
  assert.equal((await admin.post('/api/security/users/99999/reset-mfa')).status, 404);
  const after = await login(u.username); assert.equal(after.body.mfa_required, undefined); assert.equal((await after.get('/api/mfa/status')).body.enabled, false);
  assert.ok(t.ops.q('SELECT event FROM login_events WHERE user_id=?', u.id).some((e) => e.event === 'MFA_RESET'));
  const accounts = (await admin.get('/api/security/accounts')).body; assert.ok(accounts.every((a) => a.mfa_enabled === 0 || a.mfa_enabled === 1));
});

test('S3-8 existing sign-in is unchanged when MFA is not required and not enrolled (seeded demo accounts)', async () => {
  const r = await fetch(`${t.base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'pt.one', password: 'Demo-Passw0rd!' }) });
  assert.equal(r.status, 200); const b = await r.json(); assert.equal(b.mfa_required, undefined); assert.equal(b.user.mfa_setup_required, 0);
  assert.equal(JSON.stringify(t.ops.q('SELECT * FROM audit_log')).includes('secret'), false);
});

test('S3-9 emergency console reset removes an authenticator and is audited', async () => {
  const { resetMfa } = await import('../server/mfa-reset.js');
  const u = await person(); await enrol(u);
  assert.throws(() => resetMfa(t.db, 'nobody.here'), /No account/);
  resetMfa(t.db, u.username);
  assert.equal(t.ops.one('SELECT COUNT(*) c FROM user_mfa WHERE user_id=?', u.id).c, 0);
  assert.equal((await login(u.username)).body.mfa_required, undefined);
  assert.ok(t.ops.q("SELECT detail FROM audit_log WHERE action='mfa.reset'").some((r) => r.detail.includes('server-console')));
});
