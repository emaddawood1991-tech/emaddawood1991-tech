// Multi-factor authentication (stage S3): time-based one-time passwords (RFC 6238) with recovery codes.
// The OTP maths comes from the vetted `otpauth` library; secrets are encrypted at rest with AES-256-GCM under a key that is NOT in the database.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { nowMs } from './ops.js';

const ISSUER = 'FMC Patient Flow';
const STEP_MS = 30000;
const RECOVERY_COUNT = 10;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alike characters
const ROLES = ['admin', 'supervisor', 'reception', 'clinician'];

const sealWith = (key) => (plain) => { const iv = randomBytes(12); const c = createCipheriv('aes-256-gcm', key, iv); const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]); return [iv, c.getAuthTag(), ct].map((b) => b.toString('base64')).join('.'); };
const openWith = (key) => (sealed) => { const [iv, tag, ct] = String(sealed).split('.').map((x) => Buffer.from(x, 'base64')); const d = createDecipheriv('aes-256-gcm', key, iv); d.setAuthTag(tag); return Buffer.concat([d.update(ct), d.final()]).toString('utf8'); };
const recoveryCode = () => { const b = randomBytes(10); let s = ''; for (let i = 0; i < 10; i++) s += ALPHABET[b[i] % ALPHABET.length]; return `${s.slice(0, 5)}-${s.slice(5)}`; };
const normRecovery = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function makeMfa({ db, ops, key, HttpError, sha }) {
  const { q, one, run, setting, audit, now } = ops;
  if (!key || key.length !== 32) throw new Error('MFA key must be 32 bytes');
  const seal = sealWith(key); const open = openWith(key);
  const hashRecovery = (userId, code) => createHash('sha256').update(`${userId}:${normRecovery(code)}`).digest('hex');
  const totpFor = (secretB32, label) => new OTPAuth.TOTP({ issuer: ISSUER, label, algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secretB32) });

  const row = (userId) => one('SELECT * FROM user_mfa WHERE user_id=?', userId);
  const enabled = (userId) => !!row(userId)?.enabled;
  const requiredRoles = () => String(setting('mfa_required_roles') || '').split(',').map((x) => x.trim()).filter((x) => ROLES.includes(x));
  const required = (user) => requiredRoles().includes(user.role);

  /** Checks a 6-digit code. Each time step can be used once (replay protection). */
  function checkTotp(userId, token) {
    const r = row(userId); if (!r) return false;
    const code = String(token || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) return false;
    const u = one('SELECT username FROM users WHERE id=?', userId);
    const delta = totpFor(open(r.secret_enc), u.username).validate({ token: code, timestamp: nowMs(), window: 1 });
    if (delta === null) return false;
    const step = Math.floor(nowMs() / STEP_MS) + delta;
    if (r.last_used_step != null && step <= r.last_used_step) return false; // already used
    run('UPDATE user_mfa SET last_used_step=? WHERE user_id=?', step, userId);
    return true;
  }
  function checkRecovery(userId, code) {
    const h = hashRecovery(userId, code);
    const hit = one('SELECT id FROM mfa_recovery_codes WHERE user_id=? AND code_hash=? AND used_at IS NULL', userId, h);
    if (!hit) return false;
    run('UPDATE mfa_recovery_codes SET used_at=? WHERE id=?', now(), hit.id);
    return true;
  }
  /** Verifies the second factor for a sign-in. Returns 'totp', 'recovery' or null. */
  function verifySecondFactor(userId, { code, recovery_code: rc }) {
    if (code && checkTotp(userId, code)) return 'totp';
    if (rc && checkRecovery(userId, rc)) return 'recovery';
    return null;
  }
  const remainingCodes = (userId) => one('SELECT COUNT(*) c FROM mfa_recovery_codes WHERE user_id=? AND used_at IS NULL', userId).c;

  async function startSetup(user) {
    if (enabled(user.id)) throw new HttpError(409, 'MFA_ALREADY_ENABLED', 'Multi-factor authentication is already on for this account.');
    const secret = new OTPAuth.Secret({ size: 20 }); const t = totpFor(secret.base32, user.username);
    run('INSERT INTO user_mfa(user_id,secret_enc,enabled,created_at) VALUES (?,?,0,?) ON CONFLICT(user_id) DO UPDATE SET secret_enc=excluded.secret_enc, enabled=0, confirmed_at=NULL, last_used_step=NULL, created_at=excluded.created_at', user.id, seal(secret.base32), now());
    const uri = t.toString();
    return { secret: secret.base32, uri, qr_svg: await QRCode.toString(uri, { type: 'svg', margin: 1, width: 220 }) };
  }
  function newRecoveryCodes(userId) {
    run('DELETE FROM mfa_recovery_codes WHERE user_id=?', userId);
    const codes = Array.from({ length: RECOVERY_COUNT }, recoveryCode);
    for (const c of codes) run('INSERT INTO mfa_recovery_codes(user_id,code_hash) VALUES (?,?)', userId, hashRecovery(userId, c));
    return codes; // shown to the person once; only hashes are stored
  }
  function confirmSetup(user, code) {
    const r = row(user.id); if (!r || r.enabled) throw new HttpError(409, 'MFA_NOT_PENDING', 'Start the setup first.');
    const t = totpFor(open(r.secret_enc), user.username); const delta = t.validate({ token: String(code || '').replace(/\s/g, ''), timestamp: nowMs(), window: 1 });
    if (delta === null) throw new HttpError(400, 'VALIDATION', 'That code is not correct. Check the time on your phone and try again.', { fields: { code: 'That code is not correct. Check the time on your phone and try again.' } });
    run('UPDATE user_mfa SET enabled=1, confirmed_at=?, last_used_step=? WHERE user_id=?', now(), Math.floor(nowMs() / STEP_MS) + delta, user.id);
    return newRecoveryCodes(user.id);
  }
  const reset = (userId) => { run('DELETE FROM user_mfa WHERE user_id=?', userId); run('DELETE FROM mfa_recovery_codes WHERE user_id=?', userId); };
  const status = (user) => { const r = row(user.id); return { enabled: !!r?.enabled, pending: !!r && !r.enabled, confirmed_at: r?.confirmed_at ?? null, recovery_codes_remaining: r?.enabled ? remainingCodes(user.id) : 0, required: required(user) }; };
  const summary = (userId) => { const r = row(userId); return { enabled: !!r?.enabled, recovery_codes_remaining: r?.enabled ? remainingCodes(userId) : 0 }; };

  return { enabled, required, requiredRoles, verifySecondFactor, startSetup, confirmSetup, newRecoveryCodes, reset, status, summary, checkTotp, ROLES };
}

/** Random 32-byte key from FMC_MFA_KEY (64 hex characters). */
export const keyFromHex = (hex) => { if (!/^[0-9a-f]{64}$/i.test(hex || '')) throw new Error('FMC_MFA_KEY must be 64 hex characters'); return Buffer.from(hex, 'hex'); };
