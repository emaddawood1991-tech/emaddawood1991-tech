/**
 * Continuous camera path sampler (pure, no React).
 *
 * The old sampler eased every segment in AND out, so the camera came to a stop at every keyframe — that is what made scenes feel like
 * separate slides. This one uses monotone cubic Hermite interpolation (PCHIP):
 *   - the path passes through keys at speed (C1: velocity is continuous), so a move can run through several keys without stopping;
 *   - a key that repeats its neighbour (a deliberate HOLD) gets zero tangent, so the camera still rests where the script says so;
 *   - no overshoot: every channel stays inside the range of the keys around it (the camera never swings past a framing).
 */
export type V3 = [number, number, number];
export type CamKey = {f: number; pos: V3; target: V3; fov?: number};
export type CamSample = {f: number; pos: V3; target: V3; fov: number};

const same = (a: number[], b: number[], eps = 1e-6) => a.every((v, i) => Math.abs(v - b[i]) < eps);
const flat = (k: CamKey): number[] => [...k.pos, ...k.target, k.fov ?? 35];

/** PCHIP tangents (per frame) for one channel. */
const tangents = (f: number[], y: number[]): number[] => {
  const n = f.length, m = new Array(n).fill(0);
  if (n < 3) return m;
  const d = y.slice(1).map((v, i) => (v - y[i]) / (f[i + 1] - f[i]));
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }          // local extremum or hold → rest
    const h0 = f[i] - f[i - 1], h1 = f[i + 1] - f[i], w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);               // weighted harmonic mean (Fritsch–Carlson)
  }
  return m; // ends keep 0 → ease in at the very start, ease out at the very end
};

export const sampleCameraFlow = (keys: CamKey[], frame: number): CamSample => {
  const ch = (k: CamKey) => flat(k);
  if (frame <= keys[0].f) return {f: frame, pos: keys[0].pos, target: keys[0].target, fov: keys[0].fov ?? 35};
  const last = keys[keys.length - 1];
  if (frame >= last.f) return {f: frame, pos: last.pos, target: last.target, fov: last.fov ?? 35};
  let i = 0;
  while (i < keys.length - 2 && frame > keys[i + 1].f) i++;
  const fs = keys.map((k) => k.f), a = ch(keys[i]), b = ch(keys[i + 1]);
  // a key identical to its neighbour is a hold: force zero tangent on both of its channels
  const out: number[] = [];
  for (let c = 0; c < 7; c++) {
    const ys = keys.map((k) => ch(k)[c]);
    const m = tangents(fs, ys);
    for (let j = 1; j < keys.length - 1; j++) if (same(ch(keys[j]), ch(keys[j - 1])) || same(ch(keys[j]), ch(keys[j + 1]))) m[j] = 0;
    const h = fs[i + 1] - fs[i], t = (frame - fs[i]) / h, t2 = t * t, t3 = t2 * t;
    out.push((2 * t3 - 3 * t2 + 1) * a[c] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * b[c] + (t3 - t2) * h * m[i + 1]);
  }
  return {f: frame, pos: [out[0], out[1], out[2]], target: [out[3], out[4], out[5]], fov: out[6]};
};
