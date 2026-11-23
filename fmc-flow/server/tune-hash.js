// npm run tune:hash — measures password hashing on THIS server and recommends the strongest setting that keeps sign-in quick.
// Run it on the machine that will host the application, with the same load you expect, then set FMC_SCRYPT_LOGN to the recommendation.
import { randomBytes, scrypt } from 'node:crypto';

const TARGET_MS = Number(process.env.TUNE_TARGET_MS) || 300; // a sign-in should stay well under half a second
const run = (logN) => new Promise((res, rej) => {
  const N = 2 ** logN; const t0 = process.hrtime.bigint();
  scrypt('benchmark-password-not-real', randomBytes(16), 32, { N, r: 8, p: 1, maxmem: 2 * 128 * 8 * N }, (e) => (e ? rej(e) : res(Number(process.hrtime.bigint() - t0) / 1e6)));
});
const rows = [];
for (let logN = 14; logN <= 17; logN++) {
  const t = []; for (let i = 0; i < 5; i++) t.push(await run(logN)); t.sort((a, b) => a - b);
  rows.push({ logN, ms: Math.round(t[2]), mb: Math.round((128 * 8 * 2 ** logN) / 1048576) }); // median of five
}
console.log('log2 cost   median time   memory');
for (const r of rows) console.log(`${String(r.logN).padStart(9)}   ${String(r.ms).padStart(8)} ms   ${String(r.mb).padStart(4)} MB`);
const best = [...rows].reverse().find((r) => r.ms <= TARGET_MS) || rows[0];
console.log(`\nRecommended: FMC_SCRYPT_LOGN=${best.logN}  (${best.ms} ms per hash, target ${TARGET_MS} ms).`);
console.log('Production defaults to 15 when this is not set. Existing passwords are upgraded automatically at each person\'s next correct sign-in.');
if (best.logN < 15) console.log('Note: this machine is slow for the production default; consider a faster one or keep the recommended value.');
