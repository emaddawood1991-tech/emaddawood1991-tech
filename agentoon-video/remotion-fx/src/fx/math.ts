// Pure, frame-based math shared by the effects (no React, no time): unit-tested in test/math.test.ts.
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOutCubic = (t: number) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** value of an animated counter at `frame`: starts at `start`, runs `dur` frames, eased, ends exactly on `to`. */
export function counterValue(frame: number, o: { from: number; to: number; start: number; dur: number; ease?: (t: number) => number }) {
  const t = clamp((frame - o.start) / o.dur); return lerp(o.from, o.to, (o.ease ?? easeOutCubic)(t));
}
export function formatNumber(v: number, decimals = 0, sep = ",") {
  const s = Math.abs(v).toFixed(decimals); const [i, d] = s.split("."); const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, sep); return (v < 0 ? "-" : "") + g + (d ? "." + d : "");
}
/** odometer: continuous position (0..10) of each digit column for `value`; the ones column rolls smoothly, higher columns roll when the lower one wraps. */
export function odometerPositions(value: number, digits: number) {
  const out: number[] = [];
  for (let k = 0; k < digits; k++) { const p = Math.pow(10, k); const x = value / p; const whole = Math.floor(x); const frac = x - whole; const lowWrap = k === 0 ? 0 : (Math.floor(value / Math.pow(10, k - 1)) % 10 + (value / Math.pow(10, k - 1) - Math.floor(value / Math.pow(10, k - 1)))) / 10; const d = whole % 10; const roll = k === 0 ? frac : clamp((lowWrap - 0.9) / 0.1); out.push(d + (k === 0 ? frac : roll)); }
  return out.reverse();
}
/** speed ramp: maps output frame -> source time (frames) through keyframes {f, t}; segments eased so speed changes smoothly. */
export function speedRamp(frame: number, keys: { f: number; t: number }[]) {
  if (frame <= keys[0].f) return keys[0].t; for (let i = 1; i < keys.length; i++) { if (frame <= keys[i].f) { const u = (frame - keys[i - 1].f) / (keys[i].f - keys[i - 1].f); return lerp(keys[i - 1].t, keys[i].t, easeInOutCubic(u)); } } return keys[keys.length - 1].t;
}
/** deterministic PRNG (mulberry32): never use Math.random in a render. */
export function rng(seed: number) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
