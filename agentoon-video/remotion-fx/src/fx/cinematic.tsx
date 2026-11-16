import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { clamp, easeInOutCubic, lerp, speedRamp } from "./math";
import { theme } from "./theme";

/** /agentoon-cinematic-fx: transitions as @remotion/transitions presentations + camera tools. */
const fill: React.CSSProperties = { position: "absolute", inset: 0 };

/** circle reveal from a point: entering scene is revealed through an expanding circle (match-cut style when the circle starts on a matching shape). */
const CircleReveal: React.FC<TransitionPresentationComponentProps<{ cx: number; cy: number; ring?: string }>> = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const p = easeInOutCubic(presentationProgress); const r = p * 160; const entering = presentationDirection === "entering";
  return (
    <AbsoluteFill style={{ ...fill, zIndex: entering ? 2 : 1, clipPath: entering ? `circle(${r}% at ${passedProps.cx}% ${passedProps.cy}%)` : undefined, transform: entering ? undefined : `scale(${1 + p * 0.06})`, filter: entering ? undefined : `blur(${p * 6}px)` }}>
      {children}
      {entering && p < 0.98 && <div style={{ position: "absolute", left: `${passedProps.cx}%`, top: `${passedProps.cy}%`, width: r * 20, height: r * 20, marginLeft: -r * 10, marginTop: -r * 10, borderRadius: "50%", border: `8px solid ${passedProps.ring ?? theme.lime}`, boxSizing: "border-box", opacity: 1 - p, pointerEvents: "none" }} />}
    </AbsoluteFill>
  );
};
export const circleReveal = (o: { cx?: number; cy?: number; ring?: string } = {}): TransitionPresentation<{ cx: number; cy: number; ring?: string }> => ({ component: CircleReveal, props: { cx: o.cx ?? 50, cy: o.cy ?? 50, ring: o.ring } });

/** diagonal mask wipe with a bright edge. */
const DiagonalWipe: React.FC<TransitionPresentationComponentProps<{ angle: number }>> = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const p = easeInOutCubic(presentationProgress); const entering = presentationDirection === "entering"; const a = passedProps.angle; const x = lerp(0, 100 + a, p);
  // revealed region grows from the left edge; at p = 1 it covers the whole frame (x - a >= 100)
  const poly = p >= 1 ? undefined : `polygon(0% 0%, ${x}% 0%, ${x - a}% 100%, 0% 100%)`;
  return <AbsoluteFill style={{ ...fill, zIndex: entering ? 2 : 1, clipPath: entering ? poly : undefined, transform: entering ? undefined : `translateX(${-p * 4}%)` }}>{children}</AbsoluteFill>;
};
export const diagonalWipe = (angle = 30): TransitionPresentation<{ angle: number }> => ({ component: DiagonalWipe, props: { angle } });

/** depth push: exiting scene recedes (scale down + blur + dim), entering scene arrives from in front (scale 1.25 -> 1). */
const DepthPush: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({ children, presentationProgress, presentationDirection }) => {
  const p = easeInOutCubic(presentationProgress); const entering = presentationDirection === "entering";
  return <AbsoluteFill style={{ ...fill, zIndex: entering ? 2 : 1, opacity: entering ? clamp(p * 2.2) : 1 - p * 0.6, transform: `scale(${entering ? lerp(1.28, 1, p) : lerp(1, 0.86, p)})`, filter: `blur(${entering ? (1 - p) * 14 : p * 10}px)` }}>{children}</AbsoluteFill>;
};
export const depthPush = (): TransitionPresentation<Record<string, never>> => ({ component: DepthPush, props: {} });

/** whip: both scenes slide fast with heavy horizontal blur at the peak. */
const Whip: React.FC<TransitionPresentationComponentProps<{ dir: 1 | -1 }>> = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const p = easeInOutCubic(presentationProgress); const entering = presentationDirection === "entering"; const x = entering ? (1 - p) * 100 * passedProps.dir : -p * 100 * passedProps.dir; const blur = Math.sin(p * Math.PI) * 34;
  return <AbsoluteFill style={{ ...fill, zIndex: entering ? 2 : 1, transform: `translateX(${x}%)`, filter: `blur(${blur}px)` }}>{children}</AbsoluteFill>;
};
export const whip = (dir: 1 | -1 = 1): TransitionPresentation<{ dir: 1 | -1 }> => ({ component: Whip, props: { dir } });

/** motion blur for anything that moves fast inside it (re-renders the child at sub-frame offsets). */
export const MotionBlur: React.FC<{ children: React.ReactNode; samples?: number; shutterAngle?: number }> = ({ children, samples = 8, shutterAngle = 220 }) => <CameraMotionBlur samples={samples} shutterAngle={shutterAngle}>{children}</CameraMotionBlur>;

/** tracking camera: follows a target path with lag (smooth follow), optional zoom, around any 2D scene. `target(frame)` returns scene coordinates. */
export const CameraRig: React.FC<{ target: (f: number) => { x: number; y: number }; zoom?: number | ((f: number) => number); lag?: number; children: React.ReactNode }> = ({ target, zoom = 1.3, lag = 7, children }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const t = target(frame - lag); const z = typeof zoom === "number" ? zoom : zoom(frame);
  return <AbsoluteFill style={{ transform: `translate(${width / 2 - t.x * z}px, ${height / 2 - t.y * z}px) scale(${z})`, transformOrigin: "0 0" }}>{children}</AbsoluteFill>;
};

/** layered depth parallax with depth-of-field blur away from the focus plane. */
export const DepthLayers: React.FC<{ layers: { depth: number; children: React.ReactNode }[]; focus?: number; travel?: number }> = ({ layers, focus = 0.5, travel = 160 }) => {
  const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig(); const t = interpolate(frame, [0, durationInFrames], [-1, 1]);
  return <AbsoluteFill>{layers.map((l, i) => <AbsoluteFill key={i} style={{ transform: `translateX(${t * travel * (0.3 + l.depth)}px) scale(${1 + l.depth * 0.08 + (t + 1) * 0.02 * l.depth})`, filter: `blur(${Math.abs(l.depth - focus) * 14}px)` }}>{l.children}</AbsoluteFill>)}</AbsoluteFill>;
};

/** subtle one-shot light sweep (use sparingly: once per reveal, never a looping scan beam). */
export const LightSweep: React.FC<{ start?: number; dur?: number; strength?: number; angle?: number }> = ({ start = 0, dur = 26, strength = 0.35, angle = 20 }) => {
  const frame = useCurrentFrame(); const p = clamp((frame - start) / dur); if (p <= 0 || p >= 1) return null;
  return <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", background: `linear-gradient(${90 + angle}deg, transparent ${lerp(-30, 110, p) - 14}%, rgba(255,255,255,${strength}) ${lerp(-30, 110, p)}%, transparent ${lerp(-30, 110, p) + 14}%)` }} />;
};

/** controlled speed ramp: returns the remapped time (frames) for animations/videos; keyframes {f: output frame, t: source frame}. */
export const useSpeedRamp = (keys: { f: number; t: number }[]) => speedRamp(useCurrentFrame(), keys);
