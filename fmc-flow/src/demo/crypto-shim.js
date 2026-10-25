// DEMO ONLY: synchronous sha256 stands in for scrypt/Node crypto so the server code runs unchanged in a browser.
import { Buffer } from 'buffer';

const primes = []; for (let n = 2; primes.length < 64; n++) if (primes.every((p) => n % p)) primes.push(n);
const frac = (x) => Math.floor((x - Math.floor(x)) * 4294967296) >>> 0;
const K = primes.map((p) => frac(Math.cbrt(p)));
const H0 = primes.slice(0, 8).map((p) => frac(Math.sqrt(p)));
const rotr = (x, n) => (x >>> n) | (x << (32 - n));

export function sha256(bytes) {
  const l = bytes.length, total = (((l + 9 + 63) >> 6) << 6), buf = new Uint8Array(total);
  buf.set(bytes); buf[l] = 0x80;
  const dv = new DataView(buf.buffer); dv.setUint32(total - 4, (l * 8) >>> 0); dv.setUint32(total - 8, Math.floor((l * 8) / 4294967296));
  const h = H0.slice(), w = new Uint32Array(64);
  for (let o = 0; o < total; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    [a, b, c, d, e, f, g, hh].forEach((v, i) => { h[i] = (h[i] + v) >>> 0; });
  }
  const out = new Uint8Array(32); const odv = new DataView(out.buffer); h.forEach((v, i) => odv.setUint32(i * 4, v));
  return out;
}
const enc = (s) => (typeof s === 'string' ? new TextEncoder().encode(s) : Uint8Array.from(s));
export const createHash = () => { let data = ''; return { update(s) { data += s; return this; }, digest: () => Buffer.from(sha256(enc(data))).toString('hex') }; };
export const randomBytes = (n) => Buffer.from(crypto.getRandomValues(new Uint8Array(n)));
export const scryptSync = (pw, salt) => Buffer.from(sha256(Uint8Array.from([...salt, ...enc(pw)])));
export const timingSafeEqual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
