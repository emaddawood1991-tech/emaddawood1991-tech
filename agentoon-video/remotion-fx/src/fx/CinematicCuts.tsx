import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { theme } from "./theme";
import { clamp, lerp } from "./math";

/** /agentoon-cinematic-cuts: two ordinary video scenes joined by a MOTION-MATCHED cut: scene A pushes toward a target point (camera-driven, accelerating), at the cut
 *  scene B starts at the SAME zoom with ITS target point on the same screen position and pulls back out; a circular mask expands from that point, with real
 *  sub-frame motion blur. Both targets are centred on screen so the cut is invisible. Coordinates are in video pixels. */
export type CutsProps = { a: string; b: string; pa: [number, number]; pb: [number, number]; vw?: number; vh?: number; start: number; cut: number; end: number; base?: number; peak?: number; aFrom?: number; bFrom?: number };
const Scene: React.FC<{ src: string; p: [number, number]; s: number; vw: number; vh: number; from: number; clip?: string }> = ({ src, p, s, vw, vh, from, clip }) => (
  <AbsoluteFill style={{ clipPath: clip }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: vw, height: vh, transformOrigin: "0 0", transform: `translate(${540 - p[0] * s}px, ${960 - p[1] * s}px) scale(${s})` }}>
      <OffthreadVideo src={staticFile(src)} startFrom={from} muted style={{ width: vw, height: vh }} />
    </div>
  </AbsoluteFill>
);
const Core: React.FC<CutsProps> = ({ a, b, pa, pb, vw = 1280, vh = 800, start, cut, end, base = 1.35, peak = 5.2, aFrom = 0, bFrom = 0 }) => {
  const frame = useCurrentFrame();
  const inA = frame < cut;
  const tA = clamp((frame - start) / (cut - start)), tB = clamp((frame - cut) / (end - cut));
  const sA = lerp(base, peak, tA * tA * tA), sB = lerp(peak, base, 1 - Math.pow(1 - tB, 3)); // A accelerates in, B decelerates out: matched speed at the cut
  const reveal = clamp((frame - (cut - 4)) / 22); const r = reveal * 160; // mask transition (circle from the matched point)
  return (
    <AbsoluteFill style={{ background: "#0B0D12" }}>
      <Scene src={a} p={pa} s={inA ? sA : peak} vw={vw} vh={vh} from={aFrom} />
      {frame >= cut - 4 && <Sequence from={cut - 4}><Scene src={b} p={pb} s={frame < cut ? peak : sB} vw={vw} vh={vh} from={bFrom} clip={`circle(${r}% at 50% 50%)`} /></Sequence>}
      {frame >= cut - 4 && frame < cut + 20 && <div style={{ position: "absolute", left: 540 - r * 9, top: 960 - r * 9, width: r * 18, height: r * 18, borderRadius: "50%", border: `8px solid ${theme.lime}`, boxSizing: "border-box", opacity: 1 - reveal, boxShadow: `0 0 40px ${theme.lime}` }} />}
    </AbsoluteFill>
  );
};
/** with true sub-frame motion blur (the cut hides inside the blur). */
export const CinematicCuts: React.FC<CutsProps & { blurSamples?: number }> = ({ blurSamples = 6, ...p }) => <CameraMotionBlur samples={blurSamples} shutterAngle={200}><Core {...p} /></CameraMotionBlur>;
/** the ordinary version: a hard cut A -> B at the same frame, no motion matching. */
export const HardCut: React.FC<{ a: string; b: string; vw?: number; vh?: number; cut: number; base?: number; aFrom?: number; bFrom?: number }> = ({ a, b, vw = 1280, vh = 800, cut, base = 1.35, aFrom = 0, bFrom = 0 }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: "#0B0D12" }}>{frame < cut ? <Scene src={a} p={[640, 400]} s={base} vw={vw} vh={vh} from={aFrom} /> : <Sequence from={cut}><Scene src={b} p={[640, 400]} s={base} vw={vw} vh={vh} from={bFrom} /></Sequence>}</AbsoluteFill>;
};
