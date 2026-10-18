/**
 * Acting principles for the 3D presenter (anticipation, overshoot/follow-through, slow-in/slow-out).
 * Adapted as TECHNIQUE from the classic principles as written up in the MIT-licensed ClaudeAnimationBase ANIMATION_GUIDE.md.
 * No code, characters (its "Clawd" sample) or assets are imported — this is an original implementation for FMC's 3D rig.
 */
export type Acting = {
  /** fraction of the pose the arm first moves the OPPOSITE way before reaching (anticipation). 0.04–0.08 reads as intention. */
  anticipate: number;
  /** fraction past the target before settling (follow-through). 0.03–0.07 keeps it professional, not cartoonish. */
  overshoot: number;
};

/** Pointing/explaining gestures: a small wind-up, a confident arrival, a settle. */
export const GESTURE_ACTING: Acting = {anticipate: 0.05, overshoot: 0.045};

const ss = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

/**
 * Blend weight for the IN part of a clip, x in 0..1.
 *   0 – 20 %  anticipation: dips to −anticipate (the arm moves slightly the other way — "I'm about to point")
 *  20 – 80 %  slow-in/slow-out travel to (1 + overshoot)
 *  80 – 100 % follow-through: settles back to exactly 1
 * Continuous, exactly 0 at x=0 and exactly 1 at x=1, so it joins the normal hold without a pop.
 */
export const actingEase = (x: number, a: Acting): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (x < 0.2) return -a.anticipate * Math.sin(Math.PI * (x / 0.2)) ** 2;                 // C1 dip
  if (x < 0.8) return (1 + a.overshoot) * ss((x - 0.2) / 0.6);
  return 1 + a.overshoot * (1 - ss((x - 0.8) / 0.2));
};

/** Peak of the curve (for tests and for bounding extrapolation). */
export const actingExtremes = (a: Acting) => {
  let mn = 0, mx = 1;
  for (let i = 0; i <= 200; i++) { const v = actingEase(i / 200, a); mn = Math.min(mn, v); mx = Math.max(mx, v); }
  return {min: mn, max: mx};
};
