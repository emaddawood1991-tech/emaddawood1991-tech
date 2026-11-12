// Password hashing (scrypt from node:crypto — no custom cryptography).
// Stored as `s1$salt$hash` (cost 2^14, the original format) or `s2$<log2 cost>$salt$hash` (higher cost). Verification understands both,
// and a person's hash is upgraded to the current cost the next time they sign in with the right password.
import { randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';

/** log2 of the scrypt cost to use for new hashes: 15 in production, 14 elsewhere; FMC_SCRYPT_LOGN (14–20) overrides. */
export const targetLogN = () => { const n = Number(process.env.FMC_SCRYPT_LOGN); return Number.isInteger(n) && n >= 14 && n <= 20 ? n : (process.env.NODE_ENV === 'production' ? 15 : 14); };
const opts = (logN) => ({ N: 2 ** logN, r: 8, p: 1, maxmem: 2 * 128 * 8 * 2 ** logN });
const format = (logN, salt, hash) => (logN === 14 ? `s1$${salt}$${hash}` : `s2$${logN}$${salt}$${hash}`);

/** Splits a stored hash. Returns null when it is not one of ours. */
export function parseHash(stored) {
  const p = String(stored).split('$');
  if (p[0] === 's1' && p.length === 3) return { logN: 14, salt: p[1], hash: p[2] };
  if (p[0] === 's2' && p.length === 4 && Number.isInteger(Number(p[1]))) return { logN: Number(p[1]), salt: p[2], hash: p[3] };
  return null;
}
export const needsRehash = (stored) => { const h = parseHash(stored); return !!h && h.logN < targetLogN(); };

export function hashPassword(pw) {
  const logN = targetLogN(); const salt = randomBytes(16);
  return format(logN, salt.toString('hex'), scryptSync(pw, salt, 32, opts(logN)).toString('hex'));
}
const scryptAsync = (pw, salt, len, o) => new Promise((res, rej) => scrypt(pw, salt, len, o, (e, k) => (e ? rej(e) : res(k))));
/** Off the main thread, so a hash at the higher cost cannot stall other requests. */
export async function hashPasswordAsync(pw) {
  const logN = targetLogN(); const salt = randomBytes(16);
  return format(logN, salt.toString('hex'), (await scryptAsync(pw, salt, 32, opts(logN))).toString('hex'));
}
export function verifyPassword(pw, stored) {
  const h = parseHash(stored); if (!h) return false;
  return timingSafeEqual(scryptSync(pw, Buffer.from(h.salt, 'hex'), 32, opts(h.logN)), Buffer.from(h.hash, 'hex'));
}
export async function verifyPasswordAsync(pw, stored) {
  const h = parseHash(stored); if (!h) return false;
  return timingSafeEqual(await scryptAsync(pw, Buffer.from(h.salt, 'hex'), 32, opts(h.logN)), Buffer.from(h.hash, 'hex'));
}
