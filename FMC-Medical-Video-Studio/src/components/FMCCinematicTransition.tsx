import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (t: number) => t * t * (3 - 2 * t);

/** Frame-accurate soft cross-dissolve (no sound, no blur flashes). */
export const CrossLayer: React.FC<{from: number; dur: number; fade?: number; children: React.ReactNode}> = ({from, dur, fade = 14, children}) => {
  const f = useCurrentFrame();
  if (f < from - 1 || f > from + dur + 1) return null;
  const o = Math.min(ss(clamp((f - from) / fade)), 1 - ss(clamp((f - (from + dur - fade)) / fade)));
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

export type Cam = {s0: number; s1: number; x0?: number; x1?: number; y0?: number; y1?: number; origin?: string};

/** Slow constant-motion camera (push/pull + drift). Children (e.g. tracked overlays) share the transform so they stay aligned with the footage. */
export const CameraBox: React.FC<{from: number; dur: number; cam: Cam; children: React.ReactNode}> = ({from, dur, cam, children}) => {
  const f = useCurrentFrame();
  const e = ss(clamp((f - from) / dur));
  const s = cam.s0 + (cam.s1 - cam.s0) * e, x = (cam.x0 ?? 0) + ((cam.x1 ?? 0) - (cam.x0 ?? 0)) * e, y = (cam.y0 ?? 0) + ((cam.y1 ?? 0) - (cam.y0 ?? 0)) * e;
  return <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(${s})`, transformOrigin: cam.origin ?? '50% 45%'}}>{children}</AbsoluteFill>;
};

/** Muted footage (source audio already removed with ffmpeg -an). */
export const Footage: React.FC<{file: string; startFrom?: number; pos?: string}> = ({file, startFrom = 0, pos = '50% 50%'}) => (
  <OffthreadVideo src={staticFile(file)} muted startFrom={startFrom} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}} />
);
