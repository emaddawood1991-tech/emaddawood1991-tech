import * as THREE from "three";

// Cinematic camera rig: key-framed position + look-at target through Catmull-Rom splines, with a monotone (PCHIP) time
// mapping so speed changes smoothly between keys and starts/ends at rest. keys = [[t, [px,py,pz], [tx,ty,tz]], ...]
export function makeRig(keys) {
  const V = (a) => new THREE.Vector3(...a), n = keys.length;
  const pos = new THREE.CatmullRomCurve3(keys.map((k) => V(k[1])), false, "centripetal"), tgt = new THREE.CatmullRomCurve3(keys.map((k) => V(k[2])), false, "centripetal");
  const T = keys.map((k) => k[0]), S = keys.map((_, i) => i / (n - 1)), h = T.slice(1).map((t, i) => t - T[i]), d = S.slice(1).map((s, i) => (s - S[i]) / h[i]), m = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);   // zero slope at the ends = gentle start/stop
  const sOf = (t) => { if (t <= T[0]) return 0; if (t >= T[n - 1]) return 1; let i = 0; while (t > T[i + 1]) i++; const x = (t - T[i]) / h[i], x2 = x * x, x3 = x2 * x; return (2 * x3 - 3 * x2 + 1) * S[i] + (x3 - 2 * x2 + x) * h[i] * m[i] + (-2 * x3 + 3 * x2) * S[i + 1] + (x3 - x2) * h[i] * m[i + 1]; };
  const p = new THREE.Vector3(), g = new THREE.Vector3();
  return { duration: T[n - 1], at(t) { const s = Math.min(1, Math.max(0, sOf(t))); pos.getPoint(s, p); tgt.getPoint(s, g); return { pos: p, tgt: g }; }, samples(k = 200) { return Array.from({ length: k + 1 }, (_, i) => pos.getPoint(sOf((i / k) * T[n - 1])).clone()); } };
}
