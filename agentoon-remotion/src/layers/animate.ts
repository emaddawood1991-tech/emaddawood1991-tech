import { interpolate, spring } from "remotion";
import type { Anim } from "../types";

export const animStyle = (
  anim: Anim | undefined,
  frame: number,
  fps: number,
  sceneFrames: number,
): { opacity: number; transform: string } => {
  const a = anim ?? {};
  const kind = a.in ?? "fadeUp";
  const delay = Math.round((a.delay ?? 0) * fps);
  const dur = Math.max(1, Math.round((a.duration ?? 0.6) * fps));
  const t = frame - delay;

  const p =
    kind === "pop"
      ? spring({ frame: t, fps, config: { damping: 12, stiffness: 160 } })
      : spring({ frame: t, fps, durationInFrames: dur, config: { damping: 200 } });

  let opacity = kind === "none" ? 1 : Math.min(1, Math.max(0, p));
  let tx = 0, ty = 0, s = 1;
  const d = 1 - p;
  if (kind === "fadeUp") ty = d * 70;
  if (kind === "fadeDown") ty = -d * 70;
  if (kind === "slideLeft") tx = d * 160;
  if (kind === "slideRight") tx = -d * 160;
  if (kind === "scaleIn") s = 0.8 + 0.2 * p;
  if (kind === "pop") { s = 0.5 + 0.5 * p; opacity = Math.min(1, p * 3); }

  if (a.out === "fadeOut") {
    const outDur = Math.round(0.3 * fps);
    opacity *= interpolate(frame, [sceneFrames - outDur, sceneFrames], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  return { opacity, transform: `translate(${tx}px, ${ty}px) scale(${s})` };
};
